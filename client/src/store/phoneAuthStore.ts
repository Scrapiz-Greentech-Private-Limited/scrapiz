import { create } from 'zustand';

/**
 * Phone Authentication State Machine States
 * 
 * State transitions are driven by backend responses:
 * - LOGIN -> PHONE_INPUT: User initiates phone login
 * - PHONE_INPUT -> OTP_VERIFY: OTP sent successfully
 * - OTP_VERIFY -> AUTHENTICATED: Existing user verified
 * - OTP_VERIFY -> PROFILE_REQUIRED: New user needs profile
 * - PROFILE_REQUIRED -> AUTHENTICATED: Profile completed, new user created
 * - PROFILE_REQUIRED -> LINK_CONFIRMATION: Email collision detected
 * - LINK_CONFIRMATION -> AUTHENTICATED: User confirmed account linking
 * - Any state -> ERROR: Error occurred
 */
export type PhoneAuthState =
  | 'LOGIN'
  | 'PHONE_INPUT'
  | 'OTP_VERIFY'
  | 'PROFILE_REQUIRED'
  | 'LINK_CONFIRMATION'
  | 'AUTHENTICATED'
  | 'ERROR';

/**
 * Response from /phone/verify/ endpoint for existing users
 */
export interface PhoneVerifySuccessResponse {
  jwt: string;
  message: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

/**
 * Response from /phone/verify/ endpoint for new users
 */
export interface PhoneVerifyProfileRequiredResponse {
  profile_required: true;
  phone_number: string;
  firebase_uid: string;
  message: string;
}

/**
 * Response from /phone/complete-profile/ when email collision detected
 */
export interface PhoneLinkConfirmationResponse {
  requires_link_confirmation: true;
  existing_email: string;
  auth_provider: string;
  message: string;
}

/**
 * User data returned on successful authentication
 */
export interface PhoneAuthUser {
  id: number;
  email: string;
  name: string;
}

/**
 * Phone Auth Store State Interface
 */
export interface PhoneAuthStoreState {
  // Current state machine state
  state: PhoneAuthState;
  
  // Phone number in E.164 format (e.g., +919876543210)
  phoneNumber: string | null;
  
  // Firebase ID token received after OTP verification
  firebaseToken: string | null;
  
  // Firebase unique user identifier
  firebaseUid: string | null;
  
  // Firebase verification ID for OTP confirmation (persists across screens)
  verificationId: string | null;
  
  // Email of existing account when link confirmation is required
  existingEmail: string | null;
  
  // Auth provider of existing account (email/Google/Apple)
  existingAuthProvider: string | null;
  
  // Error message when in ERROR state
  error: string | null;
  
  // Authenticated user data
  user: PhoneAuthUser | null;
  
  // Loading state for async operations
  isLoading: boolean;
}

/**
 * Phone Auth Store Actions Interface
 */
export interface PhoneAuthStoreActions {
  // Set phone number and transition to PHONE_INPUT state
  setPhoneNumber: (phone: string) => void;
  
  // Transition to OTP_VERIFY state after OTP is sent
  transitionToOtpVerify: () => void;
  
  // Set Firebase verification ID after OTP is sent (for cross-screen persistence)
  setVerificationId: (verificationId: string) => void;
  
  // Set Firebase token and UID after successful OTP verification
  setFirebaseCredentials: (token: string, uid: string) => void;
  
  // Handle successful authentication (existing user)
  handleAuthSuccess: (user: PhoneAuthUser) => void;
  
  // Handle profile required response (new user)
  handleProfileRequired: (phoneNumber: string, firebaseUid: string) => void;
  
  // Handle link confirmation required response (email collision)
  handleLinkConfirmationRequired: (existingEmail: string, authProvider: string) => void;
  
  // Handle successful account linking or profile completion
  handleLinkSuccess: (user: PhoneAuthUser) => void;
  
  // Handle cancelled account linking
  handleLinkCancelled: () => void;
  
  // Set error state
  setError: (error: string) => void;
  
  // Clear error and return to previous valid state
  clearError: () => void;
  
  // Set loading state
  setLoading: (loading: boolean) => void;
  
  // Reset store to initial state
  reset: () => void;
  
  // Start phone login flow (transition from LOGIN to PHONE_INPUT)
  startPhoneLogin: () => void;
}

export type PhoneAuthStore = PhoneAuthStoreState & PhoneAuthStoreActions;

/**
 * Initial state for the phone auth store
 */
const initialState: PhoneAuthStoreState = {
  state: 'LOGIN',
  phoneNumber: null,
  firebaseToken: null,
  firebaseUid: null,
  verificationId: null,
  existingEmail: null,
  existingAuthProvider: null,
  error: null,
  user: null,
  isLoading: false,
};

/**
 * Phone Authentication Store
 * 
 * Manages the state machine for phone number OTP authentication flow.
 * State transitions are driven by backend responses as per Requirements 9.1-9.6.
 * 
 * @see .kiro/specs/phone-otp-authentication/design.md for state machine diagram
 */
export const usePhoneAuthStore = create<PhoneAuthStore>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Set phone number and prepare for OTP sending
   * Does not change state - state changes happen on OTP send success
   */
  setPhoneNumber: (phone: string) => {
    set({ phoneNumber: phone });
  },

  /**
   * Start phone login flow
   * Transitions: LOGIN -> PHONE_INPUT
   */
  startPhoneLogin: () => {
    set({
      state: 'PHONE_INPUT',
      error: null,
    });
  },

  /**
   * Transition to OTP verification state after OTP is sent
   * Transitions: PHONE_INPUT -> OTP_VERIFY
   */
  transitionToOtpVerify: () => {
    set({
      state: 'OTP_VERIFY',
      error: null,
    });
  },

  /**
   * Set Firebase verification ID after OTP is sent
   * This persists across screen navigation for OTP verification
   */
  setVerificationId: (verificationId: string) => {
    set({ verificationId });
  },

  /**
   * Set Firebase credentials after successful OTP verification
   * Called before making the /phone/verify/ API call
   */
  setFirebaseCredentials: (token: string, uid: string) => {
    set({
      firebaseToken: token,
      firebaseUid: uid,
    });
  },

  /**
   * Handle successful authentication for existing user
   * Transitions: OTP_VERIFY -> AUTHENTICATED
   * 
   * @param user - Authenticated user data from backend
   */
  handleAuthSuccess: (user: PhoneAuthUser) => {
    set({
      state: 'AUTHENTICATED',
      user,
      error: null,
      isLoading: false,
    });
  },

  /**
   * Handle profile required response for new user
   * Transitions: OTP_VERIFY -> PROFILE_REQUIRED
   * 
   * @param phoneNumber - Verified phone number in E.164 format
   * @param firebaseUid - Firebase unique user identifier
   */
  handleProfileRequired: (phoneNumber: string, firebaseUid: string) => {
    set({
      state: 'PROFILE_REQUIRED',
      phoneNumber,
      firebaseUid,
      error: null,
      isLoading: false,
    });
  },

  /**
   * Handle link confirmation required response (email collision)
   * Transitions: PROFILE_REQUIRED -> LINK_CONFIRMATION
   * 
   * @param existingEmail - Email of the existing account
   * @param authProvider - Auth provider of existing account (email/Google/Apple)
   */
  handleLinkConfirmationRequired: (existingEmail: string, authProvider: string) => {
    set({
      state: 'LINK_CONFIRMATION',
      existingEmail,
      existingAuthProvider: authProvider,
      error: null,
      isLoading: false,
    });
  },

  /**
   * Handle successful account linking or profile completion
   * Transitions: LINK_CONFIRMATION -> AUTHENTICATED
   *              PROFILE_REQUIRED -> AUTHENTICATED
   * 
   * @param user - Authenticated user data from backend
   */
  handleLinkSuccess: (user: PhoneAuthUser) => {
    set({
      state: 'AUTHENTICATED',
      user,
      existingEmail: null,
      existingAuthProvider: null,
      error: null,
      isLoading: false,
    });
  },

  /**
   * Handle cancelled account linking
   * Returns user to profile required state to try different email
   * Transitions: LINK_CONFIRMATION -> PROFILE_REQUIRED
   */
  handleLinkCancelled: () => {
    set({
      state: 'PROFILE_REQUIRED',
      existingEmail: null,
      existingAuthProvider: null,
      error: null,
      isLoading: false,
    });
  },

  /**
   * Set error state
   * Transitions: Any state -> ERROR
   * 
   * @param error - Error message to display
   */
  setError: (error: string) => {
    set({
      state: 'ERROR',
      error,
      isLoading: false,
    });
  },

  /**
   * Clear error and return to PHONE_INPUT state
   * Transitions: ERROR -> PHONE_INPUT
   */
  clearError: () => {
    const currentState = get();
    // Preserve phone number and firebase credentials when clearing error
    set({
      state: 'PHONE_INPUT',
      error: null,
      isLoading: false,
    });
  },

  /**
   * Set loading state for async operations
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Reset store to initial state
   * Used when user cancels flow or logs out
   */
  reset: () => {
    set(initialState);
  },
}));
