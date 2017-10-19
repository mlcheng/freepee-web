/***********************************************

  "bathroom.js"

  Created by Michael Cheng on 09/10/2016 20:14
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals module, require, $http, iqwerty, google */

const Constants = require('../../../../assets/js/constants');
const Util = require('../../../../assets/js/util');
const MainMap = require('./mainmap');
const ViewModel = require('./viewmodel');
const Google = require('./google');
const Apis = require('./apis');

let shell = module.exports;

const MAP_VIEW_SMALL = 'map-view-small';
const DEFAULT_SMALL_MAP_OPTIONS = {
	zoom: 18,
	zoomControl: true,
	disableDefaultUI: true,
	draggable: false,
	scrollwheel: false,
	disableDoubleClickZoom: true,
	streetViewControl: true
};

/**
 * The Google map for the panel view
 */
let _map;

shell.openPanel = function(id) {
	showLoading();
	MainMap.openPanel().then(() => {
		$http(`${Constants.API.URL}bathroom/get/id/${id}`)
			.cache()
			.get()
			.then(bathroom => {
				bathroom = JSON.parse(bathroom)[0];
				bindBathroomData(bathroom);

				Apis.map.loaded().then(() => {
					initMap({
						lat: bathroom.lat,
						lng: bathroom.lng
					});
					attachBathroom(bathroom);
				});

				Apis.auth.loaded().then(() => {
					getMyRating(id, ViewModel.model.user.guser.id);

					// Can the user delete the bathroom
					ViewModel.model.view.panel.display.delete = bathroom.userid === ViewModel.model.user.guser.id;
				});
			});
	});
};

shell.closePanel = function() {
	MainMap.closePanel();
	_map = null;
};

/**
 * Do the actions necessary to show the panel to add a bathroom
 */
shell.addBathroom = function(center = ViewModel.model.map.instance.getCenter()) {
	if(!ViewModel.model.user.guser.token) {
		// User isn't logged in
		iqwerty.snackbar.Snackbar('You are not logged in', 'Login',
			Google.signIn,
			{
				settings: {
					duration: 6000
				}
			}
		);
		return;
	}

	MainMap.openPanel();
	hideLoading();

	ViewModel.model.view.panel.display.detail = 'false';
	ViewModel.model.view.panel.display.add = 'true';


	// Let the map be draggable to allow precise adding of bathrooms
	let options = Object.assign({}, DEFAULT_SMALL_MAP_OPTIONS);
	options.draggable = true;

	const { lat, lng } = ViewModel.model.map.location;

	initMap({ lat, lng }, {
		lat: center.lat(),
		lng: center.lng()
	}, options);

	_map.addListener('idle', () => {
		$http(`${Constants.API.URL}geocode/get/coords/${_map.center.lat()},${_map.center.lng()}`)
			.get()
			.then(response => {
				response = JSON.parse(response);
				// The response is an array, ordered from most accurate to
				// least accurate.
				ViewModel.model.view.panel.add.approx_address = response.results.shift().formatted_address;
			});
	});
};

/**
 * Perform the actions necessary to show the panel to edit a bathroom description.
 * @param {HTMLElement} el The description element
 */
shell.editBathroom = (el) => {
	if(!ViewModel.model.view.guser.signedIn) {
		return; // User is not signed in.
	}

	// Stop listening for clicks it it's already in edit mode. This was a bug that caused many event listeners to be added if the div is clicked while it's already in edit mode. Thus, many blur listeners were also added...
	if(el.contentEditable === 'true') return;

	el.contentEditable = true;
	el.focus();

	const origDesc = el.innerText;
	el.addEventListener('blur', () => {
		el.removeAttribute('contenteditable');

		// Don't edit if the content didn't change.
		if(el.innerText === origDesc) return;

		// Send edit request.
		$http(`${Constants.API.URL}bathroom/edit/id/${ViewModel.model.map.selectedBathroom.id}`)
			.post({
				gid: ViewModel.model.user.guser.id,
				ukey: ViewModel.model.user.guser.token,
				desc: el.innerText
			})
			.then(() => {
				iqwerty.toast.Toast('Thank you for your contribution!');
			})
			.catch(() => iqwerty.toast.Toast('You must be logged in to edit'));
	}, {
		once: true
	});
};

/**
 * Submit the form for adding a bathroom.
 */
shell.create = () => {
	// Description textarea, used to get and clear the value.
	const description = document.querySelector('#panel-view [contenteditable]');

	// First disable the submit button
	ViewModel.model.view.panel.add.submitDisabled = true;

	// Then send the network request
	$http(`${Constants.API.URL}bathroom/create`)
		.post({
			gid: ViewModel.model.user.guser.id,
			ukey: ViewModel.model.user.guser.token,
			coords: `${_map.center.lat()},${_map.center.lng()}`,
			desc: description.innerText
		})
		.then(() => {
			ViewModel.model.view.panel.add.submitDisabled = false;
			description.innerText = '';
			iqwerty.toast.Toast('Thank you for your contribution!');
			shell.closePanel();
			MainMap.getBathrooms();
		})
		.catch(() => {
			ViewModel.model.view.panel.add.submitDisabled = false;

			// Allow the user to reload the page if they wish.
			iqwerty.snackbar.Snackbar('Sorry, there was an error. Try reloading the page?', 'Reload', () => {
				window.location.reload();
			});
		});
};

shell.delete = () => {
	if(!window.confirm('Are you sure you want to delete this?')) return;

	$http(`${Constants.API.URL}bathroom/delete/id/${ViewModel.model.map.selectedBathroom.id}`)
		.post({
			gid: ViewModel.model.user.guser.id,
			ukey: ViewModel.model.user.guser.token
		})
		.then(() => {
			iqwerty.history.Push('');
			shell.closePanel();
			MainMap.reloadMap();
		})
		.catch(() => iqwerty.toast.Toast('You must have added this bathroom to delete it.'));
};

shell.upvote = () => {
	vote('up');
};

shell.downvote = () => {
	vote('down');
};

function vote(score) {
	$http(`${Constants.API.URL}bathroom/vote/${score}/${ViewModel.model.map.selectedBathroom.id}`)
		.post({
			gid: ViewModel.model.user.guser.id,
			ukey: ViewModel.model.user.guser.token
		})
		.then(aggregatedVotes => {
			iqwerty.toast.Toast('Thank you for your contribution!');


			// Update the view
			let votes = JSON.parse(aggregatedVotes);
			delete votes.total_score;

			Object.keys(votes).forEach(vote => {
				ViewModel.model.map.selectedBathroom[vote] = votes[vote];
			});

			ViewModel.model.map.selectedBathroom.myRating = score === 'up' ? 1 : -1;
		})
		.catch(() => iqwerty.toast.Toast('You must be logged in to vote'));
}

function showLoading() {
	document.querySelector('.' + Constants.Iden.LOADING).classList.remove(Constants.Iden.HIDDEN);
}

function hideLoading() {
	document.querySelector('.' + Constants.Iden.LOADING).classList.add(Constants.Iden.HIDDEN);
}

function initMap(location, center = location, options = DEFAULT_SMALL_MAP_OPTIONS) {
	_map = new google.maps.Map(document.getElementById(MAP_VIEW_SMALL), options);
	_map.setCenter({ lat: center.lat, lng: center.lng });

	const { lat, lng, accuracy } = ViewModel.model.map.location;
	MainMap.addMyLocationMarker(_map, { lat, lng }, accuracy);
}

function attachBathroom(bathroom) {
	let marker = new google.maps.Marker({
		position: {
			lat: bathroom.lat,
			lng: bathroom.lng
		},
		icon: Constants.ToiletImage.BATHROOM_MARKER
	});
	marker.setMap(_map);
}

function bindBathroomData(bathroom) {
	hideLoading();

	ViewModel.model.view.panel.display.detail = 'true';
	ViewModel.model.view.panel.display.add = 'false';

	// Sanitize the description
	bathroom.description = Util.sanitize(bathroom.description);

	Object.assign(ViewModel.model.map.selectedBathroom, bathroom);
}

function getMyRating(id, gid) {
	$http(`${Constants.API.URL}bathroom/query/id/${id}`)
		.get({
			vote: true,
			gid
		})
		.then(rating => {
			ViewModel.model.map.selectedBathroom.myRating = JSON.parse(rating).vote;
		});
}