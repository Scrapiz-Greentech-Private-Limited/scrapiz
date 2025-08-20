import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ApiResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, PasswordResetRequest } from './config';

// User types
export interface ProductSummary {
  id: number;
  name: string;
  max_rate: number;
  min_rate: number;
  unit: string;
  description: string;
  category: number;
}

export interface CategorySummary {
  id: number;
  name: string;
}

export interface OrderItemSummary {
  id: number;
  order_no: number;
  product: ProductSummary;
  quantity: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  user: string;
  created_at: string;
  status: any;
  address: number;
  orders: OrderItemSummary[];
}

export interface AddressSummary {
  id: number;
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion: string;
  user: number;
}

export interface CreateAddressRequest {
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion?: string;
  user?: number;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  is_staff: boolean;
  orders: OrderSummary[];
  addresses: AddressSummary[];
}

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
      // Backend expects raw token in Authorization header (no "Bearer " prefix)
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token;
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
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('API Error:', data || error.message);

    if (status === 401 || status === 403) {
      // Clear token on auth errors so app can redirect to login
      try { await AsyncStorage.removeItem('authToken'); } catch {}
    }
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

  // Get current user profile
  static async getUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER);
      return response.data as UserProfile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  }

  // Update current user's name
  static async updateUserName(name: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.patch(API_CONFIG.ENDPOINTS.USER, { name });
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  }

  // Delete current user
  static async deleteUser(): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(API_CONFIG.ENDPOINTS.USER);
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  }

  // Address APIs
  static async getAddresses(): Promise<AddressSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_ADDRESSES);
      return response.data as AddressSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch addresses');
    }
  }

  static async createAddress(payload: CreateAddressRequest): Promise<AddressSummary> {
    try {
      // Some backends require 'user' in payload; include it proactively
      let body: CreateAddressRequest = { ...payload };
      if (!body.user) {
        try {
          const user = await AuthService.getUser();
          body.user = user.id;
        } catch {}
      }
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.USER_ADDRESSES, body);
      return response.data as AddressSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create address');
    }
  }

  static async updateAddress(id: number, payload: UpdateAddressRequest): Promise<AddressSummary> {
    try {
      let body: any = { ...payload };
      if (!('user' in body)) {
        try {
          const user = await AuthService.getUser();
          body.user = user.id;
        } catch {}
      }
      const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.USER_ADDRESSES}${id}/`, body);
      return response.data as AddressSummary;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update address');
    }
  }

  static async deleteAddress(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.USER_ADDRESSES}${id}/`);
      return response.data as ApiResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete address');
    }
  }

  // Inventory APIs
  static async getCategories(): Promise<CategorySummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_CATEGORIES);
      return response.data as CategorySummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch categories');
    }
  }

  static async getProducts(): Promise<ProductSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_PRODUCTS);
      return response.data as ProductSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch products');
    }
  }

  static async getOrderNos(): Promise<OrderSummary[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVENTORY_ORDERNOS);
      return response.data as OrderSummary[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch orders');
    }
  }

  static async createOrder(items: Array<{ product_id: number; quantity: number }>, address_id?: number): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.INVENTORY_CREATE_ORDER, {
        items,
        address_id,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create order');
    }
  }
}
