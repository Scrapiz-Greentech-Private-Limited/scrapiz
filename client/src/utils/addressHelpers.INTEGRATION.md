# Address Helpers Integration Guide

This document shows how to integrate the address helper functions into the existing components.

## 1. LocationSelectionModal Integration

Update `LocationSelectionModal.tsx` to use `constructAddressPayload`:

```typescript
// Add import at the top
import { constructAddressPayload, AddressPayloadValidationError } from '../utils/addressHelpers';
import { AuthService } from '../api/apiService';
import Toast from 'react-native-toast-message';

// Add this handler in LocationSelectionModal component
const handleMapLocationConfirm = async (location: LocationResult) => {
  try {
    // Get current user to use their info as defaults
    const user = await AuthService.getUser();
    
    // Construct address payload with user defaults
    const addressPayload = constructAddressPayload(location, {
      name: user.name || 'Current Location',
      phone_number: user.addresses[0]?.phone_number || '',
      room_number: '',
      delivery_suggestion: '',
    });
    
    // Save to backend
    const savedAddress = await AuthService.createAddress(addressPayload);
    
    // Update LocationContext
    selectLocation({
      ...location,
      id: savedAddress.id,
    });
    
    // Close modals
    setShowMapPickerForGPS(false);
    onClose();
    
    Toast.show({
      type: 'success',
      text1: 'Location Saved',
      text2: 'Your delivery location has been saved',
    });
  } catch (error) {
    console.error('Error saving location:', error);
    
    if (error instanceof AddressPayloadValidationError) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error.message,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error instanceof Error ? error.message : 'Failed to save address',
      });
    }
  }
};

// In JSX, add MapLocationPicker with the handler
{showMapPickerForGPS && (
  <MapLocationPicker
    visible={showMapPickerForGPS}
    onClose={() => setShowMapPickerForGPS(false)}
    onLocationSelect={handleMapLocationConfirm}
    mode="standalone"
    autoOpenGPS={true}
  />
)}
```

## 2. AddressesScreen Integration

Update `addresses.tsx` to use `populateFormFromLocation`:

```typescript
// Add import at the top
import { populateFormFromLocation } from '../utils/addressHelpers';
import Toast from 'react-native-toast-message';

// Add this handler in AddressesScreen component
const handleMapLocationSelect = (location: LocationResult) => {
  // Populate form fields from location while preserving manual entries
  const updatedFormData = populateFormFromLocation(formData, location);
  
  setFormData(updatedFormData);
  setShowMapPicker(false);
  
  Toast.show({
    type: 'success',
    text1: 'Location Selected',
    text2: 'Address fields have been populated from map',
  });
};

// In JSX, add MapLocationPicker with the handler
{showMapPicker && (
  <MapLocationPicker
    visible={showMapPicker}
    onClose={() => setShowMapPicker(false)}
    onLocationSelect={handleMapLocationSelect}
    mode="form-populate"
    autoOpenGPS={true}
    initialLocation={currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    } : undefined}
  />
)}
```

## 3. Form Validation Before Submission

Update the form submission handler in `addresses.tsx`:

```typescript
import { validateAddressPayload, AddressPayloadValidationError } from '../utils/addressHelpers';

const handleSave = async () => {
  try {
    // Validate form data before submission
    validateAddressPayload(formData);
    
    // If validation passes, proceed with save
    if (editingAddress) {
      await AuthService.updateAddress(editingAddress.id, formData);
      Toast.show({
        type: 'success',
        text1: 'Address Updated',
        text2: 'Your address has been updated successfully',
      });
    } else {
      await AuthService.createAddress(formData);
      Toast.show({
        type: 'success',
        text1: 'Address Added',
        text2: 'Your address has been added successfully',
      });
    }
    
    // Refresh addresses and close modal
    await loadAddresses();
    setShowModal(false);
  } catch (error) {
    console.error('Error saving address:', error);
    
    if (error instanceof AddressPayloadValidationError) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error.message,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error instanceof Error ? error.message : 'Failed to save address',
      });
    }
  }
};
```

## 4. Type Definitions

Make sure to export the `LocationResult` interface from `MapLocationPicker.tsx` or create a shared types file:

```typescript
// In client/src/types/location.ts (create this file)
export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
}
```

Then update imports in both `MapLocationPicker.tsx` and `addressHelpers.ts`:

```typescript
import { LocationResult } from '../types/location';
```

## 5. Error Handling Best Practices

Always wrap address operations in try-catch blocks:

```typescript
try {
  // Address operation
  const payload = constructAddressPayload(location, options);
  const savedAddress = await AuthService.createAddress(payload);
  // Success handling
} catch (error) {
  console.error('Address operation error:', error);
  
  if (error instanceof AddressPayloadValidationError) {
    // Handle validation errors specifically
    Toast.show({
      type: 'error',
      text1: 'Validation Error',
      text2: error.message,
    });
  } else if (error instanceof Error) {
    // Handle other errors
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.message,
    });
  } else {
    // Handle unknown errors
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'An unexpected error occurred',
    });
  }
}
```

## 6. Testing Integration

After integrating, test the following scenarios:

1. **GPS Location Selection**:
   - Click "Use my current location" in LocationSelectionModal
   - Verify map opens with GPS
   - Confirm location
   - Verify address is saved to backend
   - Verify LocationContext is updated

2. **Form Population**:
   - Open AddressesScreen
   - Click "Use Current Location" in form
   - Verify map opens with GPS
   - Confirm location
   - Verify form fields are populated
   - Verify manually entered fields are preserved
   - Submit form and verify save

3. **Validation**:
   - Try to save with empty name → Should show error
   - Try to save with invalid phone → Should show error
   - Try to save with invalid pincode → Should show error
   - Save with valid data → Should succeed

4. **Edge Cases**:
   - Test with location data missing some fields
   - Test with very long address strings
   - Test with special characters in address
   - Test with network errors during save
