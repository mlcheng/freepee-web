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
const MainMap = require('./mainmap');
const Google = require('./google');
const ViewModel = require('./viewmodel');

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
	MainMap.openPanel();

	$http(`${Constants.API.URL}bathroom/get/id/${id}`)
		.cache()
		.get()
		.then(bathroom => {
			bathroom = JSON.parse(bathroom)[0];
			bindBathroomData(bathroom);
			initMap({ lat: bathroom.lat, lng: bathroom.lng });
			attachBathroom(bathroom);
		});
};

shell.closePanel = function() {
	MainMap.closePanel();
	_map = null;
};

shell.addBathroom = function() {
	MainMap.openPanel();
	hideLoading();

	ViewModel.view.panel.display.detail = '';
	ViewModel.view.panel.display.add = 'true';


	// Let the map be draggable to allow precise adding of bathrooms
	let options = Object.assign({}, DEFAULT_SMALL_MAP_OPTIONS);
	options.draggable = true;

	const { lat, lng } = MainMap.location;
	initMap({ lat, lng }, options);
};

shell.upvote = function() {
	vote('up');
};

shell.downvote = function() {
	vote('down');
};

function vote(score) {
	$http(`${Constants.API.URL}bathroom/vote/${score}/${MainMap.selectedBathroom.id}`)
		.post({
			gid: Google.guser.id,
			ukey: Google.guser.token
		})
		.then(aggregatedVotes => {
			iqwerty.toast.Toast('Thank you for your contribution!');


			// Update the view
			let votes = JSON.parse(aggregatedVotes);
			delete votes.total_score;

			Object.keys(votes).forEach(vote => {
				MainMap.selectedBathroom[vote] = votes[vote];
			});
		})
		.catch(() => iqwerty.toast.Toast('You must be logged in to vote'));
}

function showLoading() {
	document.querySelector('.' + Constants.Iden.LOADING).classList.remove(Constants.Iden.HIDDEN);
}

function hideLoading() {
	document.querySelector('.' + Constants.Iden.LOADING).classList.add(Constants.Iden.HIDDEN);
}

function initMap(location, options = DEFAULT_SMALL_MAP_OPTIONS) {
	if(typeof google === 'undefined') {
		/*
		OMG. Such a bad hack
		The `google` object isn't necessarily available yet
		But I will have so many callbacks to manage if I notify the panel when the Map API is loaded
		So...just re-init the map if `google` isn't available yet...
		 */
		setTimeout(() => initMap(location, options), 100);
	}
	_map = new google.maps.Map(document.getElementById(MAP_VIEW_SMALL), options);
	_map.setCenter({ lat: location.lat, lng: location.lng });

	const { lat, lng, accuracy } = MainMap.location;
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

	ViewModel.view.panel.display.detail = 'true';
	ViewModel.view.panel.display.add = '';

	Object.assign(MainMap.selectedBathroom, bathroom);
}