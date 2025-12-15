import { useState, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

import { generateNonce } from '../utils/crypto';
import { SecureStorageService } from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Error types for Apple authentication
 */
export enum AppleAuthError {
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NONCE_MISMATCH = 'NONCE_MISMATCH',
  LINK_CANCELLED = 'LINK_CANCELLED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * User-friendly error messages
 */
export const appleAuthErrorMessages: Record<AppleAuthError, string> = {
  [AppleAuthError.CANCELLED]: 'Sign in was cancelled',
  [AppleAuthError.FAILED]: 'Apple Sign-In failed. Please try again',
  [AppleAuthError.INVALID_RESPONSE]: 'Invalid response from Apple. Please try again',
  [AppleAuthError.NETWORK_ERROR]: 'Network error. Please check your connection',
  [AppleAuthError.SERVER_ERROR]: 'Authentication failed. Please try again',
  [AppleAuthError.NONCE_MISMATCH]: 'Security verification failed. Please try again',
  [AppleAuthError.LINK_CANCELLED]: 'Account linking was cancelled',
  [AppleAuthError.NOT_AVAILABLE]: 'Apple Sign-In is not available on this device',
  [AppleAuthError.UNKNOWN]: 'An unexpected error occurred. Please try again',
};

/**
 * Platform information for audit logging
 */
export interface PlatformInfo {
  os: string;
  osVersion: string;
  deviceModel?: string;
}

/**
 * User info from Apple Sign-In (only available on first sign-in)
 */
interface AppleUserInfo {
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Pending link data for account linking confirmation flow
 */
interface PendingLinkData {
  identityToken: string;
  rawNonce: string;
  email: string;
}

/**
 * Apple login response from backend
 */
interface AppleLoginResponse {
  jwt?: string;
  message?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  requires_link_confirmation?: boolean;
  existing_email?: string;
  error?: string;
}

/**
 * Return type for useAppleAuth hook
 */
export interface UseAppleAuthReturn {
  /** Initiate Apple Sign-In flow */
  signInWithApple: () => Promise<boolean>;
  /** Confirm or reject account linking */
  confirmAccountLink: (confirmed: boolean) => Promise<boolean>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Error type for programmatic handling */
  errorType: AppleAuthError | null;
  /** Whether authentication was successful */
  authSuccess: boolean;
  /** Whether Apple Sign-In is available on this device */
  isAvailable: boolean;
  /** Email of existing account pending link confirmation */
  pendingLinkEmail: string | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Collect platform information for audit logging
 * Implements task 5.3: Platform info collection
 */
function collectPlatformInfo(): PlatformInfo {
  return {
    os: Platform.OS,
    osVersion: Platform.Version.toString(),
    deviceModel: Device.modelName || undefined,
  };
}

/**
 * Custom hook for Apple Sign-In authentication
 * 
 * Implements:
 * - Task 5.1: Nonce flow (generate nonce, send hash to Apple, raw to backend)
 * - Task 5.2: Account linking confirmation flow
 * - Task 5.3: Platform info collection for audit logging
 * 
 * Requirements: 1.1, 1.2, 1.3, 4.2, 8.2
 */
export const useAppleAuth = (): UseAppleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AppleAuthError | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pendingLinkData, setPendingLinkData] = useState<PendingLinkData | null>(null);

  const { setAuthenticatedState } = useAuth();

  // Check availability on mount (iOS only)
  useState(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAvailable(available);
        } catch {
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  });

  /**
   * Set error state with type and message
   */
  const setErrorState = useCallback((type: AppleAuthError) => {
    setErrorType(type);
    setError(appleAuthErrorMessages[type]);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Make API call to Apple login endpoint
   */
  const callAppleLoginApi = async (
    identityToken: string,
    rawNonce: string,
    user?: AppleUserInfo,
    email?: string | null,
    platformInfo?: PlatformInfo
  ): Promise<AppleLoginResponse> => {
    const token = await AsyncStorage.getItem('authToken');
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string;

    const response = await fetch(`${API_CONFIG.BASE_URL}/authentication/apple-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-app': frontendKey,
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        identity_token: identityToken,
        nonce: rawNonce,
        user: user,
        email: email,
        platform_info: platformInfo,
      }),
    });

    const data = await response.json();

    if (!response.ok && !data.requires_link_confirmation) {
      throw new Error(data.error || 'Apple login failed');
    }

    return data;
  };

  /**
   * Make API call to confirm account linking
   */
  const callConfirmLinkApi = async (
    identityToken: string,
    rawNonce: string,
    confirmed: boolean
  ): Promise<AppleLoginResponse> => {
    const token = await AsyncStorage.getItem('authToken');
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string;

    const response = await fetch(`${API_CONFIG.BASE_URL}/authentication/apple-login/confirm-link/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-app': frontendKey,
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        identity_token: identityToken,
        nonce: rawNonce,
        confirmed: confirmed,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Account linking failed');
    }

    return data;
  };

  /**
   * Initiate Apple Sign-In flow
   * 
   * Task 5.1: Create useAppleAuth hook with nonce flow
   * - Generate nonce before Apple Sign-In
   * - Send nonce hash to Apple, raw nonce to backend
   * - Handle Apple authentication response
   * 
   * Requirements: 1.1, 1.2, 1.3
   */
  const signInWithApple = useCallback(async (): Promise<boolean> => {
    // Check availability first
    if (Platform.OS !== 'ios') {
      setErrorState(AppleAuthError.NOT_AVAILABLE);
      return false;
    }

    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        setErrorState(AppleAuthError.NOT_AVAILABLE);
        return false;
      }
    } catch {
      setErrorState(AppleAuthError.NOT_AVAILABLE);
      return false;
    }

    setIsLoading(true);
    clearError();
    setAuthSuccess(false);
    setPendingLinkData(null);

    try {
      // Task 5.1: Generate nonce before initiating Apple Sign-In
      const { rawNonce, nonceHash } = await generateNonce();

      // Request Apple Sign-In with nonce hash
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: nonceHash, // Send HASH to Apple
      });

      // Validate we got an identity token
      if (!credential.identityToken) {
        setErrorState(AppleAuthError.INVALID_RESPONSE);
        setIsLoading(false);
        return false;
      }

      // Task 5.3: Collect platform info for audit logging
      const platformInfo = collectPlatformInfo();

      // Prepare user info (only available on first sign-in)
      const userInfo: AppleUserInfo | undefined = credential.fullName
        ? {
            firstName: credential.fullName.givenName,
            lastName: credential.fullName.familyName,
          }
        : undefined;

      // Task 5.1: Send raw nonce to backend for verification
      const response = await callAppleLoginApi(
        credential.identityToken,
        rawNonce, // Send RAW nonce to backend
        userInfo,
        credential.email,
        platformInfo
      );

      // Task 5.2: Handle account linking confirmation flow
      if (response.requires_link_confirmation && response.existing_email) {
        // Store pending link data for confirmation
        setPendingLinkData({
          identityToken: credential.identityToken,
          rawNonce,
          email: response.existing_email,
        });
        setIsLoading(false);
        return false; // Not complete yet, needs user confirmation
      }

      // Success - store JWT and update auth state
      if (response.jwt) {
        await SecureStorageService.setAuthToken(response.jwt);
        // Also store in AsyncStorage for backward compatibility
        await AsyncStorage.setItem('authToken', response.jwt);

        // Wait for storage to persist
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Update authentication state
        setAuthenticatedState(true);
        setAuthSuccess(true);
        setIsLoading(false);
        return true;
      }

      // Unexpected response
      setErrorState(AppleAuthError.SERVER_ERROR);
      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('Apple Sign-In error:', err);

      // Handle specific Apple authentication errors
      if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 'ERR_CANCELED') {
        setErrorState(AppleAuthError.CANCELLED);
      } else if (err.message?.includes('network') || err.message?.includes('Network')) {
        setErrorState(AppleAuthError.NETWORK_ERROR);
      } else if (err.message?.includes('nonce')) {
        setErrorState(AppleAuthError.NONCE_MISMATCH);
      } else if (err.message?.includes('Invalid token')) {
        setErrorState(AppleAuthError.SERVER_ERROR);
      } else {
        setErrorState(AppleAuthError.UNKNOWN);
      }

      setIsLoading(false);
      setAuthSuccess(false);
      return false;
    }
  }, [setAuthenticatedState, clearError, setErrorState]);

  /**
   * Confirm or reject account linking
   * 
   * Task 5.2: Implement account linking confirmation flow
   * - Track pending link data state
   * - Implement confirmAccountLink method
   * - Handle confirmation dialog response
   * 
   * Requirements: 4.2
   */
  const confirmAccountLink = useCallback(
    async (confirmed: boolean): Promise<boolean> => {
      if (!pendingLinkData) {
        console.warn('No pending link data available');
        return false;
      }

      setIsLoading(true);
      clearError();

      try {
        const response = await callConfirmLinkApi(
          pendingLinkData.identityToken,
          pendingLinkData.rawNonce,
          confirmed
        );

        // Clear pending link data
        setPendingLinkData(null);

        if (!confirmed) {
          // User declined linking
          setErrorState(AppleAuthError.LINK_CANCELLED);
          setIsLoading(false);
          return false;
        }

        // Success - store JWT and update auth state
        if (response.jwt) {
          await SecureStorageService.setAuthToken(response.jwt);
          // Also store in AsyncStorage for backward compatibility
          await AsyncStorage.setItem('authToken', response.jwt);

          // Wait for storage to persist
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Update authentication state
          setAuthenticatedState(true);
          setAuthSuccess(true);
          setIsLoading(false);
          return true;
        }

        // Unexpected response
        setErrorState(AppleAuthError.SERVER_ERROR);
        setIsLoading(false);
        return false;
      } catch (err: any) {
        console.error('Account linking error:', err);

        if (err.message?.includes('network') || err.message?.includes('Network')) {
          setErrorState(AppleAuthError.NETWORK_ERROR);
        } else {
          setErrorState(AppleAuthError.SERVER_ERROR);
        }

        setIsLoading(false);
        return false;
      }
    },
    [pendingLinkData, setAuthenticatedState, clearError, setErrorState]
  );

  return {
    signInWithApple,
    confirmAccountLink,
    isLoading,
    error,
    errorType,
    authSuccess,
    isAvailable,
    pendingLinkEmail: pendingLinkData?.email || null,
    clearError,
  };
};
