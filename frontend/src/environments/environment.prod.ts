import packageInfo from '../../package.json';

export const environment = {
	appVersion: packageInfo.version,
	production: true,
	apiUrl: 'https://mock-data-api-nextjs.vercel.app',
	googleMapsApiKey: 'AIzaSyAZxaTLNEOs9wt9vtyuGecedcFICTUcuCA', // Add your Google Maps API key here
};
