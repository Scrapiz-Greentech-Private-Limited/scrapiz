const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude web platform to avoid mapbox-gl CSS import issues
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android'],
};

module.exports = withNativeWind(config, { input: "./global.css" });