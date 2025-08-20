// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.0.101:8000/api',
  ENDPOINTS: {
    // Authentication endpoints
    REGISTER: '/register',
    LOGIN: '/login',
    LOGOUT: '/logout',
    VERIFY_OTP: '/register', // PUT request
    RESEND_OTP: '/resendotp',
    PASSWORD_RESET_REQUEST: '/password-reset-request',
    PASSWORD_RESET: '/password-reset',
    OAUTH_LOGIN: '/oauth-login',
  },
  HEADERS: {
    'Content-Type': 'application/json',
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
