/***********************************************

  "freepee.js"

  Created by Michael Cheng on 01/04/2016 12:50
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

/* global require */


const Constants = require('../../../assets/js/constants');
const MainMap = require('./modules/mainmap');
const Bathroom = require('./modules/bathroom');
const Google = require('./modules/google');
const ViewModel = require('./modules/viewmodel');
const Apis = require('./modules/apis');


if(typeof module !== 'undefined') {
	/* global module */
	module.exports = { Constants, MainMap, Bathroom, Google, ViewModel, Apis };
}