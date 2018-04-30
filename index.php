<?php
/***********************************************

  "index.php"

  Created by Michael Cheng on 12/27/2015 15:01
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/
require_once("../functions.php");
?>
<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="initial-scale=1.0, user-scalable=no">
		<meta name="description" content="Find free bathrooms near you!">
		<meta name="theme-color" content="#00838f">
		<meta property="og:title" content="Free Pee">
		<meta property="og:description" content="Find free bathrooms near you!">
		<meta property="og:image" content="https://www.iqwerty.net/freepee/assets/images/logo.png">

		<!-- favicon stuff -->
		<link rel="apple-touch-icon" sizes="180x180" href="<?= Config::$serverRoot ?>favicon-apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="<?= Config::$serverRoot ?>favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="<?= Config::$serverRoot ?>favicon-16x16.png">
		<link rel="icon" type="image/x-icon" href="<?= Config::$serverRoot ?>favicon.ico">
		<link rel="manifest" href="<?= Config::$serverRoot ?>webmanifest.webmanifest">

		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300" type="text/css">
		<link rel="stylesheet" href="<?= Utils::getAppendedFileHash("mobile/assets/styles/map.min.css") ?>">

		<!-- my libraries -->
		<script>
		'use strict';
		/* exported serverRoot */
		const serverRoot = '<?= Config::$serverRoot ?>';
		</script>

		<!-- iQwerty Quantum.js -->
		<script src="<?= Constants::IQ_LIB_PATH ?>quantum/quantum.js"></script>

		<!-- Dev scripts -->
		<script src="<?= Config::$serverRoot ?>mobile/assets/js/MarkerClusterer.min.js"></script>
		<script src="<?= Config::$serverRoot ?>mobile/assets/js/freepee.mod.js"></script>

		<script>
		'use strict';

		/* global require */
		/* exported __api_getLocation, __api_loadAuth */

		var iqwerty = iqwerty || {};
		iqwerty.freepee = require('iqwerty-freepee');

		// Google API callback functions
		function __api_getLocation() {
			iqwerty.freepee.MainMap.getLocation();
			iqwerty.freepee.Apis.map.resolve();
		}

		function __api_loadAuth() {
			iqwerty.freepee.Google.loadAuth();
		}
		</script>


		<!-- Get Google Maps API -->
		<script src="https://maps.googleapis.com/maps/api/js?v=3&key=<?= Constants::GOOGLE_MAPS_KEY ?>&libraries=places&callback=__api_getLocation"></script>

		<!-- Get Google+ login API -->
		<!-- Note, the callback doesn't work with '.', since it's called as window[callback] -->
		<script async defer src="https://apis.google.com/js/platform.js?onload=__api_loadAuth"></script>


		<title>Free Pee</title>
	</head>
	<body data-iq-bind-to="data-writable:view.database.writable">
		<div id="overlay" class="hidden"></div>
		<div
			id="panel"
			class="hidden"
			data-iq-template-src="<?= Config::$serverRoot ?>mobile/assets/templates/panel.html"
			data-iq-template-loaded="iqwerty.freepee.ViewModel.template.bindBathroomData">
		</div>


		<div
			id="toolbar"
			data-iq-template-src="<?= Config::$serverRoot ?>mobile/assets/templates/toolbar.html"
			data-iq-template-loaded="iqwerty.freepee.ViewModel.template.bindToolbarData">
		</div>

		<div id="search" class="hidden">
			<input type="text" placeholder="type a location..." data-iq-bind-to="value:search.place">
			<button></button>
		</div>

		<button
			class="fab fab--search"
			onclick="iqwerty.freepee.MainMap.toggleSearch();">
		</button>

		<button
			class="fab fab--add-bathroom"
			onclick="iqwerty.freepee.Bathroom.addBathroom();">
		</button>

		<div id="map-view" class="loading"></div>
	</body>
</html>