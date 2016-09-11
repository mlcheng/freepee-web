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

const SIGN_IN_BUTTON = 'sign-in--google';

let shell = module.exports;

let _auth;

let _guser;

shell.guser = {
	token: '',
	name: '',
	id: '',
	gpURL: '',
	pic: Constants.ToiletImage.BATHROOM_MARKER
};

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

		setTimeout(() => _renderLoginButton());
	});
};

shell.loginSuccess = function() {

};

shell.loginFailure = function() {
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

shell.logout = function() {
	_auth.disconnect();
	ViewModel.guser.signedIn = false;
};

function _signInChanged(signedIn) {
	if(signedIn) {
		document.getElementById(SIGN_IN_BUTTON).style.display = 'none';

		// Login the user
		$http(`${Constants.API.URL}login`)
		.post({
			gid: shell.guser.id,
			ukey: shell.guser.token
		});
	} else {
		document.getElementById(SIGN_IN_BUTTON).style.display = '';			
	}
}

function _userChanged(guser) {
	_guser = guser;
	var profile = guser.getBasicProfile();
	if(!profile) return;

	shell.guser.token = _guser.getAuthResponse().id_token;
	shell.guser.name = profile.getGivenName();
	shell.guser.id = profile.getId();
	shell.guser.gpURL = `https://plus.google.com/${shell.guser.id}`;
	shell.guser.pic = profile.getImageUrl();

	if(shell.guser.token) {
		ViewModel.guser.signedIn = true;
	}

	console.log(_guser, shell.guser);
}

function _renderLoginButton() {
	gapi.signin2.render(SIGN_IN_BUTTON, {
		'scope': 'email profile',
		'width': 110,
		'height': 30,
		'theme': 'dark',
		'onsuccess': shell.loginSuccess,
		'onfailure': shell.loginFailure
	});
}