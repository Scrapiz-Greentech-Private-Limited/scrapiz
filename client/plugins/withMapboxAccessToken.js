/**
 * Custom Expo Config Plugin: Inject Mapbox access token into Android strings.xml
 *
 * Why this is needed:
 * - @rnmapbox/maps v10.x does NOT recognize the "MBXAccessToken" plugin config key
 *   (that key was only valid in v9.x)
 * - With React Native New Architecture (Fabric), native views are created by the
 *   mount system BEFORE any JS code runs, so MapboxGL.setAccessToken() in JS
 *   is called too late
 * - The Mapbox Android SDK checks for a "mapbox_access_token" string resource
 *   at native view creation time
 * - This plugin creates that string resource so the token is always available
 */
const { withStringsXml } = require('expo/config-plugins');

function withMapboxAccessToken(config, { accessToken }) {
  if (!accessToken) {
    throw new Error(
      'withMapboxAccessToken: accessToken is required. ' +
      'Pass your Mapbox public token (pk.*) as the accessToken parameter.'
    );
  }

  return withStringsXml(config, (modConfig) => {
    const strings = modConfig.modResults;

    // Ensure resources.string array exists
    if (!strings.resources.string) {
      strings.resources.string = [];
    }

    // Remove any existing mapbox_access_token entry to avoid duplicates
    strings.resources.string = strings.resources.string.filter(
      (s) => !(s && s.$ && s.$.name === 'mapbox_access_token')
    );

    // Add the access token as a native string resource
    strings.resources.string.push({
      $: { name: 'mapbox_access_token', translatable: 'false' },
      _: accessToken,
    });

    console.log('✅ withMapboxAccessToken: Injected mapbox_access_token into Android strings.xml');

    return modConfig;
  });
}

module.exports = withMapboxAccessToken;
