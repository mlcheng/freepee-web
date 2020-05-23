/***********************************************

  "viewmodel.js"

  Created by Michael Cheng on 09/10/2016 20:15
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

'use strict';

import { ToiletImage } from './../../../../assets/js/constants';

export const ViewModel = {
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
			place: '',
		},
		location: {},
		instance: null,
	},
	guser: {
		token: '',
		name: '',
		id: '',
		gpURL: '',
		pic: ToiletImage.BATHROOM_MARKER,
		signedIn: false,
	},
	panel: {
		display: {
			// Sets whether or not the view is for bathroom details.
			detail: 'false',
			// Sets whether or not the view is for adding a bathroom.
			add: 'false',
			// Sets whether or not a the view can delete a bathroom
			delete: 'false',
		},
		add: {
			approx_address: null,
			description: null,
			submitDisabled: false,
		}
	},
	database: {
		writable: 'false',
	},
};