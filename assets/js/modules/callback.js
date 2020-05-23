/***********************************************

  "callback.js"

  Created by Michael Cheng on 5/21/2020 6:39:40 PM
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

/* global iqwerty, serverRoot */
'use strict';

import { BathroomStateController } from './bathroom';
import { BaseStateController } from './mainmap';
import { ViewModel } from './viewmodel';

export function panelLoadedCallback() {
	// Add the selected bathroom to the binding model
	iqwerty.binding.model({
		bathroom: ViewModel.map.selectedBathroom,
		panel: ViewModel.panel,
		search: ViewModel.map.search,
	});

	// Add state controllers. Must be done after template is loaded...
	iqwerty.history.setStates({
		'': BaseStateController,
		'bathroom/:id': BathroomStateController,
	}, {
		'base': `${serverRoot}m/`
	});
}

export function toolbarLoadedCallback() {
	iqwerty.binding.model({
		database: ViewModel.database,
		guser: ViewModel.guser,
	});
}