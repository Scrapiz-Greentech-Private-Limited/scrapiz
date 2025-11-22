// API Configuration
import Constants from 'expo-constants';

const FRONTEND_KEY =
  (Constants.expoConfig?.extra as any)?.env?.EXPO_PUBLIC_FRONTEND_SECRET ||
  (Constants.manifest as any)?.extra?.env?.EXPO_PUBLIC_FRONTEND_SECRET ||
  process.env.EXPO_PUBLIC_FRONTEND_SECRET ||
  'Scrapiz#0nn$(tab!z';

console.log("frontend key is ",FRONTEND_KEY)
export const API_CONFIG = {
  BASE_URL: 'https://api.scrapiz.in/api',
  ENDPOINTS: {
    // Authentication endpoints
    REGISTER: '/authentication/register/',
    LOGIN: '/authentication/login/',
    LOGOUT: '/authentication/logout/',
    VERIFY_OTP: '/authentication/register/', // PUT request
    RESEND_OTP: '/authentication/resendotp/',
    PASSWORD_RESET_REQUEST: '/authentication/password-reset-request/',
    PASSWORD_RESET: '/authentication/password-reset/',
    USER: '/authentication/user/',
    GOOGLE_LOGIN: '/authentication/google-login/',
    USER_ADDRESSES: '/user/address/',
    USER_NOTIFICATION_SETTINGS: '/user/notification-settings/',
    SERVICE_BOOKINGS: '/services/bookings/',
    REGISTER_PUSH_TOKEN: '/user/register-push-token/',
    UNREGISTER_PUSH_TOKEN: '/user/unregister-push-token/',
    PUSH_NOTIFICATION_PREFERENCES: '/user/notification-preferences/',
    
    // Referral endpoints
    REFERRED_USERS: '/authentication/referrals/users/',
    REFERRAL_TRANSACTIONS: '/authentication/referrals/transactions/',
    REDEEM_REFERRAL_BALANCE: '/authentication/referrals/redeem/',
    
    // Inventory
    INVENTORY_CATEGORIES: '/inventory/categories/',
    INVENTORY_PRODUCTS: '/inventory/products/',
    INVENTORY_ORDERNOS: '/inventory/ordernos/',
    INVENTORY_CREATE_ORDER: '/inventory/create-order/',
    INVENTORY_CANCEL_ORDER: '/inventory/cancel-order/',
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
  promo_code?: string; // Optional referral/promo code
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
  confirm_password: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  pickupReminders: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  promotionalOffers: boolean;
  weeklyReports: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface PushNotificationPreferences {
  push_notification_enabled: boolean;
  order_updates: boolean;
  promotions: boolean;
  announcements: boolean;
  general: boolean;
}

export interface ServiceBookingPayload {
  service: string;
  name: string;
  phone: string;
  address: string;
  preferredDateTime: string;
  notes?: string;
}

export interface ServiceBooking {
  id: number;
  service: string;
  name: string;
  phone: string;
  address: string;
  preferred_datetime: string;
  status: string;
  meeting_link?: string | null;
  meeting_event_id?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface GoogleLoginResponse extends ApiResponse {
  jwt?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}
