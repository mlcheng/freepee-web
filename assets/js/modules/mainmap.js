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
const fs = require('fs');

/**
 * Exposed methods and functions
 * @type {Object}
 */
let shell = module.exports;

const MAP_VIEW = 'map-view';
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

shell.BaseStateController = function() {
	shell.closePanel();
};

shell.BathroomStateController = function(id) {
	Bathroom.openPanel(id);
};

shell.openPanel = function() {
	var panel = document.getElementById('panel');
	var overlay = document.getElementById('overlay');
	panel.classList.remove(Constants.Iden.HIDDEN);
	overlay.classList.remove(Constants.Iden.HIDDEN);
};

shell.closePanel = function() {
	var panel = document.getElementById('panel');
	var overlay = document.getElementById('overlay');
	panel.classList.add(Constants.Iden.HIDDEN);
	overlay.classList.add(Constants.Iden.HIDDEN);
};

shell.getLocation = function() {
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
	//navigator.geolocation.watchPosition(success, error, options);
};

shell.addMyLocationMarker = function(map, location, accuracy) {
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
		strokeColor: '#00838f',
		strokeWeight: 1,
		fillColor: '#00838f',
		fillOpacity: 0.15,
		map: map,
		center: location,
		radius: accuracy
	});
};

shell.toggleSearch = function() {
	const search = document.getElementById(Constants.Iden.SEARCH);
	search.classList.toggle(Constants.Iden.HIDDEN);
	if(!search.classList.contains(Constants.Iden.HIDDEN)) {
		search.querySelector('input').focus();
	}
};

function locationUnavailable() {
	iqwerty.toast.Toast('Geolocation is not supported on your device');
	initBasicMap();
}

function locationAvailable() {
	return 'geolocation' in navigator;
}

function initBasicMap() {
	_map = new google.maps.Map(document.getElementById(MAP_VIEW), DEFAULT_MAP_OPTIONS);
	ViewModel.model.map.instance = _map;
	updateMapOnMoved();
}

// function accuracyNotification(accuracy) {
// 	_map.addListener('idle', function() {
// 		iqwerty.toast.Toast(`Location accuracy is ${accuracy} meters`);
// 		google.maps.event.clearListeners(_map, 'idle');
// 	});
// }

function initMap(position) {
	let coords = position.coords;
	let mapModel = ViewModel.model.map;
	mapModel.location = {
		lat: coords.latitude,
		lng: coords.longitude,
		accuracy: coords.accuracy
	};

	let options = Object.assign({}, DEFAULT_MAP_OPTIONS);

	//The following will mutate the default options!!
	options.zoom = 20;
	options.center = {
		lat: mapModel.location.lat,
		lng: mapModel.location.lng
	};
	_map = new google.maps.Map(document.getElementById(MAP_VIEW), options);
	ViewModel.model.map.instance = _map;

	//Add location marker to map
	shell.addMyLocationMarker(_map, options.center, mapModel.location.accuracy);

	updateMapOnMoved();
}

/**
 * Update map when it's panned
 */
function updateMapOnMoved() {
	_map.addListener('idle', getBathrooms);
}

/**
 * Get bathrooms based on map center and zoom
 */
function getBathrooms() {
	var coords = _map.getCenter();
	$http(`${Constants.API.URL}bathroom/get/coords/${coords.lat()},${coords.lng()},${_map.getZoom()}z`)
		.cache()
		.get()
		.then(response => {
			if(response) {
				attachBathrooms(JSON.parse(response));
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
	// `bathroom` is used in the template

	// jshint evil:true, unused:false
	let template = fs.readFileSync('mobile/assets/templates/info-window.html', 'utf8');
	return eval('`' + template + '`');
}