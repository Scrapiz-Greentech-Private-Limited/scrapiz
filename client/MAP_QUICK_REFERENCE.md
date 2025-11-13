# Map Location Picker - Quick Reference

## 🚀 Quick Start

### Already Integrated!
The map picker is already in your app. Just tap the location selector on the home screen → "Select on Map"

## 📁 Files

```
client/
├── src/
│   ├── components/
│   │   ├── MapLocationPicker.tsx    ← Main component
│   │   ├── MapExample.tsx           ← Example usage
│   │   └── LocationSelector.tsx     ← Updated with map
│   └── config/
│       └── mapConfig.ts             ← Configuration
└── docs/
    ├── MAP_IMPLEMENTATION_SUMMARY.md
    ├── MAP_LOCATION_PICKER_GUIDE.md
    └── SETUP_MAP.md
```

## 💻 Basic Usage

```tsx
import MapLocationPicker from '@/src/components/MapLocationPicker';

<MapLocationPicker
  visible={showMap}
  onClose={() => setShowMap(false)}
  onLocationSelect={(location) => {
    console.log(location);
    // { latitude, longitude, address, city, state, pincode, area }
  }}
/>
```

## 🎨 Customization

### Change Map Style
```typescript
// In src/config/mapConfig.ts
export const DEFAULT_MAP_STYLE = MAP_STYLES.streets; // or satellite, basic, outdoor
```

### Change Default City
```typescript
// In src/config/mapConfig.ts
export const DEFAULT_CENTER = [
  DEFAULT_LOCATIONS.bangalore.longitude,
  DEFAULT_LOCATIONS.bangalore.latitude,
];
```

### Adjust Search
```typescript
// In src/config/mapConfig.ts
export const MAP_SETTINGS = {
  searchMinCharacters: 3,    // Min chars to search
  searchDebounceMs: 500,     // Delay before search
  searchResultLimit: 5,      // Max results
};
```

## 🔑 Features

| Feature | Status | Description |
|---------|--------|-------------|
| GPS Location | ✅ | One-tap current location |
| Search | ✅ | Real-time autofill |
| Tap to Select | ✅ | Click anywhere on map |
| Reverse Geocoding | ✅ | Get address from coords |
| Location Details | ✅ | City, state, pincode |
| Save Location | ✅ | Integrates with context |

## 🎯 Common Tasks

### Get Current Location
```tsx
// Tap GPS button in map picker
// Or programmatically:
const { getCurrentLocation } = useLocation();
await getCurrentLocation();
```

### Search for Location
```tsx
// Type in search bar (min 3 chars)
// Results appear automatically
// Tap result to select
```

### Select by Tapping
```tsx
// Tap anywhere on map
// Marker appears at location
// Tap "Confirm Location"
```

### Save to Context
```tsx
const { saveLocation } = useLocation();

const handleSelect = (location) => {
  const saved = {
    id: Date.now().toString(),
    type: 'home',
    label: 'Home',
    ...location,
  };
  saveLocation(saved);
};
```

## 🐛 Quick Fixes

### Map not loading?
- Check internet connection
- Restart app
- Verify API key

### GPS not working?
- Grant location permission
- Enable device location
- Test on real device

### Search not working?
- Type 3+ characters
- Check network
- Wait 500ms for debounce

## 📱 Test Commands

```bash
# Start app
npm start

# iOS
npm run ios

# Android
npm run android
```

## 🔗 API Endpoints

```
Search:
GET https://api.maptiler.com/geocoding/{query}.json?key={KEY}

Reverse:
GET https://api.maptiler.com/geocoding/{lng},{lat}.json?key={KEY}

Map Style:
https://api.maptiler.com/maps/satellite/style.json?key={KEY}
```

## 📊 Location Object

```typescript
{
  latitude: 19.076,           // number
  longitude: 72.8777,         // number
  address: "Full address",    // string
  city: "Mumbai",             // string
  state: "Maharashtra",       // string
  pincode: "400001",          // string
  area: "Colaba"              // string
}
```

## 🎓 Examples

### Example 1: Simple Usage
```tsx
const [show, setShow] = useState(false);

<Button onPress={() => setShow(true)}>Select</Button>
<MapLocationPicker
  visible={show}
  onClose={() => setShow(false)}
  onLocationSelect={(loc) => console.log(loc)}
/>
```

### Example 2: With Initial Location
```tsx
<MapLocationPicker
  visible={true}
  onClose={() => {}}
  onLocationSelect={(loc) => {}}
  initialLocation={{ latitude: 19.076, longitude: 72.8777 }}
/>
```

### Example 3: Save to State
```tsx
const [location, setLocation] = useState(null);

<MapLocationPicker
  visible={true}
  onClose={() => {}}
  onLocationSelect={setLocation}
/>

{location && <Text>{location.address}</Text>}
```

## 🌟 Pro Tips

1. **Coordinates**: Use `[longitude, latitude]` format
2. **Debounce**: Search waits 500ms to reduce API calls
3. **Proximity**: Results sorted by distance
4. **Permissions**: Requested automatically when needed
5. **Context**: Integrates with existing LocationContext

## 📞 Help

- Full Guide: `MAP_LOCATION_PICKER_GUIDE.md`
- Setup: `SETUP_MAP.md`
- Summary: `MAP_IMPLEMENTATION_SUMMARY.md`
- Code: `src/components/MapLocationPicker.tsx`

## ✅ Checklist

- [x] Dependencies installed
- [x] Components created
- [x] Configuration set up
- [x] Integrated with LocationSelector
- [x] GPS working
- [x] Search working
- [x] Map interaction working
- [x] Location saving working
- [ ] Test on device
- [ ] Customize styling
- [ ] Add to other screens

---

**Status**: ✅ Ready to Use
**Integration**: ✅ Complete
**Documentation**: ✅ Available
