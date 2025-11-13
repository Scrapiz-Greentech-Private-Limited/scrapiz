# Map Location Picker - Troubleshooting

## ❌ Error: "Request failed due to a permanent error: Canceled"

### Problem
MapLibre is unable to load map tiles, showing repeated "Canceled" errors in the console.

### Root Causes
1. **API Key Format Issue** - Quotes around API key in .env file
2. **Style URL Issue** - Incorrect style URL format
3. **MapLibre Initialization** - Not properly initialized
4. **Network Issues** - Unable to reach MapTiler servers

### ✅ Solutions Applied

#### 1. Fixed .env File
**Before:**
```env
EXPO_PUBLIC_MAP_TILER_API_KEY="iAJmFSXAzVQad0l6kiuR"
```

**After:**
```env
EXPO_PUBLIC_MAP_TILER_API_KEY=iAJmFSXAzVQad0l6kiuR
```

**Why:** Quotes in .env files can be included in the value, causing the API key to be `"key"` instead of `key`.

#### 2. Updated Style URL
Changed from satellite to streets-v2 style which is more reliable:

```typescript
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`;
```

**Available Styles:**
- `streets-v2` - Street map (recommended)
- `basic-v2` - Basic map
- `bright-v2` - Bright theme
- `satellite` - Satellite imagery (requires more bandwidth)
- `hybrid` - Satellite + labels

#### 3. Enhanced MapView Configuration
Added proper MapLibre configuration:

```typescript
<MapLibreGL.MapView
  styleURL={STYLE_URL}
  logoEnabled={false}
  attributionEnabled={true}
  attributionPosition={{ bottom: 8, left: 8 }}
>
  <MapLibreGL.Camera
    animationMode="flyTo"
    animationDuration={1000}
  />
</MapLibreGL.MapView>
```

### 🔧 Steps to Fix

1. **Restart Metro Bundler**
   ```bash
   # Stop current process (Ctrl+C)
   # Clear cache and restart
   npm start -- --reset-cache
   ```

2. **Rebuild App**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

3. **Verify API Key**
   - Check `client/.env` has no quotes
   - Verify key is correct: `iAJmFSXAzVQad0l6kiuR`
   - Test key in browser:
     ```
     https://api.maptiler.com/maps/streets-v2/style.json?key=iAJmFSXAzVQad0l6kiuR
     ```

4. **Check Network**
   - Ensure device/simulator has internet
   - Try opening https://api.maptiler.com in browser
   - Check firewall/proxy settings

### 🧪 Test the Fix

#### Quick Test in Browser
Open this URL to verify your API key works:
```
https://api.maptiler.com/maps/streets-v2/style.json?key=iAJmFSXAzVQad0l6kiuR
```

**Expected:** JSON response with map style configuration
**If Error:** API key is invalid or network issue

#### Test in App
1. Open app
2. Navigate to location selector
3. Tap "Select on Map"
4. Map should load within 3 seconds
5. No "Canceled" errors in console

### 📊 Debugging Steps

#### 1. Check Console Logs
Look for these messages:

**Good:**
```
MapLibre initialized
Map loaded successfully
```

**Bad:**
```
Request failed due to a permanent error: Canceled
Failed to load style
```

#### 2. Verify API Key in Code
Add this to `MapLocationPicker.tsx` temporarily:

```typescript
useEffect(() => {
  console.log('API Key:', MAPTILER_API_KEY);
  console.log('Style URL:', STYLE_URL);
}, []);
```

**Expected Output:**
```
API Key: iAJmFSXAzVQad0l6kiuR
Style URL: https://api.maptiler.com/maps/streets-v2/style.json?key=iAJmFSXAzVQad0l6kiuR
```

#### 3. Test Network Request
Add this test function:

```typescript
const testMapTilerAPI = async () => {
  try {
    const response = await fetch(STYLE_URL);
    const data = await response.json();
    console.log('API Test Success:', data.name);
  } catch (error) {
    console.error('API Test Failed:', error);
  }
};
```

Call it when component mounts to verify API access.

### 🔄 Alternative Solutions

#### Option 1: Use Different Map Style
If streets-v2 doesn't work, try basic-v2:

```typescript
const STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;
```

#### Option 2: Use OpenStreetMap Style
Free alternative without API key:

```typescript
const STYLE_URL = 'https://demotiles.maplibre.org/style.json';
```

**Note:** This is for testing only, not for production.

#### Option 3: Self-Hosted Style
Download and host your own style JSON.

### 🚨 Common Mistakes

1. **Quotes in .env** ❌
   ```env
   KEY="value"  # Wrong - includes quotes
   KEY=value    # Correct
   ```

2. **Wrong Import** ❌
   ```typescript
   import { DEFAULT_MAP_STYLE } from '../config/mapConfig';
   // If DEFAULT_MAP_STYLE is undefined
   ```

3. **Missing MapLibre Init** ❌
   ```typescript
   // Must be at top level, before any MapLibre components
   MapLibreGL.setAccessToken(null);
   ```

4. **Incorrect Coordinate Format** ❌
   ```typescript
   [latitude, longitude]  // Wrong
   [longitude, latitude]  // Correct for MapLibre
   ```

### 📱 Platform-Specific Issues

#### iOS
- Clear build folder: `cd ios && rm -rf build && cd ..`
- Clean pods: `cd ios && pod deintegrate && pod install && cd ..`
- Restart Xcode

#### Android
- Clean build: `cd android && ./gradlew clean && cd ..`
- Clear cache: `cd android && ./gradlew cleanBuildCache && cd ..`
- Restart Android Studio

### 🔍 Still Not Working?

#### Check MapTiler Account
1. Go to https://cloud.maptiler.com
2. Login to your account
3. Check API key is active
4. Verify usage limits not exceeded
5. Check allowed domains/apps

#### Check MapLibre Version
```bash
npm list @maplibre/maplibre-react-native
```

**Expected:** `^10.4.0` or higher

#### Update Dependencies
```bash
npm update @maplibre/maplibre-react-native
npm install
```

#### Check Expo Version
```bash
npx expo --version
```

**Expected:** `^54.0.0` or higher

### 📞 Get Help

If still having issues:

1. **Check Logs**
   ```bash
   # iOS
   npx react-native log-ios
   
   # Android
   npx react-native log-android
   ```

2. **Enable Verbose Logging**
   ```typescript
   MapLibreGL.setLogLevel('verbose');
   ```

3. **Test with Simple Map**
   Create a minimal test component (see below)

### 🧪 Minimal Test Component

Create `client/src/components/MapTest.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken(null);

const STYLE_URL = 'https://api.maptiler.com/maps/streets-v2/style.json?key=iAJmFSXAzVQad0l6kiuR';

export default function MapTest() {
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={STYLE_URL}
      >
        <MapLibreGL.Camera
          centerCoordinate={[72.8777, 19.076]}
          zoomLevel={12}
        />
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
```

Use this in a screen to test if basic map loading works.

### ✅ Success Indicators

Map is working correctly when you see:

1. ✅ No "Canceled" errors in console
2. ✅ Map tiles load and display
3. ✅ Can pan and zoom smoothly
4. ✅ Search returns results
5. ✅ GPS location works
6. ✅ Marker appears on tap

### 📝 Checklist

After applying fixes:

- [ ] Removed quotes from .env file
- [ ] Restarted Metro bundler with cache clear
- [ ] Rebuilt app (iOS/Android)
- [ ] Verified API key in browser
- [ ] Tested map loading in app
- [ ] No console errors
- [ ] Map is interactive
- [ ] Search works
- [ ] GPS works

---

**Status:** Fixed ✅
**Last Updated:** November 8, 2025
**Solution:** Removed quotes from API key, changed to streets-v2 style
