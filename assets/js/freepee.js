/***********************************************

  "freepee.js"

  Created by Michael Cheng on 01/04/2016 12:50
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals require, __dirname, google, serverRoot, $http, MarkerClusterer, gapi */

/* exported __template */

const fs = require('fs');

var iqwerty = iqwerty || {};
iqwerty.freepee = iqwerty.freepee || {};


const Constants = iqwerty.freepee.Constants;

/**
 * Holds properties for the view, used with Binding
 * @type {Object}
 */
var __view__ = {
	guser: {
		signedIn: false
	},
	panel: {
		display: {
			detail: 'false',
			add: 'false'
		},
		add: {
			approx_address: null,
			description: null
		}
	}
};


iqwerty.freepee.Map = (function() {
	/**
	 * Exposed methods and functions
	 * @type {Object}
	 */
	var exports = {};

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
	var _map;

	/**
	 * The bathroom markers on the map
	 * @type {Array}
	 */
	var _markers = [];

	var _markerClusterer;

	/**
	 * The only info window on the page
	 * @type {Object}
	 */
	var _infoWindow = null;


	/**
	 * The selected bathroom; used for data binding on the panel
	 * @type {Object}
	 */
	exports.selectedBathroom = {};

	/**
	 * The search query, used for data binding
	 * @type {Object}
	 */
	exports.search = { place: '' };

	exports.location = {};

	exports.BaseStateController = function() {
		exports.closePanel();
	};

	exports.BathroomStateController = function(id) {
		iqwerty.freepee.Bathroom.openPanel(id);
	};

	exports.openPanel = function() {
		var panel = document.getElementById('panel');
		var overlay = document.getElementById('overlay');
		panel.classList.remove(Constants.Iden.HIDDEN);
		overlay.classList.remove(Constants.Iden.HIDDEN);
	};

	exports.closePanel = function() {
		var panel = document.getElementById('panel');
		var overlay = document.getElementById('overlay');
		panel.classList.add(Constants.Iden.HIDDEN);
		overlay.classList.add(Constants.Iden.HIDDEN);
	};

	exports.getLocation = function() {
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

	exports.addMyLocationMarker = function(map, location, accuracy) {
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

	exports.toggleSearch = function() {
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
		updateMapOnMoved();
	}

	// function accuracyNotification(accuracy) {
	// 	_map.addListener('idle', function() {
	// 		iqwerty.toast.Toast(`Location accuracy is ${accuracy} meters`);
	// 		google.maps.event.clearListeners(_map, 'idle');
	// 	});
	// }

	function initMap(position) {
		var coords = position.coords;
		exports.location = {
			lat: coords.latitude,
			lng: coords.longitude,
			accuracy: coords.accuracy
		};

		var options = Object.assign({}, DEFAULT_MAP_OPTIONS);

		//The following will mutate the default options!!
		options.zoom = 20,
		options.center = {
			lat: exports.location.lat,
			lng: exports.location.lng
		};
		_map = new google.maps.Map(document.getElementById(MAP_VIEW), options);

		//Add location marker to map
		exports.addMyLocationMarker(_map, options.center, exports.location.accuracy);

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
				//console.info('Attaching new bathroom', bathroom);
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
		var template = eval('`' + fs.readFileSync(__dirname + '/../templates/infowindow.html', 'utf8') + '`');
		return template;
	}

	return exports;
})();

iqwerty.freepee.Bathroom = (function() {
	var exports = {};

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
	var _map;

	exports.openPanel = function(id) {
		showLoading();
		iqwerty.freepee.Map.openPanel();

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

	exports.closePanel = function() {
		iqwerty.freepee.Map.closePanel();
		_map = null;
	};

	exports.addBathroom = function() {
		iqwerty.freepee.Map.openPanel();
		hideLoading();

		__view__.panel.display.detail = '';
		__view__.panel.display.add = 'true';


		// Let the map be draggable to allow precise adding of bathrooms
		let options = Object.assign({}, DEFAULT_SMALL_MAP_OPTIONS);
		options.draggable = true;

		const { lat, lng } = iqwerty.freepee.Map.location;
		initMap({ lat, lng }, options);
	};

	exports.upvote = function() {
		vote('up');
	};

	exports.downvote = function() {
		vote('down');
	};

	function vote(score) {
		$http(`${Constants.API.URL}bathroom/vote/${score}/${iqwerty.freepee.Map.selectedBathroom.id}`)
			.post({
				gid: iqwerty.freepee.Google.guser.id,
				ukey: iqwerty.freepee.Google.guser.token
			})
			.then(aggregatedVotes => {
				iqwerty.toast.Toast('Thank you for your contribution!');


				// Update the view
				let votes = JSON.parse(aggregatedVotes);
				delete votes.total_score;

				Object.keys(votes).forEach(vote => {
					iqwerty.freepee.Map.selectedBathroom[vote] = votes[vote];
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

		const { lat, lng, accuracy } = iqwerty.freepee.Map.location;
		iqwerty.freepee.Map.addMyLocationMarker(_map, { lat, lng }, accuracy);
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

		__view__.panel.display.detail = 'true';
		__view__.panel.display.add = '';

		Object.assign(iqwerty.freepee.Map.selectedBathroom, bathroom);
	}

	return exports;
})();

iqwerty.freepee.Google = (function() {
	const SIGN_IN_BUTTON = 'sign-in--google';

	var exports = {};

	var _auth;

	var _guser;

	exports.guser = {
		token: '',
		name: '',
		id: '',
		gpURL: '',
		pic: Constants.ToiletImage.BATHROOM_MARKER
	};

	exports.loadAuth = function() {
		gapi.load('auth2', function() {
			_auth = gapi.auth2.init({
				client_id: Constants.Google.OAUTH_ID,
				scope: 'email profile'
			});

			_auth.isSignedIn.listen(_signInChanged);
			_auth.currentUser.listen(_userChanged);

			if(_auth.isSignedIn.get()) {
				_auth.signIn();
			}

			setTimeout(() => _renderLoginButton());
		});
	};

	function _signInChanged(signedIn) {
		if(signedIn) {
			document.getElementById(SIGN_IN_BUTTON).style.display = 'none';

			// Login the user
			$http(`${Constants.API.URL}login`)
			.post({
				gid: exports.guser.id,
				ukey: exports.guser.token
			});
		} else {
			document.getElementById(SIGN_IN_BUTTON).style.display = '';			
		}
	}

	function _userChanged(guser) {
		_guser = guser;
		var profile = guser.getBasicProfile();
		if(!profile) return;

		exports.guser.token = _guser.getAuthResponse().id_token;
		exports.guser.name = profile.getGivenName();
		exports.guser.id = profile.getId();
		exports.guser.gpURL = `https://plus.google.com/${exports.guser.id}`;
		exports.guser.pic = profile.getImageUrl();

		if(exports.guser.token) {
			__view__.guser.signedIn = true;
		}

		console.log(_guser, exports.guser);
	}

	function _renderLoginButton() {
		gapi.signin2.render(SIGN_IN_BUTTON, {
			'scope': 'email profile',
			'width': 110,
			'height': 30,
			'theme': 'dark',
			'onsuccess': iqwerty.freepee.Google.loginSuccess,
			'onfailure': iqwerty.freepee.Google.loginFailure
		});
	}

	exports.loginSuccess = function() {

	};

	exports.loginFailure = function() {
		iqwerty.snackbar.Snackbar('Login failed', 'Try again',
			function() {
				document.getElementById(SIGN_IN_BUTTON).children[0].click();
			},
			{
				settings: {
					duration: 6000
				}
			}
		);
	};

	exports.logout = function() {
		_auth.disconnect();
		__view__.guser.signedIn = false;
	};

	return exports;
})();


/**
 * Callbacks for when templates are loaded
 * @type {Object}
 */
const __template = {
	bindBathroomData() {
		//Add the selected bathroom to the binding model
		iqwerty.binding.Model({
			bathroom: iqwerty.freepee.Map.selectedBathroom,
			search: iqwerty.freepee.Map.search
		});

		/**
		 * Add state controllers
		 * Must be done after template is loaded...
		 */
		iqwerty.history.States({
			'': iqwerty.freepee.Map.BaseStateController,
			'bathroom/:id': iqwerty.freepee.Map.BathroomStateController
		}, {
			'base': `${serverRoot}m/`
		});
	},

	bindToolbarData() {
		iqwerty.binding.Model({
			guser: iqwerty.freepee.Google.guser,
			view: __view__
		});
	}
};