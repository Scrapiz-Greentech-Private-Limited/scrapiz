# Map Location Picker - Implementation Guide

## Overview

A complete map-based location picker using MapLibre and MapTiler with GPS and autofill search functionality for React Native (Expo).

## Features

✅ **Interactive Map Display** - Satellite view with MapTiler
✅ **GPS Location** - Get user's current location with one tap
✅ **Search Autofill** - Real-time location search with suggestions
✅ **Tap to Select** - Click anywhere on the map to select location
✅ **Reverse Geocoding** - Automatically get address from coordinates
✅ **Location Details** - Extract city, state, pincode, and area

## Files Created

1. **`src/components/MapLocationPicker.tsx`** - Main map picker component
2. **`src/components/MapExample.tsx`** - Example usage component
3. **`src/components/LocationSelector.tsx`** - Updated with map integration

## Installation

All required dependencies are already installed:
- `@maplibre/maplibre-react-native` ✅
- `expo-location` ✅

## Configuration

### MapTiler API Key

The API key is already configured in the component:
```typescript
const MAPTILER_API_KEY = 'iAJmFSXAzVQad0l6kiuR';
```

### Map Style

Using satellite view:
```typescript
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`;
```

You can change to other styles:
- Streets: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`
- Basic: `https://api.maptiler.com/maps/basic/style.json?key=${MAPTILER_API_KEY}`
- Outdoor: `https://api.maptiler.com/maps/outdoor/style.json?key=${MAPTILER_API_KEY}`

## Usage

### Method 1: Using LocationSelector (Already Integrated)

The map picker is now integrated into your existing `LocationSelector` component:

```tsx
import LocationSelector from '@/src/components/LocationSelector';

function MyScreen() {
  return <LocationSelector />;
}
```

Users will see a new "Select on Map" button in the location modal.

### Method 2: Direct Usage

Use the map picker directly in any component:

```tsx
import React, { useState } from 'react';
import MapLocationPicker from '@/src/components/MapLocationPicker';

function MyScreen() {
  const [showMap, setShowMap] = useState(false);

  const handleLocationSelect = (location) => {
    console.log('Selected:', location);
    // location contains: latitude, longitude, address, city, state, pincode, area
  };

  return (
    <>
      <Button onPress={() => setShowMap(true)}>
        Select Location
      </Button>

      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={{ latitude: 19.076, longitude: 72.8777 }}
      />
    </>
  );
}
```

### Method 3: Using Example Component

A ready-to-use example component is available:

```tsx
import MapExample from '@/src/components/MapExample';

function MyScreen() {
  return <MapExample />;
}
```

## API Reference

### MapLocationPicker Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | Yes | Controls modal visibility |
| `onClose` | () => void | Yes | Called when modal is closed |
| `onLocationSelect` | (location: LocationResult) => void | Yes | Called when location is confirmed |
| `initialLocation` | { latitude: number, longitude: number } | No | Initial map center |

### LocationResult Object

```typescript
{
  latitude: number;      // e.g., 19.0760
  longitude: number;     // e.g., 72.8777
  address: string;       // Full address
  city: string;          // City name
  state: string;         // State name
  pincode: string;       // Postal code
  area: string;          // Neighborhood/area
}
```

## Features Explained

### 1. GPS Location

Tap the GPS button (navigation icon) to:
- Request location permission
- Get current coordinates
- Animate map to your location
- Auto-fill address in search bar

### 2. Search Autofill

Type in the search bar to:
- Get real-time suggestions (min 3 characters)
- See up to 5 location results
- Tap any result to jump to that location
- Proximity-based results (closer locations first)

### 3. Map Interaction

- **Tap anywhere** on the map to place marker
- **Drag** to pan around
- **Pinch** to zoom in/out
- Marker shows selected location

### 4. Confirm Location

Tap "Confirm Location" to:
- Get detailed address information
- Extract city, state, pincode
- Return location data to parent component

## Permissions

The component automatically handles location permissions:

```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
```

Make sure your `app.json` includes:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ]
  }
}
```

## Customization

### Change Map Style

Edit `MAPTILER_STYLE_URL` in `MapLocationPicker.tsx`:

```typescript
// Satellite (current)
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`;

// Streets
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;
```

### Change Default Location

Update `selectedCoords` initial state:

```typescript
const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
  [77.5946, 12.9716] // Bangalore instead of Mumbai
);
```

### Customize Marker

Edit the marker style in `MapLocationPicker.tsx`:

```typescript
<View style={styles.marker}>
  <MapPin size={24} color="#ffffff" fill="#16a34a" />
</View>
```

### Adjust Search Results

Change the number of results:

```typescript
const response = await fetch(
  `${GEOCODING_API_URL}/${query}.json?key=${MAPTILER_API_KEY}&limit=10` // Changed from 5 to 10
);
```

## Integration with LocationContext

The map picker automatically integrates with your existing `LocationContext`:

```tsx
import { useLocation } from '@/src/context/LocationContext';

function MyComponent() {
  const { saveLocation, selectLocation } = useLocation();

  const handleMapLocationSelect = (location) => {
    const savedLocation = {
      id: Date.now().toString(),
      type: 'other',
      label: location.area,
      ...location,
    };
    
    saveLocation(savedLocation);
    selectLocation(savedLocation);
  };

  return (
    <MapLocationPicker
      visible={true}
      onClose={() => {}}
      onLocationSelect={handleMapLocationSelect}
    />
  );
}
```

## Troubleshooting

### Map Not Showing

1. Check MapLibre initialization:
```typescript
MapLibreGL.setAccessToken(null); // Should be at top of file
```

2. Verify API key is correct

3. Check network connectivity

### GPS Not Working

1. Ensure location permissions are granted
2. Check device location services are enabled
3. Test on physical device (not simulator)

### Search Not Working

1. Verify API key has geocoding access
2. Check network requests in console
3. Ensure minimum 3 characters are typed

### Marker Not Appearing

1. Check coordinate format: `[longitude, latitude]` (not lat, lng)
2. Verify coordinates are valid numbers
3. Check map bounds

## Performance Tips

1. **Debounced Search** - Already implemented (500ms delay)
2. **Proximity Search** - Results prioritize nearby locations
3. **Result Limit** - Only 5 results shown to reduce load
4. **Lazy Loading** - Map only loads when modal opens

## Testing

Test the implementation:

```bash
# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (limited map support)
npm run web
```

## Example Scenarios

### Scenario 1: Delivery Address Selection

```tsx
function DeliveryScreen() {
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  return (
    <MapLocationPicker
      visible={true}
      onClose={() => {}}
      onLocationSelect={(location) => {
        setDeliveryLocation(location);
        // Save to order, send to API, etc.
      }}
    />
  );
}
```

### Scenario 2: Service Area Check

```tsx
function ServiceCheck() {
  const handleLocationSelect = (location) => {
    if (isServiceable(location.pincode)) {
      alert('Service available!');
    } else {
      alert('Sorry, not available in your area');
    }
  };

  return <MapLocationPicker onLocationSelect={handleLocationSelect} />;
}
```

### Scenario 3: Multiple Location Saving

```tsx
function SavedLocations() {
  const [locations, setLocations] = useState([]);

  const handleSave = (location) => {
    setLocations([...locations, {
      id: Date.now(),
      ...location,
      label: 'Home', // or 'Office', 'Other'
    }]);
  };

  return <MapLocationPicker onLocationSelect={handleSave} />;
}
```

## API Endpoints Used

1. **Geocoding (Search)**
   ```
   GET https://api.maptiler.com/geocoding/{query}.json?key={API_KEY}
   ```

2. **Reverse Geocoding**
   ```
   GET https://api.maptiler.com/geocoding/{lng},{lat}.json?key={API_KEY}
   ```

3. **Map Tiles**
   ```
   https://api.maptiler.com/maps/satellite/style.json?key={API_KEY}
   ```

## Next Steps

1. ✅ Map picker created and integrated
2. ✅ GPS location working
3. ✅ Search autofill implemented
4. ✅ Integrated with LocationSelector
5. 🔄 Test on physical device
6. 🔄 Customize styling to match your app
7. 🔄 Add service area validation
8. 🔄 Implement location caching

## Support

For issues or questions:
- Check MapTiler docs: https://docs.maptiler.com/
- MapLibre React Native: https://github.com/maplibre/maplibre-react-native
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/

---

**Created for Scrapiz App** - Map-based location selection with GPS and autofill
