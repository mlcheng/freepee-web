/***********************************************

  "viewmodel.js"

  Created by Michael Cheng on 09/10/2016 20:15
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/


'use strict';

/* globals module, require, serverRoot, iqwerty */

const Constants = require('../../../../assets/js/constants');
const MainMap = require('./mainmap');

let shell = module.exports;

shell.model = {
	map: {
		/**
		 * The selected bathroom; used for data binding on the panel
		 * @type {Object}
		 */
		selectedBathroom: {},
		/**
		 * The search query, used for data binding
		 * @type {Object}
		 */
		search: {
			place: ''
		},
		location: {},
		instance: null
	},
	user: {
		guser: {
			token: '',
			name: '',
			id: '',
			gpURL: '',
			pic: Constants.ToiletImage.BATHROOM_MARKER
		}
	},
	view: {
		guser: {
			signedIn: false
		},
		panel: {
			display: {
				// Sets whether or not the view is for bathroom details.
				detail: 'false',
				// Sets whether or not the view is for adding a bathroom.
				add: 'false'
			},
			add: {
				approx_address: null,
				description: null
			}
		}
	}
};

shell.template = {
	bindBathroomData() {
		// Add the selected bathroom to the binding model
		iqwerty.binding.Model({
			bathroom: shell.model.map.selectedBathroom,
			search: shell.model.map.search
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
			guser: shell.model.user.guser,
			view: shell.model.view
		});
	}
};