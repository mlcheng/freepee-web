/***********************************************

  "freepee.js"

  Created by Michael Cheng on 01/04/2016 12:50
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';


// const Constants = require('../../../assets/js/constants');
// const MainMap = require('./modules/mainmap');
// const Bathroom = require('./modules/bathroom');
// const Google = require('./modules/google');
// const ViewModel = require('./modules/viewmodel');
// const Apis = require('./modules/apis');


// if(typeof module !== 'undefined') {
// 	/* global module */
// 	module.exports = { Constants, MainMap, Bathroom, Google, ViewModel, Apis };
// }

import * as Bathroom from './modules/bathroom';
import * as Callback from './modules/callback';
import * as Google from './modules/google';
import * as MainMap from './modules/mainmap';
import { Apis } from './modules/apis';

export const freepee = (() => {
	return {
		Apis,
		Bathroom,
		Callback,
		Google,
		MainMap,
	};
})();