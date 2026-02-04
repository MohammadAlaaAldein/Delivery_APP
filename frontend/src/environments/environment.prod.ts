import packageInfo from '../../package.json';

export const environment = {
	appVersion: packageInfo.version,
	production: true,
	apiUrl: 'https://mock-data-api-nextjs.vercel.app',
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
