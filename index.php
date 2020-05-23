<?php
/***********************************************

  "index.php"

  Created by Michael Cheng on 12/27/2015 15:01
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/
require_once(__DIR__ . '/../functions.php');
?>
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="initial-scale=1.0, user-scalable=no">
		<meta name="description" content="Find free bathrooms near you!">
		<meta name="theme-color" content="#00838f">
		<meta property="og:title" content="Free Pee">
		<meta property="og:description" content="Find free bathrooms near you!">
		<meta property="og:image" content="https://www.iqwerty.net/freepee/assets/icon/logo.png">

		<!-- Favicon stuff -->
		<link rel="apple-touch-icon" sizes="180x180" href="<?= Config::$serverRoot; ?>assets/icon/favicon-apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="<?= Config::$serverRoot; ?>assets/icon/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="<?= Config::$serverRoot; ?>assets/icon/favicon-16x16.png">
		<link rel="icon" type="image/x-icon" href="<?= Config::$serverRoot; ?>assets/icon/favicon.ico">
		<link rel="manifest" href="<?= Config::$serverRoot; ?>webmanifest.webmanifest">

		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300" type="text/css">
		<link rel="stylesheet" href="<?= Config::$serverRoot; ?>mobile/assets/styles/map.min.css">

		<!-- My libraries -->
		<script>
		'use strict';
		/* exported serverRoot */
		const serverRoot = '<?= Config::$serverRoot; ?>';
		</script>

		<!-- iQwerty Quantum.js -->
		<script src="<?= Constants::IQ_LIB_PATH; ?>quantum/quantum.min.js"></script>

		<!-- Dev scripts -->
		<script src="<?= Config::$serverRoot; ?>mobile/assets/js/marker_clusterer.js"></script>
		<script src="<?= Config::$serverRoot; ?>mobile/assets/js/freepee.min.js"></script>

		<script>
		/* global iqwerty */
		/* exported __api_getLocation, __api_loadAuth */
		'use strict';

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
		<script src="https://maps.googleapis.com/maps/api/js?v=3&key=<?= Constants::GOOGLE_MAPS_KEY; ?>&libraries=places&callback=__api_getLocation" async defer></script>

		<!-- Get Google+ login API -->
		<!-- Note, the callback doesn't work with '.', since it's called as window[callback] -->
		<script src="https://apis.google.com/js/platform.js?onload=__api_loadAuth" async defer></script>

		<title>Free Pee</title>
	</head>
	<body data-iq-bind-to="data-writable:database.writable">
		<div id="overlay" class="hidden"></div>
		<div
			id="panel"
			class="hidden"
			data-iq-template-src="<?= Config::$serverRoot; ?>mobile/assets/templates/panel.html"
			data-iq-template-loaded="iqwerty.freepee.Callback.panelLoadedCallback">
		</div>

		<div
			id="toolbar"
			data-iq-template-src="<?= Config::$serverRoot; ?>mobile/assets/templates/toolbar.html"
			data-iq-template-loaded="iqwerty.freepee.Callback.toolbarLoadedCallback">
		</div>

		<div id="search" class="hidden">
			<input
				type="text"
				placeholder="find a place..."
				data-iq-bind-to="value:search.place">
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