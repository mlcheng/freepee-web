/***********************************************

  "bathroom.js"

  Created by Michael Cheng on 09/10/2016 20:14
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

/* global iqwerty, google */
'use strict';

import { Api, Iden, ToiletImage } from './../../../../assets/js/constants';
import { sanitize } from './../../../../assets/js/util';
import * as MainMap from './mainmap';
import * as Google from './google';
import { Apis } from './apis';
import { ViewModel } from './viewmodel';

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

export function BathroomStateController(id) {
	openPanel(id);
}

export function openPanel(id) {
	showLoading();
	MainMap.openPanel().then(() => {
		iqwerty.http.request(`${Api.URL}bathroom/get/id/${id}`)
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
					getMyRating(id, ViewModel.guser.id);

					// Can the user delete the bathroom
					ViewModel.panel.display.delete = bathroom.userid === ViewModel.guser.id;
				});
			});
	});
}

export function closePanel() {
	MainMap.closePanel();
	_map = null;
}

/**
 * Do the actions necessary to show the panel to add a bathroom
 */
export function addBathroom(center = ViewModel.map.instance.getCenter()) {
	if(!ViewModel.guser.token) {
		// User isn't logged in
		iqwerty.snackbar.snackbar('You are not logged in', 'Login',
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

	ViewModel.panel.display.detail = 'false';
	ViewModel.panel.display.add = 'true';


	// Let the map be draggable to allow precise adding of bathrooms
	const options = Object.assign({}, DEFAULT_SMALL_MAP_OPTIONS);
	options.draggable = true;

	const { lat, lng } = ViewModel.map.location;

	initMap({ lat, lng }, {
		lat: center.lat(),
		lng: center.lng()
	}, options);

	_map.addListener('idle', () => {
		iqwerty.http.request(`${Api.URL}geocode/get/coords/${_map.center.lat()},${_map.center.lng()}`)
			.get()
			.then(response => {
				response = JSON.parse(response);
				// The response is an array, ordered from most accurate to least accurate.
				ViewModel.panel.add.approx_address = response.results.shift().formatted_address;
			});
	});
}

/**
 * Perform the actions necessary to show the panel to edit a bathroom description.
 * @param {HTMLElement} el The description element
 */
export function editBathroom(el) {
	if(!ViewModel.guser.signedIn) {
		return; // User is not signed in.
	}

	if(ViewModel.guser.id !== ViewModel.map.selectedBathroom.userid) {
		return; // User is not allowed to edit bathroom description.
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
		iqwerty.http.request(`${Api.URL}bathroom/edit/id/${ViewModel.map.selectedBathroom.id}`)
			.post({
				gid: ViewModel.guser.id,
				ukey: ViewModel.guser.token,
				desc: el.innerText
			})
			.then(() => {
				iqwerty.toast.toast('Thank you for your contribution!');
			})
			.catch(() => iqwerty.toast.toast('You must be logged in to edit'));
	}, { once: true	});
}

/**
 * Submit the form for adding a bathroom.
 */
export function create() {
	// Description textarea, used to get and clear the value.
	const description = document.querySelector('#panel-view [contenteditable]');

	// First disable the submit button
	ViewModel.panel.add.submitDisabled = true;

	// Get wrapped lat/lng values
	const coords = new google.maps.LatLng(_map.center.lat(), _map.center.lng());

	// Then send the network request
	iqwerty.http.request(`${Api.URL}bathroom/create`)
		.post({
			gid: ViewModel.guser.id,
			ukey: ViewModel.guser.token,
			coords: `${coords.lat()},${coords.lng()}`,
			desc: description.innerText
		})
		.then(() => {
			ViewModel.panel.add.submitDisabled = false;
			description.innerText = '';
			iqwerty.toast.toast('Thank you for your contribution!');
			closePanel();
			MainMap.getBathrooms();
		})
		.catch(() => {
			ViewModel.panel.add.submitDisabled = false;

			// Allow the user to reload the page if they wish.
			iqwerty.snackbar.snackbar('Sorry, there was an error. Try reloading the page?', 'Reload', () => {
				window.location.reload();
			});
		});
}

export function remove() {
	if(!window.confirm('Are you sure you want to delete this bathroom?')) return;

	iqwerty.http.request(`${Api.URL}bathroom/delete/id/${ViewModel.map.selectedBathroom.id}`)
		.post({
			gid: ViewModel.guser.id,
			ukey: ViewModel.guser.token,
		})
		.then(() => {
			iqwerty.history.pushState('');
			closePanel();
			MainMap.reloadMap();
		})
		.catch(() => iqwerty.toast.toast('You must have added this bathroom to delete it.'));
}

export function upvote() {
	vote('up');
}

export function downvote() {
	vote('down');
}

function vote(score) {
	iqwerty.http.request(`${Api.URL}bathroom/vote/${score}/${ViewModel.map.selectedBathroom.id}`)
		.post({
			gid: ViewModel.guser.id,
			ukey: ViewModel.guser.token,
		})
		.then(aggregatedVotes => {
			iqwerty.toast.toast('Thank you for your contribution!');

			// Update the view
			const votes = JSON.parse(aggregatedVotes);
			delete votes.total_score;

			Object.keys(votes).forEach(vote => {
				ViewModel.map.selectedBathroom[vote] = votes[vote];
			});

			ViewModel.map.selectedBathroom.myRating = score === 'up' ? 1 : -1;
		})
		.catch(() => iqwerty.toast.toast('You must be logged in to vote'));
}

function showLoading() {
	document.querySelector('.' + Iden.LOADING).classList.remove(Iden.HIDDEN);
}

function hideLoading() {
	document.querySelector('.' + Iden.LOADING).classList.add(Iden.HIDDEN);
}

function initMap(location, center = location, options = DEFAULT_SMALL_MAP_OPTIONS) {
	_map = new google.maps.Map(document.getElementById(MAP_VIEW_SMALL), options);
	_map.setCenter({ lat: center.lat, lng: center.lng });

	const { lat, lng, accuracy } = ViewModel.map.location;
	MainMap.addMyLocationMarker(_map, { lat, lng }, accuracy);
}

function attachBathroom(bathroom) {
	let marker = new google.maps.Marker({
		position: {
			lat: bathroom.lat,
			lng: bathroom.lng
		},
		icon: ToiletImage.BATHROOM_MARKER
	});
	marker.setMap(_map);
}

function bindBathroomData(bathroom) {
	hideLoading();

	ViewModel.panel.display.detail = 'true';
	ViewModel.panel.display.add = 'false';

	// Sanitize the description
	bathroom.description = sanitize(bathroom.description);

	Object.assign(ViewModel.map.selectedBathroom, bathroom);
}

function getMyRating(id, gid) {
	$http(`${Api.URL}bathroom/query/id/${id}`)
		.get({
			vote: true,
			gid
		})
		.then(rating => {
			ViewModel.map.selectedBathroom.myRating = JSON.parse(rating).vote;
		});
}