import { CreateAddressRequest } from '../api/apiService';

/**
 * LocationResult interface from MapLocationPicker
 */
export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
}

/**
 * Options for constructing address payload with custom defaults
 */
export interface AddressPayloadOptions {
  name?: string;
  phone_number?: string;
  room_number?: string;
  delivery_suggestion?: string;
}

/**
 * Validation error for address payload construction
 */
export class AddressPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AddressPayloadValidationError';
  }
}

/**
 * Validates required fields for address payload
 * @param payload - The address payload to validate
 * @throws {AddressPayloadValidationError} If validation fails
 */
export function validateAddressPayload(payload: CreateAddressRequest): void {
  // Validate name
  if (!payload.name || payload.name.trim().length === 0) {
    throw new AddressPayloadValidationError('Name is required');
  }
  if (payload.name.length > 50) {
    throw new AddressPayloadValidationError('Name must be 50 characters or less');
  }

  // Validate phone_number
  if (!payload.phone_number || payload.phone_number.trim().length === 0) {
    throw new AddressPayloadValidationError('Phone number is required');
  }
  // Indian phone number validation: 10 digits, starts with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(payload.phone_number)) {
    throw new AddressPayloadValidationError('Phone number must be a valid 10-digit Indian number starting with 6-9');
  }

  // Validate area
  if (!payload.area || payload.area.trim().length === 0) {
    throw new AddressPayloadValidationError('Area is required');
  }

  // Validate city
  if (!payload.city || payload.city.trim().length === 0) {
    throw new AddressPayloadValidationError('City is required');
  }

  // Validate state
  if (!payload.state || payload.state.trim().length === 0) {
    throw new AddressPayloadValidationError('State is required');
  }

  // Validate country
  if (!payload.country || payload.country.trim().length === 0) {
    throw new AddressPayloadValidationError('Country is required');
  }

  // Validate pincode
  if (!payload.pincode) {
    throw new AddressPayloadValidationError('Pincode is required');
  }
  if (payload.pincode < 100000 || payload.pincode > 999999) {
    throw new AddressPayloadValidationError('Pincode must be a valid 6-digit number');
  }

  // Optional fields validation
  if (payload.room_number && payload.room_number.length > 50) {
    throw new AddressPayloadValidationError('Room number must be 50 characters or less');
  }

  if (payload.street && payload.street.length > 100) {
    throw new AddressPayloadValidationError('Street must be 100 characters or less');
  }

  if (payload.delivery_suggestion && payload.delivery_suggestion.length > 200) {
    throw new AddressPayloadValidationError('Delivery suggestion must be 200 characters or less');
  }
}

/**
 * Constructs a complete address payload from LocationResult
 * Maps LocationResult fields to CreateAddressRequest fields and handles default values
 * 
 * @param location - The location result from map selection
 * @param options - Optional custom values for name, phone_number, room_number, and delivery_suggestion
 * @returns A complete CreateAddressRequest payload
 * @throws {AddressPayloadValidationError} If required fields are missing or invalid
 * 
 * @example
 * const location: LocationResult = {
 *   latitude: 19.0760,
 *   longitude: 72.8777,
 *   address: '123 Main St, Powai',
 *   city: 'Mumbai',
 *   state: 'Maharashtra',
 *   pincode: '400076',
 *   area: 'Powai'
 * };
 * 
 * const payload = constructAddressPayload(location, {
 *   name: 'John Doe',
 *   phone_number: '9876543210'
 * });
 */
export function constructAddressPayload(
  location: LocationResult,
  options: AddressPayloadOptions = {}
): CreateAddressRequest {
  // Extract street from address (first part before comma)
  const addressParts = location.address.split(',');
  const street = addressParts[0]?.trim() || '';

  // Parse pincode to number
  const pincodeNum = parseInt(location.pincode, 10);
  
  // Construct payload with defaults
  const payload: CreateAddressRequest = {
    name: options.name || 'Current Location',
    phone_number: options.phone_number || '',
    room_number: options.room_number || '',
    street: street,
    area: location.area,
    city: location.city,
    state: location.state,
    country: 'India',
    pincode: pincodeNum,
    delivery_suggestion: options.delivery_suggestion || '',
  };

  // Validate the constructed payload
  validateAddressPayload(payload);

  return payload;
}

/**
 * Form data type with string pincode (used in UI forms)
 */
export interface AddressFormData {
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  delivery_suggestion: string;
}

/**
 * Populates form fields from location data while preserving manually entered fields
 * Used in form-populate mode to update only location-dependent fields
 * 
 * This function handles edge cases:
 * - Empty or malformed address strings
 * - Invalid pincode formats
 * - Null/undefined location fields
 * - Whitespace in text fields
 * 
 * @param currentFormData - Current form data with manually entered fields
 * @param location - Location result from map selection
 * @returns Updated form data with location fields populated
 * 
 * @example
 * const formData = {
 *   name: 'John Doe',
 *   phone_number: '9876543210',
 *   room_number: '101',
 *   street: '',
 *   area: '',
 *   city: '',
 *   state: '',
 *   country: 'India',
 *   pincode: '',
 *   delivery_suggestion: 'Ring the bell'
 * };
 * 
 * const updatedForm = populateFormFromLocation(formData, location);
 * // Result: location fields updated, name/phone/room/delivery_suggestion preserved
 */
export function populateFormFromLocation(
  currentFormData: AddressFormData,
  location: LocationResult
): AddressFormData;
export function populateFormFromLocation(
  currentFormData: CreateAddressRequest,
  location: LocationResult
): CreateAddressRequest;
export function populateFormFromLocation(
  currentFormData: AddressFormData | CreateAddressRequest,
  location: LocationResult
): AddressFormData | CreateAddressRequest {
  // Extract street from address (first part before comma)
  // Handle edge case where address might be empty or malformed
  const extractStreet = (address: string): string => {
    if (!address || typeof address !== 'string') {
      return '';
    }
    const parts = address.split(',');
    return parts[0]?.trim() || '';
  };

  // Validate and sanitize pincode
  // Handle edge cases: non-numeric, wrong length, or missing pincode
  const sanitizePincode = (pincode: string): string => {
    if (!pincode || typeof pincode !== 'string') {
      return '';
    }
    // Remove any non-numeric characters
    const cleaned = pincode.replace(/[^0-9]/g, '');
    // Return only if it's a valid 6-digit pincode
    return cleaned.length === 6 ? cleaned : '';
  };

  // Validate and sanitize text fields
  // Handle edge cases: null, undefined, or non-string values
  const sanitizeText = (value: string | null | undefined): string => {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return value.trim();
  };

  // Check if we're working with AddressFormData (string pincode) or CreateAddressRequest (number pincode)
  const isFormData = typeof (currentFormData as any).pincode === 'string';

  if (isFormData) {
    // Return AddressFormData with string pincode
    return {
      ...currentFormData,
      // Update location-dependent fields
      street: extractStreet(location.address),
      area: sanitizeText(location.area),
      city: sanitizeText(location.city),
      state: sanitizeText(location.state),
      pincode: sanitizePincode(location.pincode),
      // Preserve manually entered fields
      name: currentFormData.name,
      phone_number: currentFormData.phone_number,
      room_number: currentFormData.room_number,
      delivery_suggestion: currentFormData.delivery_suggestion,
      country: currentFormData.country || 'India',
    } as AddressFormData;
  } else {
    // Return CreateAddressRequest with number pincode
    const pincodeStr = sanitizePincode(location.pincode);
    const pincodeNum = pincodeStr ? parseInt(pincodeStr, 10) : 0;

    return {
      ...currentFormData,
      // Update location-dependent fields
      street: extractStreet(location.address),
      area: sanitizeText(location.area),
      city: sanitizeText(location.city),
      state: sanitizeText(location.state),
      pincode: pincodeNum,
      // Preserve manually entered fields
      name: currentFormData.name,
      phone_number: currentFormData.phone_number,
      room_number: currentFormData.room_number,
      delivery_suggestion: currentFormData.delivery_suggestion,
      country: currentFormData.country || 'India',
    } as CreateAddressRequest;
  }
}
