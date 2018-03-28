/***********************************************

  "mainmap.js"

  Created by Michael Cheng on 09/10/2016 20:14
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals module, require, serverRoot, google, MarkerClusterer, $http, iqwerty */

const Constants = require('../../../../assets/js/constants');
const Bathroom = require('./bathroom');
const ViewModel = require('./viewmodel');
/* exported Util */
const Util = require('../../../../assets/js/util');
const fs = require('fs');

// First check database status.
$http(`${Constants.API.URL}status`).get().then(status => {
	ViewModel.model.view.database.writable = status;
});

/**
 * Exposed methods and functions
 * @type {Object}
 */
let shell = module.exports;

const DEFAULT_MAP_OPTIONS = {
	zoom: 3,
	center: {
		lat: 0,
		lng: 0
	},
	disableDefaultUI: true
};


/**
 * The Google map for the main view
 * @type {Object}
 */
let _map;

/**
 * The bathroom markers on the map
 * @type {Array}
 */
let _markers = [];

let _markerClusterer;

/**
 * The only info window on the page
 * @type {Object}
 */
let _infoWindow = null;

shell.BaseStateController = () => {
	shell.closePanel();
};

shell.BathroomStateController = (id)=>  {
	Bathroom.openPanel(id);
};

shell.openPanel = () => {
	var panel = document.getElementById('panel');
	var overlay = document.getElementById('overlay');
	panel.classList.remove(Constants.Iden.HIDDEN);
	overlay.classList.remove(Constants.Iden.HIDDEN);

	// Use a promise to do things after the transition end. Hopefully this helps with performance.
	return new Promise(resolve => {
		let _onTransitionEnd = () => {
			panel.removeEventListener('transitionend', _onTransitionEnd);
			resolve();
		};

		panel.addEventListener('transitionend', _onTransitionEnd);
	});
};

shell.closePanel = () => {
	var panel = document.getElementById('panel');
	var overlay = document.getElementById('overlay');
	panel.classList.add(Constants.Iden.HIDDEN);
	overlay.classList.add(Constants.Iden.HIDDEN);
};

shell.getLocation = () => {
	var success = initMap;
	var error = locationUnavailable;
	var options = {
		enableHighAccuracy: false,
		timeout: 10000
	};

	if(!locationAvailable()) {
		error();
		return false;
	}

	navigator.geolocation.getCurrentPosition(success, error, options);
	// navigator.geolocation.watchPosition(success, error, options);
};

shell.addMyLocationMarker = (map, location, accuracy) => {
	var marker = {
		url: `${serverRoot}mobile/assets/images/location.png`,
		size: new google.maps.Size(20, 20),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(10, 10)
	};
	var myLocation = new google.maps.Marker({
		position: location,
		title: 'My current location',
		icon: marker
	});
	myLocation.setMap(map);
	new google.maps.Circle({
		clickable: false, // This allows the click event to be consumed by the map
		strokeColor: '#00838f',
		strokeWeight: 1,
		fillColor: '#00838f',
		fillOpacity: 0.15,
		map: map,
		center: location,
		radius: accuracy
	});
};

/**
 * Get bathrooms based on map center and zoom
 */
shell.getBathrooms = () => {
	let coords = _map.getCenter();
	const lat = coords.lat(), lng = coords.lng();

	// The center values are not wrapped by default.
	coords = new google.maps.LatLng(lat, lng);

	$http(`${Constants.API.URL}bathroom/get/coords/${coords.toUrlValue()},${_map.getZoom()}z`)
		.get()
		.then(response => {
			if(response) {
				attachBathrooms(JSON.parse(response));
			}
		});
};

/**
 * Remove all markers and reload the map.
 */
shell.reloadMap = () => {
	_markers.forEach(marker => {
		marker.setMap(null); // Remove marker from map.
	});
	_markers.length = 0; // Clear the marker array.
	_markerClusterer.clearMarkers(); // Clear the marker clusterer.

	// Re-request bathrooms.
	shell.getBathrooms();
};

shell.toggleSearch = () => {
	const search = document.getElementById(Constants.Iden.SEARCH);
	search.classList.toggle(Constants.Iden.HIDDEN);
	if(!search.classList.contains(Constants.Iden.HIDDEN)) {
		const input = search.querySelector('input');
		input.value = '';
		input.focus();
	}
};

function locationUnavailable() {
	iqwerty.toast.Toast('Geolocation is not supported on your device');
	initBasicMap();
}

function locationAvailable() {
	return 'geolocation' in navigator;
}

// function accuracyNotification(accuracy) {
// 	_map.addListener('idle', function() {
// 		iqwerty.toast.Toast(`Location accuracy is ${accuracy} meters`);
// 		google.maps.event.clearListeners(_map, 'idle');
// 	});
// }

function initBasicMap() {
	_map = new google.maps.Map(document.getElementById(Constants.Iden.MAP_VIEW), DEFAULT_MAP_OPTIONS);
	ViewModel.model.map.instance = _map;

	setupMapHelpers();
}

function initMap(position) {
	let coords = position.coords;
	let mapModel = ViewModel.model.map;
	mapModel.location = {
		lat: coords.latitude,
		lng: coords.longitude,
		accuracy: coords.accuracy
	};

	let options = Object.assign({}, DEFAULT_MAP_OPTIONS);

	// The following will mutate the default options!!
	options.zoom = 20;
	options.center = {
		lat: mapModel.location.lat,
		lng: mapModel.location.lng
	};

	_map = new google.maps.Map(document.getElementById(Constants.Iden.MAP_VIEW), options);
	ViewModel.model.map.instance = _map;

	// Add location marker to map
	shell.addMyLocationMarker(_map, options.center, mapModel.location.accuracy);

	setupMapHelpers();
}

/**
 * Called after map is initialized. This sets up basic helpers needed on the map.
 */
function setupMapHelpers() {
	_removeMapLoading();
	_updateMapOnMoved();
	_addBathroomOnClick();
	_setupSearch();
}

/**
 * Remove the loading class on the main body when the map is loaded.
 */
function _removeMapLoading() {
	document.getElementById(Constants.Iden.MAP_VIEW).classList.remove(Constants.Iden.LOADING);
}

/**
 * Update map when it's panned
 */
function _updateMapOnMoved() {
	_map.addListener('idle', shell.getBathrooms);
}

/**
 * Open the panel to add a bathroom when it is clicked.
 */
function _addBathroomOnClick() {
	_map.addListener('rightclick', event => {
		Bathroom.addBathroom(event.latLng);
	});
}

/**
 * Setup autocomplete search using Google APIs. This is done once on application init.
 * https://developers.google.com/maps/documentation/javascript/places-autocomplete
 */
function _setupSearch() {
	const input = document.querySelector('#search > input');
	const searchBox = new google.maps.places.SearchBox(input);
	searchBox.addListener('places_changed', () => {
		const places = searchBox.getPlaces();

		if(!places.length) {
			return;
		}

		const go = places.shift();
		const bounds = new google.maps.LatLngBounds();
		if (go.geometry.viewport) {
			// Only geocodes have viewport.
			bounds.union(go.geometry.viewport);
		} else {
			bounds.extend(go.geometry.location);
		}

		_map.fitBounds(bounds);
	});

	input.addEventListener('keyup', (e) => {
		if(e.which === 27) {
			shell.toggleSearch();
		}
	});
}

/**
 * Attach bathroom markers to the map.
 * If the marker already exists, it won't be added again
 * @param  {Array} bathrooms An array of bathroom objects from the API
 */
function attachBathrooms(bathrooms) {
	// The array of new markers that get added from this batch
	var _newMarkers = [];

	var info = createInfoWindow();
	bathrooms
		.filter(bathroom => !_markers.find(exists => bathroom.id === exists.id))
		.forEach(bathroom => {
			// console.info('Attaching new bathroom', bathroom);
			var marker = new google.maps.Marker({
				position: {
					lat: bathroom.lat,
					lng: bathroom.lng
				},
				icon: Constants.ToiletImage.BATHROOM_MARKER,
				title: bathroom.approx_address,
				animation: google.maps.Animation.DROP,
				id: bathroom.id
			});
			marker.setMap(_map);

			//Set marker click
			marker.addListener('click', function() {
				info.open(_map, marker);
				info.setContent(getInfoWindowContent(bathroom));
			});

			_newMarkers.push(marker);
		});

	// Add the new markers to the original array
	_markers.push(..._newMarkers);

	if(!_markerClusterer) {
		_markerClusterer = new MarkerClusterer(_map, _markers, {
			imagePath: serverRoot + 'mobile/assets/images/clusterer/m'
		});
	} else {
		_markerClusterer.addMarkers(_newMarkers);
	}
}

function createInfoWindow() {
	if(!_infoWindow) {
		_infoWindow = new google.maps.InfoWindow();
	}
	return _infoWindow;
}

function getInfoWindowContent(bathroom) {
	// `bathroom` and `Util` is used in the template

	// jshint evil:true, unused:false
	let template = fs.readFileSync('mobile/assets/templates/info-window.html', 'utf8');
	return eval('`' + template + '`');
}