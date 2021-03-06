/***********************************************

  "google.js"

  Created by Michael Cheng on 09/10/2016 20:13
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

/* global gapi, iqwerty */
'use strict';

import { Google, Api } from './../../../../assets/js/constants';
import { Apis } from './apis';
import { ViewModel } from './viewmodel';

const SIGN_IN_BUTTON = 'sign-in--google';
let _auth;
let _guser;

export function loadAuth() {
	gapi.load('auth2', () => {
		_auth = gapi.auth2.init({
			client_id: Google.OAUTH_ID,
			scope: 'email profile'
		});

		_auth.isSignedIn.listen(_signInChanged);
		_auth.currentUser.listen(_userChanged);

		if(_auth.isSignedIn.get()) {
			_auth.signIn();
		} else {
			Apis.auth.resolve();
		}

		// Defer render. Not sure why though.
		setTimeout(_renderLoginButton);
	});
}

export function signIn() {
	document.getElementById(SIGN_IN_BUTTON).children[0].click();
}

export function loginSuccess() {}

export function loginFailure() {
	iqwerty.snackbar.snackbar('Login failed', 'Try again',
		signIn,
		{
			settings: {
				duration: 6000,
			},
		},
	);
}

export function logout() {
	_auth.disconnect();
	ViewModel.guser.signedIn = false;
}

function _signInChanged(signedIn) {
	if(signedIn) {
		document.getElementById(SIGN_IN_BUTTON).style.display = 'none';

		// Login the user
		let user = ViewModel.guser;
		iqwerty.http.request(`${Api.URL}login`)
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

	const userModel = ViewModel.guser;

	userModel.token = _guser.getAuthResponse().id_token;
	userModel.name = profile.getGivenName();
	userModel.id = profile.getId();
	userModel.gpURL = `https://plus.google.com/${userModel.id}`;
	userModel.pic = profile.getImageUrl();

	if(userModel.token) {
		ViewModel.guser.signedIn = true;
	}

	Apis.auth.resolve();
}

function _renderLoginButton() {
	// Retry rendering if the button isn't there yet. Seems to be a problem on Firefox and perhaps mobile Safari. This is likely a terrible hack. I should probably do something about this someday. Like resolve a promise.
	if(!document.getElementById(SIGN_IN_BUTTON)) {
		return setTimeout(_renderLoginButton);
	}

	gapi.signin2.render(SIGN_IN_BUTTON, {
		'scope': 'email profile',
		'width': 110,
		'height': 30,
		'theme': 'dark',
		'onsuccess': loginSuccess,
		'onfailure': loginFailure
	});
}