import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ApiResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, PasswordResetRequest } from './config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication API Service
export class AuthService {
  // Register user
  static async register(data: RegisterRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  // Verify OTP
  static async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.VERIFY_OTP, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'OTP verification failed');
    }
  }

  // Resend OTP
  static async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESEND_OTP, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
  }

  // Login user
  static async login(data: LoginRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, data);
      if (response.data.jwt) {
        await AsyncStorage.setItem('authToken', response.data.jwt);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  // Logout user
  static async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
      await AsyncStorage.removeItem('authToken');
      return response.data;
    } catch (error: any) {
      // Even if logout fails, remove local token
      await AsyncStorage.removeItem('authToken');
      throw new Error(error.response?.data?.error || 'Logout failed');
    }
  }

  // Password reset request
  static async passwordResetRequest(email: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PASSWORD_RESET_REQUEST, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset request failed');
    }
  }

  // Password reset
  static async passwordReset(data: PasswordResetRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PASSWORD_RESET, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset failed');
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get stored auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }
}
