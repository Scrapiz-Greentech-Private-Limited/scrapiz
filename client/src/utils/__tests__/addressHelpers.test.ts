import {
  constructAddressPayload,
  populateFormFromLocation,
  validateAddressPayload,
  AddressPayloadValidationError,
  LocationResult,
  AddressPayloadOptions,
} from '../addressHelpers';
import { CreateAddressRequest } from '../../api/apiService';

describe('addressHelpers', () => {
  const mockLocation: LocationResult = {
    latitude: 19.0760,
    longitude: 72.8777,
    address: '123 Main Street, Powai, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    area: 'Powai',
  };

  describe('constructAddressPayload', () => {
    it('should construct a valid address payload with custom options', () => {
      const options: AddressPayloadOptions = {
        name: 'John Doe',
        phone_number: '9876543210',
        room_number: '101',
        delivery_suggestion: 'Ring the bell',
      };

      const payload = constructAddressPayload(mockLocation, options);

      expect(payload).toEqual({
        name: 'John Doe',
        phone_number: '9876543210',
        room_number: '101',
        street: '123 Main Street',
        area: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: 400076,
        delivery_suggestion: 'Ring the bell',
      });
    });

    it('should use default values when options are not provided', () => {
      const payload = constructAddressPayload(mockLocation);

      expect(payload.name).toBe('Current Location');
      expect(payload.phone_number).toBe('');
      expect(payload.room_number).toBe('');
      expect(payload.delivery_suggestion).toBe('');
      expect(payload.country).toBe('India');
    });

    it('should extract street from address correctly', () => {
      const location: LocationResult = {
        ...mockLocation,
        address: 'Flat 202, Building A, Sector 5',
      };

      const payload = constructAddressPayload(location, {
        name: 'Test',
        phone_number: '9876543210',
      });

      expect(payload.street).toBe('Flat 202');
    });

    it('should parse pincode to number', () => {
      const payload = constructAddressPayload(mockLocation, {
        name: 'Test',
        phone_number: '9876543210',
      });

      expect(typeof payload.pincode).toBe('number');
      expect(payload.pincode).toBe(400076);
    });

    it('should throw validation error for missing name', () => {
      expect(() => {
        constructAddressPayload(mockLocation, {
          phone_number: '9876543210',
        });
      }).toThrow(AddressPayloadValidationError);
    });

    it('should throw validation error for missing phone number', () => {
      expect(() => {
        constructAddressPayload(mockLocation, {
          name: 'John Doe',
        });
      }).toThrow(AddressPayloadValidationError);
    });

    it('should throw validation error for invalid phone number', () => {
      expect(() => {
        constructAddressPayload(mockLocation, {
          name: 'John Doe',
          phone_number: '1234567890', // Doesn't start with 6-9
        });
      }).toThrow(AddressPayloadValidationError);
    });
  });

  describe('validateAddressPayload', () => {
    const validPayload: CreateAddressRequest = {
      name: 'John Doe',
      phone_number: '9876543210',
      room_number: '101',
      street: '123 Main St',
      area: 'Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: 400076,
      delivery_suggestion: 'Ring the bell',
    };

    it('should not throw for valid payload', () => {
      expect(() => validateAddressPayload(validPayload)).not.toThrow();
    });

    it('should throw for empty name', () => {
      const payload = { ...validPayload, name: '' };
      expect(() => validateAddressPayload(payload)).toThrow('Name is required');
    });

    it('should throw for name longer than 50 characters', () => {
      const payload = { ...validPayload, name: 'a'.repeat(51) };
      expect(() => validateAddressPayload(payload)).toThrow('Name must be 50 characters or less');
    });

    it('should throw for empty phone number', () => {
      const payload = { ...validPayload, phone_number: '' };
      expect(() => validateAddressPayload(payload)).toThrow('Phone number is required');
    });

    it('should throw for invalid phone number format', () => {
      const invalidNumbers = ['123456789', '12345678901', '5876543210', 'abcdefghij'];
      
      invalidNumbers.forEach(phone => {
        const payload = { ...validPayload, phone_number: phone };
        expect(() => validateAddressPayload(payload)).toThrow('Phone number must be a valid 10-digit Indian number');
      });
    });

    it('should accept valid Indian phone numbers', () => {
      const validNumbers = ['6123456789', '7123456789', '8123456789', '9123456789'];
      
      validNumbers.forEach(phone => {
        const payload = { ...validPayload, phone_number: phone };
        expect(() => validateAddressPayload(payload)).not.toThrow();
      });
    });

    it('should throw for empty area', () => {
      const payload = { ...validPayload, area: '' };
      expect(() => validateAddressPayload(payload)).toThrow('Area is required');
    });

    it('should throw for empty city', () => {
      const payload = { ...validPayload, city: '' };
      expect(() => validateAddressPayload(payload)).toThrow('City is required');
    });

    it('should throw for empty state', () => {
      const payload = { ...validPayload, state: '' };
      expect(() => validateAddressPayload(payload)).toThrow('State is required');
    });

    it('should throw for empty country', () => {
      const payload = { ...validPayload, country: '' };
      expect(() => validateAddressPayload(payload)).toThrow('Country is required');
    });

    it('should throw for invalid pincode', () => {
      const invalidPincodes = [99999, 1000000, 0, -1];
      
      invalidPincodes.forEach(pincode => {
        const payload = { ...validPayload, pincode };
        expect(() => validateAddressPayload(payload)).toThrow('Pincode must be a valid 6-digit number');
      });
    });

    it('should accept valid pincodes', () => {
      const validPincodes = [100000, 400076, 999999];
      
      validPincodes.forEach(pincode => {
        const payload = { ...validPayload, pincode };
        expect(() => validateAddressPayload(payload)).not.toThrow();
      });
    });

    it('should throw for room number longer than 50 characters', () => {
      const payload = { ...validPayload, room_number: 'a'.repeat(51) };
      expect(() => validateAddressPayload(payload)).toThrow('Room number must be 50 characters or less');
    });

    it('should throw for street longer than 100 characters', () => {
      const payload = { ...validPayload, street: 'a'.repeat(101) };
      expect(() => validateAddressPayload(payload)).toThrow('Street must be 100 characters or less');
    });

    it('should throw for delivery suggestion longer than 200 characters', () => {
      const payload = { ...validPayload, delivery_suggestion: 'a'.repeat(201) };
      expect(() => validateAddressPayload(payload)).toThrow('Delivery suggestion must be 200 characters or less');
    });
  });

  describe('populateFormFromLocation', () => {
    const currentFormData: CreateAddressRequest = {
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

    it('should populate location fields while preserving manual fields', () => {
      const updatedForm = populateFormFromLocation(currentFormData, mockLocation);

      // Location fields should be updated
      expect(updatedForm.area).toBe('Powai');
      expect(updatedForm.city).toBe('Mumbai');
      expect(updatedForm.state).toBe('Maharashtra');
      expect(updatedForm.pincode).toBe(400076);
      expect(updatedForm.street).toBe('123 Main Street');

      // Manual fields should be preserved
      expect(updatedForm.name).toBe('Jane Smith');
      expect(updatedForm.phone_number).toBe('8765432109');
      expect(updatedForm.room_number).toBe('202');
      expect(updatedForm.delivery_suggestion).toBe('Call before delivery');
      expect(updatedForm.country).toBe('India');
    });

    it('should extract street from first part of address', () => {
      const location: LocationResult = {
        ...mockLocation,
        address: 'Building A, Sector 5, Powai',
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);

      expect(updatedForm.street).toBe('Building A');
    });

    it('should handle address with single part', () => {
      const location: LocationResult = {
        ...mockLocation,
        address: 'Powai',
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);

      expect(updatedForm.street).toBe('Powai');
    });

    it('should parse pincode to number', () => {
      const updatedForm = populateFormFromLocation(currentFormData, mockLocation);

      expect(typeof updatedForm.pincode).toBe('number');
      expect(updatedForm.pincode).toBe(400076);
    });

    it('should preserve country if not set', () => {
      const formWithoutCountry = { ...currentFormData, country: '' };
      const updatedForm = populateFormFromLocation(formWithoutCountry, mockLocation);

      expect(updatedForm.country).toBe('India');
    });

    // Edge case tests for Requirements 3.3, 3.4
    it('should handle empty address string', () => {
      const location: LocationResult = {
        ...mockLocation,
        address: '',
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);
      expect(updatedForm.street).toBe('');
    });

    it('should handle invalid pincode by returning 0', () => {
      const location: LocationResult = {
        ...mockLocation,
        pincode: '12345', // Only 5 digits
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);
      expect(updatedForm.pincode).toBe(0);
    });

    it('should handle pincode with non-numeric characters', () => {
      const location: LocationResult = {
        ...mockLocation,
        pincode: '400-076', // Contains dash
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);
      expect(updatedForm.pincode).toBe(400076);
    });

    it('should trim whitespace from text fields', () => {
      const location: LocationResult = {
        ...mockLocation,
        area: '  Powai  ',
        city: '  Mumbai  ',
        state: '  Maharashtra  ',
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);
      expect(updatedForm.area).toBe('Powai');
      expect(updatedForm.city).toBe('Mumbai');
      expect(updatedForm.state).toBe('Maharashtra');
    });

    it('should handle null/undefined location fields gracefully', () => {
      const location: LocationResult = {
        latitude: 19.0760,
        longitude: 72.8777,
        address: null as any,
        city: undefined as any,
        state: null as any,
        pincode: undefined as any,
        area: null as any,
      };

      const updatedForm = populateFormFromLocation(currentFormData, location);
      expect(updatedForm.street).toBe('');
      expect(updatedForm.area).toBe('');
      expect(updatedForm.city).toBe('');
      expect(updatedForm.state).toBe('');
      expect(updatedForm.pincode).toBe(0);
    });

    it('should preserve existing manually entered fields even when they have values', () => {
      const formWithValues: CreateAddressRequest = {
        name: 'Office',
        phone_number: '9123456789',
        room_number: 'Building A, Floor 3',
        street: 'Old Street Name',
        area: 'Old Area',
        city: 'Old City',
        state: 'Old State',
        country: 'India',
        pincode: 123456,
        delivery_suggestion: 'Call before delivery',
      };

      const updatedForm = populateFormFromLocation(formWithValues, mockLocation);

      // Non-location fields should be preserved
      expect(updatedForm.name).toBe('Office');
      expect(updatedForm.phone_number).toBe('9123456789');
      expect(updatedForm.room_number).toBe('Building A, Floor 3');
      expect(updatedForm.delivery_suggestion).toBe('Call before delivery');
      expect(updatedForm.country).toBe('India');

      // Location fields should be updated
      expect(updatedForm.street).toBe('123 Main Street');
      expect(updatedForm.area).toBe('Powai');
      expect(updatedForm.city).toBe('Mumbai');
      expect(updatedForm.state).toBe('Maharashtra');
      expect(updatedForm.pincode).toBe(400076);
    });
  });
});
