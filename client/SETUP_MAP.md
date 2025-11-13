# Quick Setup Guide - Map Location Picker

## ✅ What's Already Done

1. **Dependencies Installed**
   - `@maplibre/maplibre-react-native` ✅
   - `expo-location` ✅

2. **Components Created**
   - `MapLocationPicker.tsx` - Main map component ✅
   - `MapExample.tsx` - Example usage ✅
   - `LocationSelector.tsx` - Updated with map integration ✅

3. **API Configuration**
   - MapTiler API key configured ✅
   - Satellite map style set ✅
   - Geocoding endpoints configured ✅

## 🚀 How to Use

### Option 1: Use Existing LocationSelector (Recommended)

The map picker is already integrated! Just use your existing LocationSelector:

```tsx
import LocationSelector from '@/src/components/LocationSelector';

// In your component
<LocationSelector />
```

Users will see a new **"Select on Map"** button that opens the map picker.

### Option 2: Use Map Picker Directly

```tsx
import MapLocationPicker from '@/src/components/MapLocationPicker';

const [showMap, setShowMap] = useState(false);

<MapLocationPicker
  visible={showMap}
  onClose={() => setShowMap(false)}
  onLocationSelect={(location) => {
    console.log('Selected:', location);
    // Use location data here
  }}
/>
```

### Option 3: Use Example Component

```tsx
import MapExample from '@/src/components/MapExample';

<MapExample />
```

## 📱 Test It Now

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Navigate to home screen** - LocationSelector is already there

3. **Tap location selector** → **"Select on Map"** button

4. **Try these features:**
   - 🔍 Search for a location (type at least 3 characters)
   - 📍 Tap GPS button to use current location
   - 🗺️ Tap anywhere on map to select
   - ✅ Tap "Confirm Location" to save

## 🔧 Permissions Setup

Make sure your `app.json` has location permissions:

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

**Already configured?** Check your `client/app.json` file.

## 🎨 Customization

### Change Map Style

Edit `MapLocationPicker.tsx`:

```typescript
// Current: Satellite view
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`;

// Change to Streets:
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;

// Or Basic:
const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/basic/style.json?key=${MAPTILER_API_KEY}`;
```

### Change Default Location

```typescript
const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
  [72.8777, 19.076] // Mumbai (current)
  // [77.5946, 12.9716] // Bangalore
  // [77.2090, 28.6139] // Delhi
);
```

### Customize Colors

All colors use your existing theme:
- Primary: `#16a34a` (green)
- Secondary: `#2563eb` (blue)
- Background: `#ffffff` (white)

## 📋 Features Included

✅ **GPS Location** - One-tap current location
✅ **Search Autofill** - Real-time location search
✅ **Tap to Select** - Click anywhere on map
✅ **Reverse Geocoding** - Auto-fill address
✅ **Location Details** - City, state, pincode extraction
✅ **Saved Locations** - Integration with LocationContext
✅ **Smooth Animations** - Camera movements
✅ **Error Handling** - Permission denials, network errors
✅ **Loading States** - Spinners for async operations

## 🧪 Testing Checklist

- [ ] Open LocationSelector
- [ ] Tap "Select on Map"
- [ ] Map loads with satellite view
- [ ] Search bar works (type "starbucks")
- [ ] GPS button gets current location
- [ ] Tap on map places marker
- [ ] Confirm button returns location data
- [ ] Location saves to context
- [ ] Location appears in saved locations

## 🐛 Troubleshooting

### Map doesn't show
- Check internet connection
- Verify API key is correct
- Try restarting app

### GPS not working
- Grant location permissions
- Enable device location services
- Test on physical device (not simulator)

### Search not working
- Type at least 3 characters
- Check network connection
- Verify API key has geocoding access

## 📚 Documentation

Full documentation available in:
- `MAP_LOCATION_PICKER_GUIDE.md` - Complete guide
- `MapLocationPicker.tsx` - Component code with comments
- `MapExample.tsx` - Usage examples

## 🎯 Next Steps

1. **Test on device** - Run on physical phone
2. **Customize styling** - Match your app theme
3. **Add validation** - Check service area
4. **Enhance UX** - Add loading states, error messages

## 💡 Pro Tips

1. **Search is debounced** - 500ms delay to reduce API calls
2. **Results are proximity-based** - Closer locations appear first
3. **Coordinates format** - MapLibre uses `[longitude, latitude]`
4. **Permission handling** - Automatically requests when needed
5. **Context integration** - Works with existing LocationContext

## 🔗 Resources

- [MapTiler Docs](https://docs.maptiler.com/)
- [MapLibre React Native](https://github.com/maplibre/maplibre-react-native)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

---

**Ready to use!** The map picker is fully integrated and ready for testing. 🎉
