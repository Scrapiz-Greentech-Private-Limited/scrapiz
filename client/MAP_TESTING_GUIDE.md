# Map Location Picker - Testing Guide

## 🧪 Complete Testing Checklist

### Pre-Testing Setup

- [ ] Dependencies installed (`npm install`)
- [ ] App builds successfully
- [ ] Device/simulator ready
- [ ] Internet connection available
- [ ] Location services enabled on device

## 📱 Device Testing

### iOS Testing
```bash
npm run ios
```

**Requirements:**
- Xcode installed
- iOS Simulator or physical device
- Location services enabled in Settings

### Android Testing
```bash
npm run android
```

**Requirements:**
- Android Studio installed
- Android Emulator or physical device
- Location services enabled in Settings

## ✅ Feature Testing

### 1. Map Display
- [ ] Open app and navigate to home screen
- [ ] Tap location selector at top
- [ ] Tap "Select on Map" button
- [ ] **Expected**: Modal opens with map
- [ ] **Expected**: Map shows satellite view
- [ ] **Expected**: Map is centered on Mumbai (or configured default)
- [ ] **Expected**: Zoom level is appropriate (13)

**Pass Criteria:**
- Map loads within 3 seconds
- No errors in console
- Map is interactive (can pan/zoom)

---

### 2. GPS Location

#### Test 2.1: Permission Request
- [ ] Tap GPS button (navigation icon)
- [ ] **Expected**: Permission dialog appears
- [ ] Grant permission
- [ ] **Expected**: GPS button shows loading spinner

**Pass Criteria:**
- Permission requested only once
- Clear permission message shown

#### Test 2.2: Get Current Location
- [ ] After granting permission, wait for GPS
- [ ] **Expected**: Map animates to current location
- [ ] **Expected**: Marker appears at current location
- [ ] **Expected**: Search bar shows current address
- [ ] **Expected**: Loading spinner disappears

**Pass Criteria:**
- Location accurate within 50 meters
- Animation smooth (1 second)
- Address matches location

#### Test 2.3: Permission Denied
- [ ] Deny location permission
- [ ] **Expected**: Error message shown
- [ ] **Expected**: Modal stays open
- [ ] **Expected**: Can still use search/tap

**Pass Criteria:**
- Clear error message
- App doesn't crash
- Other features still work

---

### 3. Search Functionality

#### Test 3.1: Basic Search
- [ ] Type "star" in search bar
- [ ] **Expected**: No results yet (< 3 chars)
- [ ] Type "b" (now "starb")
- [ ] **Expected**: Loading indicator appears
- [ ] Wait 500ms
- [ ] **Expected**: Results list appears
- [ ] **Expected**: 5 or fewer results shown

**Pass Criteria:**
- Search triggers after 3 characters
- Results appear within 2 seconds
- Results are relevant

#### Test 3.2: Search Debouncing
- [ ] Type "mumbai" quickly
- [ ] **Expected**: Only one API call made (check console)
- [ ] **Expected**: Results appear after typing stops

**Pass Criteria:**
- No API call per keystroke
- Single API call after 500ms pause

#### Test 3.3: Select Search Result
- [ ] Search for "Colaba"
- [ ] Tap first result
- [ ] **Expected**: Map animates to location
- [ ] **Expected**: Marker placed at location
- [ ] **Expected**: Search bar updated with full address
- [ ] **Expected**: Results list closes

**Pass Criteria:**
- Smooth animation
- Marker at correct location
- Address matches result

#### Test 3.4: Clear Search
- [ ] Type in search bar
- [ ] Clear text
- [ ] **Expected**: Results disappear
- [ ] **Expected**: Map stays at current location

**Pass Criteria:**
- Results clear immediately
- No errors

---

### 4. Map Interaction

#### Test 4.1: Pan Map
- [ ] Drag map in any direction
- [ ] **Expected**: Map pans smoothly
- [ ] **Expected**: Marker stays in place (if placed)

**Pass Criteria:**
- Smooth panning
- No lag or stuttering

#### Test 4.2: Zoom Map
- [ ] Pinch to zoom in
- [ ] Pinch to zoom out
- [ ] **Expected**: Map zooms smoothly
- [ ] **Expected**: Marker scales appropriately

**Pass Criteria:**
- Smooth zooming
- Min/max zoom respected

#### Test 4.3: Tap to Select
- [ ] Tap anywhere on map
- [ ] **Expected**: Marker moves to tap location
- [ ] **Expected**: Search bar updates with address
- [ ] **Expected**: Loading indicator during reverse geocode

**Pass Criteria:**
- Marker appears immediately
- Address loads within 2 seconds
- Address matches location

---

### 5. Location Confirmation

#### Test 5.1: Confirm Location
- [ ] Select a location (GPS, search, or tap)
- [ ] Tap "Confirm Location" button
- [ ] **Expected**: Loading indicator appears
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Location saved to context
- [ ] **Expected**: Location appears in saved locations

**Pass Criteria:**
- Confirmation within 2 seconds
- Location data complete (city, state, pincode)
- No errors

#### Test 5.2: Location Data Accuracy
- [ ] Confirm a known location
- [ ] Check returned data
- [ ] **Expected**: Correct latitude/longitude
- [ ] **Expected**: Correct city name
- [ ] **Expected**: Correct state name
- [ ] **Expected**: Valid pincode (6 digits)
- [ ] **Expected**: Area/neighborhood name

**Pass Criteria:**
- All fields populated
- Data matches location
- Pincode is valid

---

### 6. Modal Behavior

#### Test 6.1: Open Modal
- [ ] Tap "Select on Map" button
- [ ] **Expected**: Modal slides up
- [ ] **Expected**: Map loads
- [ ] **Expected**: Previous location shown (if any)

**Pass Criteria:**
- Smooth animation
- No flash of content

#### Test 6.2: Close Modal
- [ ] Tap X button
- [ ] **Expected**: Modal closes
- [ ] **Expected**: No location saved
- [ ] **Expected**: Can reopen modal

**Pass Criteria:**
- Smooth close animation
- State preserved for next open

#### Test 6.3: Back Button (Android)
- [ ] Press device back button
- [ ] **Expected**: Modal closes
- [ ] **Expected**: No location saved

**Pass Criteria:**
- Back button works
- No crash

---

### 7. Error Handling

#### Test 7.1: No Internet
- [ ] Disable internet
- [ ] Try to search
- [ ] **Expected**: Error message or no results
- [ ] **Expected**: App doesn't crash

**Pass Criteria:**
- Graceful error handling
- Clear error message

#### Test 7.2: Invalid Location
- [ ] Tap in ocean (no address)
- [ ] **Expected**: Generic address or coordinates
- [ ] **Expected**: Can still confirm

**Pass Criteria:**
- No crash
- Fallback address provided

#### Test 7.3: GPS Timeout
- [ ] Tap GPS in area with poor signal
- [ ] Wait 30 seconds
- [ ] **Expected**: Timeout error or fallback

**Pass Criteria:**
- Doesn't hang forever
- Clear error message

---

### 8. Integration Testing

#### Test 8.1: Save to Context
- [ ] Select location on map
- [ ] Confirm location
- [ ] Close modal
- [ ] Reopen location selector
- [ ] **Expected**: Location in saved list
- [ ] **Expected**: Can select saved location

**Pass Criteria:**
- Location persists
- Can be reselected

#### Test 8.2: Use in Sell Screen
- [ ] Navigate to Sell screen
- [ ] Use location selector
- [ ] Select location on map
- [ ] **Expected**: Location used in order

**Pass Criteria:**
- Location data passed correctly
- Order uses correct location

#### Test 8.3: Multiple Locations
- [ ] Save location A
- [ ] Save location B
- [ ] Save location C
- [ ] **Expected**: All locations in list
- [ ] **Expected**: Can switch between them

**Pass Criteria:**
- All locations saved
- No duplicates
- Can select any

---

### 9. Performance Testing

#### Test 9.1: Load Time
- [ ] Open map picker
- [ ] Measure time to interactive
- [ ] **Expected**: < 3 seconds

**Pass Criteria:**
- Fast initial load
- No blocking

#### Test 9.2: Search Performance
- [ ] Type search query
- [ ] Measure time to results
- [ ] **Expected**: < 2 seconds

**Pass Criteria:**
- Fast search
- No lag

#### Test 9.3: Memory Usage
- [ ] Open/close map 10 times
- [ ] Check memory usage
- [ ] **Expected**: No memory leaks

**Pass Criteria:**
- Memory stable
- No crashes

---

### 10. UI/UX Testing

#### Test 10.1: Visual Design
- [ ] Check all UI elements
- [ ] **Expected**: Consistent styling
- [ ] **Expected**: Readable text
- [ ] **Expected**: Proper spacing

**Pass Criteria:**
- Matches app design
- Professional appearance

#### Test 10.2: Accessibility
- [ ] Test with screen reader
- [ ] Test with large text
- [ ] **Expected**: All elements accessible

**Pass Criteria:**
- Screen reader compatible
- Text scales properly

#### Test 10.3: Responsiveness
- [ ] Test on different screen sizes
- [ ] Rotate device
- [ ] **Expected**: Layout adapts

**Pass Criteria:**
- Works on all sizes
- Rotation handled

---

## 🔍 Edge Cases

### Edge Case 1: Rapid Interactions
- [ ] Tap GPS, immediately search, immediately tap map
- [ ] **Expected**: No crashes, handles gracefully

### Edge Case 2: Long Address
- [ ] Select location with very long address
- [ ] **Expected**: Text truncates or wraps properly

### Edge Case 3: Special Characters
- [ ] Search for "café" or "São Paulo"
- [ ] **Expected**: Handles special characters

### Edge Case 4: Offline to Online
- [ ] Start offline, enable internet mid-use
- [ ] **Expected**: Recovers gracefully

### Edge Case 5: Permission Change
- [ ] Grant permission, then revoke in settings
- [ ] Return to app
- [ ] **Expected**: Handles permission change

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Device: ___________
OS Version: ___________

Feature Tests:
[ ] Map Display: PASS / FAIL
[ ] GPS Location: PASS / FAIL
[ ] Search: PASS / FAIL
[ ] Map Interaction: PASS / FAIL
[ ] Confirmation: PASS / FAIL
[ ] Modal Behavior: PASS / FAIL
[ ] Error Handling: PASS / FAIL
[ ] Integration: PASS / FAIL
[ ] Performance: PASS / FAIL
[ ] UI/UX: PASS / FAIL

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## 🐛 Common Issues & Solutions

### Issue: Map not loading
**Solution:**
- Check internet connection
- Verify API key
- Check console for errors
- Restart app

### Issue: GPS not working
**Solution:**
- Check location permission
- Enable location services
- Test on physical device
- Check GPS signal

### Issue: Search not working
**Solution:**
- Type 3+ characters
- Wait 500ms
- Check network
- Verify API key

### Issue: Marker not appearing
**Solution:**
- Check coordinates format
- Verify map is loaded
- Check marker styles
- Restart app

### Issue: Slow performance
**Solution:**
- Check device specs
- Close other apps
- Clear app cache
- Update dependencies

---

## 🎯 Automated Testing (Future)

### Unit Tests
```typescript
// Example test structure
describe('MapLocationPicker', () => {
  it('should render correctly', () => {});
  it('should handle GPS location', () => {});
  it('should search locations', () => {});
  it('should confirm location', () => {});
});
```

### Integration Tests
```typescript
describe('Location Flow', () => {
  it('should save location to context', () => {});
  it('should load saved locations', () => {});
  it('should use location in order', () => {});
});
```

---

## 📝 Testing Checklist Summary

**Before Release:**
- [ ] All feature tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Edge cases handled
- [ ] Error handling works
- [ ] Integration complete
- [ ] UI/UX polished
- [ ] Documentation complete

**Sign-off:**
- [ ] Developer tested
- [ ] QA tested
- [ ] User tested
- [ ] Ready for production

---

**Testing Status**: Ready for testing
**Last Updated**: November 8, 2025
**Version**: 1.0.0
