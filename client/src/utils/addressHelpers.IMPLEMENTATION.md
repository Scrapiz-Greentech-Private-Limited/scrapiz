# Address Helpers Implementation - Form Field Population

## Overview

This document describes the implementation of the `populateFormFromLocation` helper function for Task 7 of the location-map-integration feature.

## Implementation Details

### Function: `populateFormFromLocation`

**Location:** `client/src/utils/addressHelpers.ts`

**Purpose:** Populates form fields from map location data while preserving manually entered fields.

### Key Features

1. **Dual Type Support**
   - Supports both `AddressFormData` (string pincode) and `CreateAddressRequest` (number pincode)
   - Uses function overloading for type safety
   - Automatically detects which type is being used

2. **Field Mapping**
   - **Location-dependent fields (updated):**
     - `street` - Extracted from first part of address
     - `area` - From location.area
     - `city` - From location.city
     - `state` - From location.state
     - `pincode` - From location.pincode (sanitized)
   
   - **Manually entered fields (preserved):**
     - `name`
     - `phone_number`
     - `room_number`
     - `delivery_suggestion`
     - `country`

3. **Edge Case Handling**

   #### Empty or Malformed Address
   ```typescript
   // Input: address = ''
   // Output: street = ''
   
   // Input: address = 'SingleString'
   // Output: street = 'SingleString'
   ```

   #### Invalid Pincode
   ```typescript
   // Input: pincode = '12345' (5 digits)
   // Output: pincode = '' (string) or 0 (number)
   
   // Input: pincode = '400-076' (contains dash)
   // Output: pincode = '400076'
   
   // Input: pincode = '4000761' (7 digits)
   // Output: pincode = ''
   ```

   #### Null/Undefined Fields
   ```typescript
   // Input: city = null or undefined
   // Output: city = ''
   ```

   #### Whitespace
   ```typescript
   // Input: area = '  Powai  '
   // Output: area = 'Powai'
   ```

## Usage Example

### In AddressesScreen

```typescript
import { populateFormFromLocation, LocationResult } from '../../utils/addressHelpers';

const handleMapLocationSelect = (location: LocationResult) => {
  // Populate form fields with location data using helper function
  const updatedFormData = populateFormFromLocation(formData, location);
  setFormData(updatedFormData);
  
  setShowMapPicker(false);
  
  Toast.show({
    type: 'success',
    text1: 'Location Selected',
    text2: 'Address fields have been populated',
  });
};
```

### Example Data Flow

**Input Form Data:**
```typescript
{
  name: 'Home',
  phone_number: '9876543210',
  room_number: 'Flat 101',
  street: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  delivery_suggestion: 'Ring the bell twice'
}
```

**Location Data:**
```typescript
{
  latitude: 19.0760,
  longitude: 72.8777,
  address: 'Powai, Mumbai, Maharashtra',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400076',
  area: 'Powai'
}
```

**Output Form Data:**
```typescript
{
  name: 'Home',                    // ✓ Preserved
  phone_number: '9876543210',      // ✓ Preserved
  room_number: 'Flat 101',         // ✓ Preserved
  street: 'Powai',                 // ✓ Populated
  area: 'Powai',                   // ✓ Populated
  city: 'Mumbai',                  // ✓ Populated
  state: 'Maharashtra',            // ✓ Populated
  country: 'India',                // ✓ Preserved
  pincode: '400076',               // ✓ Populated
  delivery_suggestion: 'Ring...'   // ✓ Preserved
}
```

## Testing

### Unit Tests

Location: `client/src/utils/__tests__/addressHelpers.test.ts`

Tests cover:
- Normal field population
- Field preservation
- Street extraction from address
- Pincode sanitization
- Whitespace trimming
- Null/undefined handling
- Edge cases with invalid data

### Manual Verification

Location: `client/src/utils/__tests__/addressHelpers.manual-verification.ts`

Run with:
```bash
npx ts-node src/utils/__tests__/addressHelpers.manual-verification.ts
```

## Requirements Validation

✅ **Requirement 3.3:** Map confirmation populates form fields
- Location fields (area, city, state, pincode, street) are populated from LocationResult

✅ **Requirement 3.4:** Selective field preservation
- Manually entered fields (name, phone_number, room_number, delivery_suggestion) are preserved

✅ **Edge Cases Handled:**
- Empty or malformed addresses
- Invalid pincode formats
- Null/undefined location fields
- Whitespace in text fields

## Integration Points

1. **AddressesScreen** (`client/src/app/profile/addresses.tsx`)
   - Uses the helper in `handleMapLocationSelect`
   - Passes `AddressFormData` type (string pincode)

2. **LocationSelectionModal** (future integration)
   - Can use the helper with `CreateAddressRequest` type (number pincode)

## Type Safety

The function uses TypeScript function overloading to ensure type safety:

```typescript
export function populateFormFromLocation(
  currentFormData: AddressFormData,
  location: LocationResult
): AddressFormData;

export function populateFormFromLocation(
  currentFormData: CreateAddressRequest,
  location: LocationResult
): CreateAddressRequest;
```

This ensures that:
- Input type matches output type
- No type casting needed at call sites
- Full IntelliSense support

## Performance Considerations

- All helper functions are pure functions with no side effects
- String operations are minimal and efficient
- No external dependencies or API calls
- Suitable for synchronous form updates

## Future Enhancements

Potential improvements:
1. Add support for custom field mapping configurations
2. Add validation hooks for custom business rules
3. Support for partial updates (only update specified fields)
4. Add logging/debugging mode for troubleshooting
