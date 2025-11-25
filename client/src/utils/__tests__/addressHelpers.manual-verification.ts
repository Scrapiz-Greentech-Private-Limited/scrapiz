/**
 * Manual verification script for populateFormFromLocation
 * 
 * This script demonstrates the function working with various edge cases
 * Run this with: npx ts-node src/utils/__tests__/addressHelpers.manual-verification.ts
 */

import { populateFormFromLocation, AddressFormData, LocationResult } from '../addressHelpers';

console.log('=== Testing populateFormFromLocation ===\n');

// Test 1: Normal case with all fields
console.log('Test 1: Normal case with all fields');
const formData1: AddressFormData = {
  name: 'Home',
  phone_number: '9876543210',
  room_number: 'Flat 101',
  street: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  delivery_suggestion: 'Ring the bell twice',
};

const location1: LocationResult = {
  latitude: 19.0760,
  longitude: 72.8777,
  address: 'Powai, Mumbai, Maharashtra',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400076',
  area: 'Powai',
};

const result1 = populateFormFromLocation(formData1, location1);
console.log('Input form data:', formData1);
console.log('Location data:', location1);
console.log('Result:', result1);
console.log('✓ Manually entered fields preserved:', 
  result1.name === 'Home' && 
  result1.phone_number === '9876543210' && 
  result1.room_number === 'Flat 101' &&
  result1.delivery_suggestion === 'Ring the bell twice'
);
console.log('✓ Location fields populated:', 
  result1.area === 'Powai' && 
  result1.city === 'Mumbai' && 
  result1.state === 'Maharashtra' &&
  result1.pincode === '400076' &&
  result1.street === 'Powai'
);
console.log('');

// Test 2: Edge case - empty address
console.log('Test 2: Edge case - empty address');
const location2: LocationResult = {
  ...location1,
  address: '',
};
const result2 = populateFormFromLocation(formData1, location2);
console.log('Empty address result:', result2.street);
console.log('✓ Empty address handled:', result2.street === '');
console.log('');

// Test 3: Edge case - invalid pincode
console.log('Test 3: Edge case - invalid pincode (5 digits)');
const location3: LocationResult = {
  ...location1,
  pincode: '12345',
};
const result3 = populateFormFromLocation(formData1, location3);
console.log('Invalid pincode result:', result3.pincode);
console.log('✓ Invalid pincode handled:', result3.pincode === '');
console.log('');

// Test 4: Edge case - pincode with non-numeric characters
console.log('Test 4: Edge case - pincode with dash');
const location4: LocationResult = {
  ...location1,
  pincode: '400-076',
};
const result4 = populateFormFromLocation(formData1, location4);
console.log('Pincode with dash result:', result4.pincode);
console.log('✓ Non-numeric characters removed:', result4.pincode === '400076');
console.log('');

// Test 5: Edge case - whitespace in fields
console.log('Test 5: Edge case - whitespace in fields');
const location5: LocationResult = {
  ...location1,
  area: '  Powai  ',
  city: '  Mumbai  ',
  state: '  Maharashtra  ',
};
const result5 = populateFormFromLocation(formData1, location5);
console.log('Whitespace trimmed:', result5.area, result5.city, result5.state);
console.log('✓ Whitespace trimmed:', 
  result5.area === 'Powai' && 
  result5.city === 'Mumbai' && 
  result5.state === 'Maharashtra'
);
console.log('');

// Test 6: Edge case - null/undefined fields
console.log('Test 6: Edge case - null/undefined fields');
const location6: LocationResult = {
  latitude: 19.0760,
  longitude: 72.8777,
  address: null as any,
  city: undefined as any,
  state: null as any,
  pincode: undefined as any,
  area: null as any,
};
const result6 = populateFormFromLocation(formData1, location6);
console.log('Null/undefined fields result:', result6);
console.log('✓ Null/undefined handled:', 
  result6.street === '' && 
  result6.area === '' && 
  result6.city === '' &&
  result6.state === '' &&
  result6.pincode === ''
);
console.log('');

// Test 7: Preserving existing values
console.log('Test 7: Preserving existing manually entered values');
const formData7: AddressFormData = {
  name: 'Office',
  phone_number: '9123456789',
  room_number: 'Building A, Floor 3',
  street: 'Old Street',
  area: 'Old Area',
  city: 'Old City',
  state: 'Old State',
  country: 'India',
  pincode: '123456',
  delivery_suggestion: 'Call before delivery',
};
const result7 = populateFormFromLocation(formData7, location1);
console.log('Manual fields preserved:', {
  name: result7.name,
  phone_number: result7.phone_number,
  room_number: result7.room_number,
  delivery_suggestion: result7.delivery_suggestion,
});
console.log('Location fields updated:', {
  street: result7.street,
  area: result7.area,
  city: result7.city,
  state: result7.state,
  pincode: result7.pincode,
});
console.log('✓ Manual fields preserved and location fields updated:', 
  result7.name === 'Office' && 
  result7.phone_number === '9123456789' &&
  result7.area === 'Powai' &&
  result7.city === 'Mumbai'
);
console.log('');

console.log('=== All tests completed ===');
