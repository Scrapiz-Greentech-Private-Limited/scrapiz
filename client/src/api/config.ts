// API Configuration
import Constants from 'expo-constants';

const FRONTEND_KEY =
  (Constants.expoConfig?.extra as any)?.env?.EXPO_PUBLIC_FRONTEND_SECRET ||
  (Constants.manifest as any)?.extra?.env?.EXPO_PUBLIC_FRONTEND_SECRET ||
  process.env.EXPO_PUBLIC_FRONTEND_SECRET ||
  'Scrapiz#0nn$(tab!z';

export const API_CONFIG = {
  BASE_URL: 'http://192.168.0.104:8000/api',
  ENDPOINTS: {
    // Authentication endpoints
    REGISTER: '/authentication/register',
    LOGIN: '/authentication/login',
    LOGOUT: '/authentication/logout',
    VERIFY_OTP: '/authentication/register', // PUT request
    RESEND_OTP: '/authentication/resendotp',
    PASSWORD_RESET_REQUEST: '/authentication/password-reset-request',
    PASSWORD_RESET: '/authentication/password-reset',
    USER: '/authentication/user',
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'x-auth-app': FRONTEND_KEY,
  },
};

// API Response types
export interface ApiResponse {
  message?: string;
  jwt?: string;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  confirm_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
  otp: string;
  new_password: string;
}
