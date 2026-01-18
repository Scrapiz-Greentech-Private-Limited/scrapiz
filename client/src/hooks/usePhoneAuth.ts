import { useState, useCallback, useRef } from 'react';

import { usePhoneAuthStore } from '../store/phoneAuthStore';

/**
 * Error types for Phone authentication
 */
export enum PhoneAuthError {
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_VERIFICATION_CODE = 'INVALID_VERIFICATION_CODE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * User-friendly error messages
 */
export const phoneAuthErrorMessages: Record<PhoneAuthError, string> = {
  [PhoneAuthError.INVALID_PHONE_NUMBER]: 'Please enter a valid phone number',
  [PhoneAuthError.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later',
  [PhoneAuthError.QUOTA_EXCEEDED]: 'SMS quota exceeded. Please try again later',
  [PhoneAuthError.INVALID_VERIFICATION_CODE]: 'Invalid verification code. Please try again',
  [PhoneAuthError.SESSION_EXPIRED]: 'Verification session expired. Please request a new code',
  [PhoneAuthError.NETWORK_ERROR]: 'Network error. Please check your connection',
  [PhoneAuthError.CANCELLED]: 'Verification was cancelled',
  [PhoneAuthError.UNKNOWN]: 'An unexpected error occurred. Please try again',
};

/**
 * Return type for usePhoneAuth hook
 */
export interface UsePhoneAuthReturn {
  /** Send OTP to the provided phone number */
  sendOtp: (phoneNumber: string) => Promise<boolean>;
  /** Verify the OTP and get Firebase ID token */
  verifyOtp: (otp: string) => Promise<string | null>;
  /** Resend OTP to the same phone number */
  resendOtp: () => Promise<boolean>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Error type for programmatic handling */
  errorType: PhoneAuthError | null;
  /** Clear error state */
  clearError: () => void;
  /** Whether OTP has been sent */
  otpSent: boolean;
  /** Countdown timer for resend (in seconds) */
  resendCountdown: number;
  /** Whether the error is a quota/rate limit error that requires fallback */
  isQuotaOrRateLimitError: boolean;
}

/**
 * Check if the error type is a quota or rate limit error
 * These errors indicate Firebase SMS service is unavailable and user should use alternative auth
 */
export function isQuotaOrRateLimitErrorType(errorType: PhoneAuthError | null): boolean {
  return errorType === PhoneAuthError.TOO_MANY_REQUESTS || 
         errorType === PhoneAuthError.QUOTA_EXCEEDED;
}

/**
 * Map Firebase error codes to PhoneAuthError types
 */
function mapFirebaseError(error: any): PhoneAuthError {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'auth/invalid-phone-number':
      return PhoneAuthError.INVALID_PHONE_NUMBER;
    case 'auth/too-many-requests':
      return PhoneAuthError.TOO_MANY_REQUESTS;
    case 'auth/quota-exceeded':
      return PhoneAuthError.QUOTA_EXCEEDED;
    case 'auth/invalid-verification-code':
      return PhoneAuthError.INVALID_VERIFICATION_CODE;
    case 'auth/session-expired':
    case 'auth/code-expired':
      return PhoneAuthError.SESSION_EXPIRED;
    case 'auth/network-request-failed':
      return PhoneAuthError.NETWORK_ERROR;
    case 'auth/user-cancelled':
    case 'auth/cancelled':
      return PhoneAuthError.CANCELLED;
    default:
      // Check for network-related errors in message
      if (error?.message?.toLowerCase().includes('network')) {
        return PhoneAuthError.NETWORK_ERROR;
      }
      return PhoneAuthError.UNKNOWN;
  }
}

/**
 * Custom hook for Firebase Phone Authentication
 * 
 * Implements:
 * - sendOtp(): Send OTP using Firebase signInWithPhoneNumber
 * - verifyOtp(): Verify OTP and get Firebase ID token
 * - resendOtp(): Resend OTP functionality
 * - Proper Firebase error handling
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 * 
 * @see .kiro/specs/phone-otp-authentication/design.md
 */
export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<PhoneAuthError | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Store confirmation result for OTP verification
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
  // Store phone number for resend functionality
  const phoneNumberRef = useRef<string | null>(null);
  // Store countdown interval
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get store actions for state transitions
  const { setPhoneNumber, transitionToOtpVerify, setFirebaseCredentials } = usePhoneAuthStore();

  /**
   * Set error state with type and message
   */
  const setErrorState = useCallback((type: PhoneAuthError) => {
    setErrorType(type);
    setError(phoneAuthErrorMessages[type]);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Start resend countdown timer
   */
  const startResendCountdown = useCallback(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Set initial countdown (60 seconds)
    setResendCountdown(60);
    
    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Send OTP to the provided phone number
   * 
   * Requirement 11.1: WHEN the OTP screen is displayed, THE Phone_Auth_System 
   * SHALL show a 6-digit OTP input field
   * 
   * @param phoneNumber - Phone number in E.164 format (e.g., +919876543210)
   * @returns Promise<boolean> - true if OTP sent successfully
   */
  const sendOtp = useCallback(async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    clearError();
    setOtpSent(false);
    
    try {
      // Store phone number for resend functionality
      phoneNumberRef.current = phoneNumber;
      
      // Update store with phone number
      setPhoneNumber(phoneNumber);
      
      // Send OTP using Firebase
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      
      // Store confirmation result for verification
      confirmationRef.current = confirmation;
      
      // Mark OTP as sent
      setOtpSent(true);
      
      // Start resend countdown
      startResendCountdown();
      
      // Transition to OTP verify state
      transitionToOtpVerify();
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Send OTP error:', err);
      
      const mappedErrorType = mapFirebaseError(err);
      setErrorState(mappedErrorType);
      
      setIsLoading(false);
      setOtpSent(false);
      return false;
    }
  }, [clearError, setPhoneNumber, transitionToOtpVerify, setErrorState, startResendCountdown]);

  /**
   * Verify the OTP and get Firebase ID token
   * 
   * Requirement 11.3: WHEN a user enters a valid OTP, THE Firebase_Auth 
   * SHALL verify the OTP and return an ID token
   * Requirement 11.4: WHEN OTP verification succeeds, THE Phone_Auth_System 
   * SHALL send the Firebase ID token to the backend /phone/verify/ endpoint
   * 
   * @param otp - 6-digit OTP code
   * @returns Promise<string | null> - Firebase ID token if successful, null otherwise
   */
  const verifyOtp = useCallback(async (otp: string): Promise<string | null> => {
    if (!confirmationRef.current) {
      setErrorState(PhoneAuthError.SESSION_EXPIRED);
      return null;
    }
    
    setIsLoading(true);
    clearError();
    
    try {
      // Verify OTP with Firebase
      const userCredential = await confirmationRef.current.confirm(otp);
      
      if (!userCredential?.user) {
        setErrorState(PhoneAuthError.UNKNOWN);
        setIsLoading(false);
        return null;
      }
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Store credentials in the store
      setFirebaseCredentials(idToken, userCredential.user.uid);
      
      setIsLoading(false);
      return idToken;
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      
      const mappedErrorType = mapFirebaseError(err);
      setErrorState(mappedErrorType);
      
      setIsLoading(false);
      return null;
    }
  }, [clearError, setErrorState, setFirebaseCredentials]);

  /**
   * Resend OTP to the same phone number
   * 
   * @returns Promise<boolean> - true if OTP resent successfully
   */
  const resendOtp = useCallback(async (): Promise<boolean> => {
    if (!phoneNumberRef.current) {
      setErrorState(PhoneAuthError.SESSION_EXPIRED);
      return false;
    }
    
    if (resendCountdown > 0) {
      return false;
    }
    
    return sendOtp(phoneNumberRef.current);
  }, [sendOtp, setErrorState, resendCountdown]);

  // Compute isQuotaOrRateLimitError from errorType
  const isQuotaOrRateLimitError = isQuotaOrRateLimitErrorType(errorType);

  return {
    sendOtp,
    verifyOtp,
    resendOtp,
    isLoading,
    error,
    errorType,
    clearError,
    otpSent,
    resendCountdown,
    isQuotaOrRateLimitError,
  };
};
