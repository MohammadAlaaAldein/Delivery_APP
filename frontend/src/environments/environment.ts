// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

export const environment = {
	appVersion: packageInfo.version,
	production: false,
	apiUrl: 'http://localhost:1000',
	googleMapsApiKey: 'AIzaSyAZxaTLNEOs9wt9vtyuGecedcFICTUcuCA', // Add your Google Maps API key here
	firebase: {
		apiKey: 'AIzaSyCZaNQasg3EdlfI9_kSn16-Tuf3AcDbzA4',
		authDomain: 'delivery-app-mohammad.firebaseapp.com',
		projectId: 'delivery-app-mohammad',
		storageBucket: 'delivery-app-mohammad.firebasestorage.app',
		messagingSenderId: '668570133534',
		appId: '1:668570133534:web:5d992f2e903d38cce23a0f',
		vapidKey: 'BO6OYdgEgrDVuS0J_EoCib1DT0DCbexhp5TaDZDGYiOS6ld5JY-11CAygar8EoqcljsmwlevGY5ydtVmkrJZSOc',
	},
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
