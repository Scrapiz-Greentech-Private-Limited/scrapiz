/**
 * Custom Expo Config Plugin: Inject Mapbox access token for Android
 *
 * Why this is needed:
 * - @rnmapbox/maps v10.x uses Mapbox SDK v11 under the hood
 * - Mapbox SDK v11 does NOT auto-read from R.string.mapbox_access_token
 *   (unlike SDK v10 which did via ResourceOptionsManager)
 * - With React Native New Architecture (Fabric), native MapView is created
 *   BEFORE any JS code runs, so MapboxGL.setAccessToken() in JS is too late
 * - The token must be set via MapboxOptions.accessToken in MainApplication.onCreate()
 *   BEFORE React Native initializes
 *
 * This plugin does two things:
 * 1. Injects mapbox_access_token into Android strings.xml (as a resource)
 * 2. Adds early token initialization in MainApplication.kt onCreate()
 *    so MapboxOptions.accessToken is set before any MapView is created
 */
const { withStringsXml, withMainApplication } = require('expo/config-plugins');

function withMapboxAccessToken(config, { accessToken }) {
  if (!accessToken) {
    throw new Error(
      'withMapboxAccessToken: accessToken is required. ' +
      'Pass your Mapbox public token (pk.*) as the accessToken parameter.'
    );
  }

  // Step 1: Inject token into strings.xml as a native string resource
  config = withStringsXml(config, (modConfig) => {
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

  // Step 2: Inject early token init into MainApplication.kt
  // This is CRITICAL for Fabric/New Architecture — MapboxOptions.accessToken
  // must be set before loadReactNative() is called, otherwise native MapView
  // components mount with no token and render blank tiles.
  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Add MapboxOptions import if not already present
    if (!contents.includes('com.mapbox.common.MapboxOptions')) {
      contents = contents.replace(
        'import android.app.Application',
        'import android.app.Application\nimport com.mapbox.common.MapboxOptions'
      );
      console.log('✅ withMapboxAccessToken: Added MapboxOptions import to MainApplication.kt');
    }

    // Inject token initialization in onCreate(), right after super.onCreate()
    // This runs before loadReactNative() and before any Fabric views are created
    if (!contents.includes('MapboxOptions.accessToken')) {
      contents = contents.replace(
        'super.onCreate()',
        [
          'super.onCreate()',
          '',
          '    // @generated begin mapbox-token-init',
          '    // Mapbox: Set access token before React Native loads.',
          '    // Required for Fabric/New Architecture where native MapView mounts before JS runs.',
          '    try {',
          '      val mapboxToken = getString(R.string.mapbox_access_token)',
          '      if (mapboxToken.isNotEmpty()) {',
          '        MapboxOptions.accessToken = mapboxToken',
          '      }',
          '    } catch (_: Exception) {',
          '      // Token not in resources — will be set from JS later',
          '    }',
          '    // @generated end mapbox-token-init',
        ].join('\n')
      );
      console.log('✅ withMapboxAccessToken: Injected MapboxOptions.accessToken init into MainApplication.kt');
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });

  return config;
}

module.exports = withMapboxAccessToken;
