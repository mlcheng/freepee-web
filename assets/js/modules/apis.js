/***********************************************

  "apis.js"

  Created by Michael Cheng on 09/24/2017 16:03
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals module */

/**
 * Notifies that the Map API has loaded.
 */
let mapResolve;
const mapPromise = new Promise(resolve => {
	mapResolve = resolve;
});

/**
 * Notifies that the Auth API has loaded and login status is confirmed.
 */
let authResolve;
const authPromise = new Promise(resolve => {
	authResolve = resolve;
});

let shell = module.exports;

shell.map = {
	loaded() {
		return mapPromise;
	},
	resolve: mapResolve
};

shell.auth = {
	loaded() {
		return authPromise;
	},
	resolve: authResolve
};