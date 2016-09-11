/***********************************************

  "viewmodel.js"

  Created by Michael Cheng on 09/10/2016 20:15
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/


'use strict';

/* globals module, require, serverRoot, iqwerty */

const MainMap = require('./mainmap');
const Google = require('./google');

let shell = module.exports;

shell.view = {
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

shell.template = {
	bindBathroomData() {
		//Add the selected bathroom to the binding model
		iqwerty.binding.Model({
			bathroom: MainMap.selectedBathroom,
			search: MainMap.search
		});

		/**
		 * Add state controllers
		 * Must be done after template is loaded...
		 */
		iqwerty.history.States({
			'': MainMap.BaseStateController,
			'bathroom/:id': MainMap.BathroomStateController
		}, {
			'base': `${serverRoot}m/`
		});
	},

	bindToolbarData() {
		iqwerty.binding.Model({
			guser: Google.guser,
			view: shell.view
		});
	}
};