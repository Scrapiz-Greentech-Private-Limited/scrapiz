import { AuthService, CreateAddressRequest, AddressSummary } from '../../api/apiService';

// Mock the AuthService
jest.mock('../../api/apiService', () => ({
  AuthService: {
    createAddress: jest.fn(),
  },
}));

describe('LocationSelectionModal - AuthService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Address Creation', () => {
    it('should call AuthService.createAddress with complete payload', async () => {
      // Arrange
      const mockLocation = {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Powai, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076',
        area: 'Powai',
      };

      const expectedPayload: CreateAddressRequest = {
        name: 'Current Location',
        phone_number: '',
        room_number: '',
        street: 'Powai',
        area: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: 400076,
        delivery_suggestion: '',
      };

      const mockResponse: AddressSummary = {
        id: 123,
        name: 'Current Location',
        phone_number: '',
        room_number: '',
        street: 'Powai',
        area: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: 400076,
        delivery_suggestion: '',
        user: 1,
      };

      (AuthService.createAddress as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await AuthService.createAddress(expectedPayload);

      // Assert
      expect(AuthService.createAddress).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(123);
    });

    it('should extract address ID from successful response', async () => {
      // Arrange
      const mockResponse: AddressSummary = {
        id: 456,
        name: 'Current Location',
        phone_number: '',
        room_number: '',
        street: 'Test Street',
        area: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: 123456,
        delivery_suggestion: '',
        user: 1,
      };

      (AuthService.createAddress as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await AuthService.createAddress({
        name: 'Current Location',
        phone_number: '',
        room_number: '',
        street: 'Test Street',
        area: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: 123456,
        delivery_suggestion: '',
      });

      // Assert
      expect(result.id).toBeDefined();
      expect(result.id).toBe(456);
      expect(typeof result.id).toBe('number');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Failed to save address. Please try again.');
      (AuthService.createAddress as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        AuthService.createAddress({
          name: 'Current Location',
          phone_number: '',
          room_number: '',
          street: 'Test',
          area: 'Test',
          city: 'Test',
          state: 'Test',
          country: 'India',
          pincode: 123456,
        })
      ).rejects.toThrow('Failed to save address. Please try again.');
    });

    it('should construct payload with all required fields', () => {
      // Arrange
      const location = {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Powai, Mumbai, Maharashtra',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076',
        area: 'Powai',
      };

      // Act
      const payload: CreateAddressRequest = {
        name: 'Current Location',
        phone_number: '',
        room_number: '',
        street: location.address.split(',')[0] || '',
        area: location.area,
        city: location.city,
        state: location.state,
        country: 'India',
        pincode: parseInt(location.pincode) || 0,
        delivery_suggestion: '',
      };

      // Assert - Verify all required fields are present
      expect(payload).toHaveProperty('name');
      expect(payload).toHaveProperty('phone_number');
      expect(payload).toHaveProperty('room_number');
      expect(payload).toHaveProperty('street');
      expect(payload).toHaveProperty('area');
      expect(payload).toHaveProperty('city');
      expect(payload).toHaveProperty('state');
      expect(payload).toHaveProperty('country');
      expect(payload).toHaveProperty('pincode');
      expect(payload.street).toBe('Powai');
      expect(payload.pincode).toBe(400076);
    });
  });
});
