# Address Helpers

Utility functions for constructing and validating address payloads from map location selections.

## Overview

This module provides helper functions to:
1. Construct complete address payloads from map location data
2. Validate address payloads before submission
3. Populate form fields from location data while preserving manually entered fields

## Functions

### `constructAddressPayload(location, options?)`

Constructs a complete `CreateAddressRequest` payload from a `LocationResult` object.

**Parameters:**
- `location: LocationResult` - Location data from map selection
- `options?: AddressPayloadOptions` - Optional custom values for name, phone_number, room_number, and delivery_suggestion

**Returns:** `CreateAddressRequest` - Complete address payload ready for API submission

**Throws:** `AddressPayloadValidationError` - If validation fails

**Example:**
```typescript
import { constructAddressPayload } from './utils/addressHelpers';

const location = {
  latitude: 19.0760,
  longitude: 72.8777,
  address: '123 Main Street, Powai, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400076',
  area: 'Powai',
};

const payload = constructAddressPayload(location, {
  name: 'John Doe',
  phone_number: '9876543210',
  room_number: '101',
  delivery_suggestion: 'Ring the bell',
});

// Use payload with AuthService.createAddress(payload)
```

### `validateAddressPayload(payload)`

Validates an address payload against all required field constraints.

**Parameters:**
- `payload: CreateAddressRequest` - Address payload to validate

**Throws:** `AddressPayloadValidationError` - If validation fails with specific error message

**Validation Rules:**
- **name**: Required, max 50 characters
- **phone_number**: Required, must be valid 10-digit Indian number starting with 6-9
- **area**: Required
- **city**: Required
- **state**: Required
- **country**: Required
- **pincode**: Required, must be 6-digit number (100000-999999)
- **room_number**: Optional, max 50 characters
- **street**: Optional, max 100 characters
- **delivery_suggestion**: Optional, max 200 characters

**Example:**
```typescript
import { validateAddressPayload, AddressPayloadValidationError } from './utils/addressHelpers';

try {
  validateAddressPayload(payload);
  // Payload is valid, proceed with submission
} catch (error) {
  if (error instanceof AddressPayloadValidationError) {
    console.error('Validation failed:', error.message);
    // Show error to user
  }
}
```

### `populateFormFromLocation(currentFormData, location)`

Populates form fields from location data while preserving manually entered non-location fields.

**Parameters:**
- `currentFormData: CreateAddressRequest` - Current form data with manually entered fields
- `location: LocationResult` - Location data from map selection

**Returns:** `CreateAddressRequest` - Updated form data with location fields populated

**Preserved Fields:**
- name
- phone_number
- room_number
- delivery_suggestion
- country

**Updated Fields:**
- street (extracted from address)
- area
- city
- state
- pincode

**Example:**
```typescript
import { populateFormFromLocation } from './utils/addressHelpers';

const currentForm = {
  name: 'Jane Smith',
  phone_number: '8765432109',
  room_number: '202',
  street: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: 0,
  delivery_suggestion: 'Call before delivery',
};

const updatedForm = populateFormFromLocation(currentForm, location);
// updatedForm will have location fields populated while preserving name, phone, etc.
```

## Integration Examples

### LocationSelectionModal (GPS Mode)

```typescript
import { constructAddressPayload } from '../utils/addressHelpers';
import { AuthService } from '../api/apiService';

const handleMapLocationConfirm = async (location: LocationResult) => {
  try {
    // Get user info for defaults
    const user = await AuthService.getUser();
    
    const payload = constructAddressPayload(location, {
      name: user.name || 'Current Location',
      phone_number: user.addresses[0]?.phone_number || '',
    });
    
    const savedAddress = await AuthService.createAddress(payload);
    // Update context and close modals
  } catch (error) {
    if (error instanceof AddressPayloadValidationError) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error.message,
      });
    }
  }
};
```

### AddressesScreen (Form Populate Mode)

```typescript
import { populateFormFromLocation } from '../utils/addressHelpers';

const handleMapLocationSelect = (location: LocationResult) => {
  const updatedForm = populateFormFromLocation(formData, location);
  setFormData(updatedForm);
  
  Toast.show({
    type: 'success',
    text1: 'Location Selected',
    text2: 'Address fields have been populated',
  });
};
```

## Error Handling

All validation errors are thrown as `AddressPayloadValidationError` instances with descriptive messages:

```typescript
try {
  const payload = constructAddressPayload(location, options);
} catch (error) {
  if (error instanceof AddressPayloadValidationError) {
    // Handle validation error
    console.error(error.message);
    // Possible messages:
    // - "Name is required"
    // - "Phone number must be a valid 10-digit Indian number starting with 6-9"
    // - "Pincode must be a valid 6-digit number"
    // etc.
  }
}
```

## Testing

Unit tests are available in `__tests__/addressHelpers.test.ts` covering:
- Payload construction with various options
- Field mapping and extraction
- Validation rules for all fields
- Form population with field preservation
- Edge cases and error conditions

Run tests with:
```bash
npm test addressHelpers.test.ts
```
