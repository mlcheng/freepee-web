/***********************************************

  "google.js"

  Created by Michael Cheng on 09/10/2016 20:13
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* globals module, require, gapi, $http, iqwerty */

const Constants = require('../../../../assets/js/constants');
const ViewModel = require('./viewmodel');
const Apis = require('./apis');

const SIGN_IN_BUTTON = 'sign-in--google';

let shell = module.exports;

let _auth;

let _guser;

shell.loadAuth = function() {
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

		// Defer render. Not sure why though.
		setTimeout(_renderLoginButton);
	});
};

shell.signIn = function() {
	document.getElementById(SIGN_IN_BUTTON).children[0].click();
};

shell.loginSuccess = function() {

};

shell.loginFailure = function() {
	iqwerty.snackbar.Snackbar('Login failed', 'Try again',
		shell.signIn,
		{
			settings: {
				duration: 6000
			}
		}
	);
};

shell.logout = function() {
	_auth.disconnect();
	ViewModel.model.view.guser.signedIn = false;
};

function _signInChanged(signedIn) {
	if(signedIn) {
		document.getElementById(SIGN_IN_BUTTON).style.display = 'none';

		// Login the user
		let user = ViewModel.model.user.guser;
		$http(`${Constants.API.URL}login`)
			.post({
				gid: user.id,
				ukey: user.token
			});
	} else {
		document.getElementById(SIGN_IN_BUTTON).style.display = '';
	}
}

function _userChanged(guser) {
	_guser = guser;
	const profile = guser.getBasicProfile();
	if(!profile) return;

	let userModel = ViewModel.model.user.guser;

	userModel.token = _guser.getAuthResponse().id_token;
	userModel.name = profile.getGivenName();
	userModel.id = profile.getId();
	userModel.gpURL = `https://plus.google.com/${userModel.id}`;
	userModel.pic = profile.getImageUrl();

	if(userModel.token) {
		ViewModel.model.view.guser.signedIn = true;
	}

	Apis.auth.resolve();
}

function _renderLoginButton() {
	// Retry rendering if the button isn't there yet. Seems to be a problem on Firefox and perhaps mobile Safari.
	if(!document.getElementById(SIGN_IN_BUTTON)) {
		return setTimeout(_renderLoginButton);
	}

	gapi.signin2.render(SIGN_IN_BUTTON, {
		'scope': 'email profile',
		'width': 110,
		'height': 30,
		'theme': 'dark',
		'onsuccess': shell.loginSuccess,
		'onfailure': shell.loginFailure
	});
}