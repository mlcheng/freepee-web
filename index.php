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

		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300" type="text/css">
		<link rel="stylesheet" href="<?= Utils::getAppendedFileHash("mobile/assets/styles/map.min.css") ?>">

		<!-- my libraries -->
		<script>
		'use strict';
		/* exported serverRoot */
		var serverRoot = '<?= Config::$serverRoot ?>';
		</script>

		<!-- iQwerty Quantum.js -->
		<script src="<?= Constants::IQ_LIB_PATH ?>quantum/quantum.js"></script>

		<!-- Dev scripts -->
		<script src="<?= Config::$serverRoot ?>assets/js/constants.min.js"></script>
		<script src="<?= Config::$serverRoot ?>mobile/assets/js/MarkerClusterer.min.js"></script>
		<script src="<?= Config::$serverRoot ?>mobile/assets/js/freepee.min.js"></script>

		<script>
		'use strict';
		/* exported __api_getLocation, __api_loadAuth */
		/* global iqwerty */

		// Google API callback functions
		function __api_getLocation() {
			iqwerty.freepee.Map.getLocation();
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


		<title>Free Pee &sect; v2</title>
	</head>
	<body>
		<div id="overlay" class="hidden"></div>
		<div
			id="panel"
			class="hidden"
			data-iq-template-src="<?= Config::$serverRoot ?>mobile/assets/templates/panel.html"
			data-iq-template-loaded="__template.bindBathroomData">
		</div>


		<div
			id="toolbar"
			data-iq-template-src="<?= Config::$serverRoot ?>mobile/assets/templates/toolbar.html"
			data-iq-template-loaded="__template.bindToolbarData">
		</div>

		<div id="search" class="hidden">
			<input type="text" placeholder="type a location..." data-iq-bind-to="value:search.place">
			<button></button>
		</div>

		<div id="map-view"></div>

		<button
			class="fab fab--search"
			onclick="iqwerty.freepee.Map.toggleSearch();">
		</button>
		<button
			class="fab fab--add-bathroom"
			onclick="iqwerty.freepee.Bathroom.addBathroom();">
		</button>

		<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1" async defer></' + 'script>')</script>
	</body>
</html>