// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for axios trying to import Node.js crypto module
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'crypto') {
        // Return empty module for crypto in React Native
        return {
            filePath: require.resolve('./empty-module.js'),
            type: 'sourceFile',
        };
    }
    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
