/**
 * Manual verification script for addressHelpers
 * This file demonstrates the usage of the address helper functions
 * Run this in a TypeScript playground or Node environment to verify functionality
 */

import {
  constructAddressPayload,
  populateFormFromLocation,
  validateAddressPayload,
  AddressPayloadValidationError,
  LocationResult,
} from '../addressHelpers';

console.log('=== Address Helpers Manual Verification ===\n');

// Test 1: Construct address payload with valid options
console.log('Test 1: Construct address payload with valid options');
const location1: LocationResult = {
  latitude: 19.0760,
  longitude: 72.8777,
  address: '123 Main Street, Powai, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400076',
  area: 'Powai',
};

try {
  const payload1 = constructAddressPayload(location1, {
    name: 'John Doe',
    phone_number: '9876543210',
    room_number: '101',
    delivery_suggestion: 'Ring the bell',
  });
  console.log('✅ Success:', JSON.stringify(payload1, null, 2));
} catch (error) {
  console.log('❌ Error:', error);
}

// Test 2: Construct with default values
console.log('\nTest 2: Construct with default values (should fail validation)');
try {
  const payload2 = constructAddressPayload(location1);
  console.log('✅ Success:', JSON.stringify(payload2, null, 2));
} catch (error) {
  if (error instanceof AddressPayloadValidationError) {
    console.log('✅ Expected validation error:', error.message);
  } else {
    console.log('❌ Unexpected error:', error);
  }
}

// Test 3: Invalid phone number
console.log('\nTest 3: Invalid phone number (should fail)');
try {
  const payload3 = constructAddressPayload(location1, {
    name: 'John Doe',
    phone_number: '1234567890', // Invalid: doesn't start with 6-9
  });
  console.log('❌ Should have failed validation');
} catch (error) {
  if (error instanceof AddressPayloadValidationError) {
    console.log('✅ Expected validation error:', error.message);
  } else {
    console.log('❌ Unexpected error:', error);
  }
}

// Test 4: Populate form from location
console.log('\nTest 4: Populate form from location (preserve manual fields)');
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

const updatedForm = populateFormFromLocation(currentForm, location1);
console.log('Original manual fields:');
console.log('  name:', currentForm.name);
console.log('  phone_number:', currentForm.phone_number);
console.log('  room_number:', currentForm.room_number);
console.log('  delivery_suggestion:', currentForm.delivery_suggestion);

console.log('\nUpdated form (manual fields preserved):');
console.log('  name:', updatedForm.name, updatedForm.name === currentForm.name ? '✅' : '❌');
console.log('  phone_number:', updatedForm.phone_number, updatedForm.phone_number === currentForm.phone_number ? '✅' : '❌');
console.log('  room_number:', updatedForm.room_number, updatedForm.room_number === currentForm.room_number ? '✅' : '❌');
console.log('  delivery_suggestion:', updatedForm.delivery_suggestion, updatedForm.delivery_suggestion === currentForm.delivery_suggestion ? '✅' : '❌');

console.log('\nUpdated location fields:');
console.log('  area:', updatedForm.area, updatedForm.area === location1.area ? '✅' : '❌');
console.log('  city:', updatedForm.city, updatedForm.city === location1.city ? '✅' : '❌');
console.log('  state:', updatedForm.state, updatedForm.state === location1.state ? '✅' : '❌');
console.log('  pincode:', updatedForm.pincode, updatedForm.pincode === 400076 ? '✅' : '❌');

// Test 5: Validate various edge cases
console.log('\nTest 5: Edge case validations');

const testCases = [
  { name: 'Empty name', payload: { name: '', phone_number: '9876543210', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: true },
  { name: 'Long name (51 chars)', payload: { name: 'a'.repeat(51), phone_number: '9876543210', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: true },
  { name: 'Valid name (50 chars)', payload: { name: 'a'.repeat(50), phone_number: '9876543210', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: false },
  { name: 'Phone starting with 6', payload: { name: 'Test', phone_number: '6123456789', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: false },
  { name: 'Phone starting with 9', payload: { name: 'Test', phone_number: '9123456789', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: false },
  { name: 'Invalid pincode (5 digits)', payload: { name: 'Test', phone_number: '9876543210', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 99999, room_number: '', street: '' }, shouldFail: true },
  { name: 'Valid pincode (6 digits)', payload: { name: 'Test', phone_number: '9876543210', area: 'Test', city: 'Test', state: 'Test', country: 'India', pincode: 400076, room_number: '', street: '' }, shouldFail: false },
];

testCases.forEach(({ name, payload, shouldFail }) => {
  try {
    validateAddressPayload(payload as any);
    if (shouldFail) {
      console.log(`❌ ${name}: Should have failed but passed`);
    } else {
      console.log(`✅ ${name}: Passed as expected`);
    }
  } catch (error) {
    if (shouldFail) {
      console.log(`✅ ${name}: Failed as expected - ${error instanceof Error ? error.message : error}`);
    } else {
      console.log(`❌ ${name}: Should have passed but failed - ${error instanceof Error ? error.message : error}`);
    }
  }
});

console.log('\n=== Verification Complete ===');
