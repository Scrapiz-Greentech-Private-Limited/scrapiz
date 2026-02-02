import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native'
import { useRouter, useSegments } from 'expo-router';
import { AuthService, setGlobalSessionExpiredHandler, setCurrentRouteGetter } from '../api/apiService';
import SessionExpiredDialog from '../components/SessionExpiredDialog';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Represents a pending action that should be executed after authentication
 * Used by the auth guard system for contextual authentication
 */
export interface PendingAuthAction {
  /** Type of pending action */
  type: 'navigate' | 'callback';
  /** Path to navigate to after auth (for 'navigate' type) */
  returnPath?: string;
  /** Callback to execute after auth (for 'callback' type) */
  callback?: () => void | Promise<void>;
  /** Timestamp when action was created (for TTL) */
  timestamp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpired: boolean;

  // Guest state (computed from isAuthenticated and isLoading)
  isGuest: boolean;

  // Pending auth action management
  pendingAuthAction: PendingAuthAction | null;
  setPendingAuthAction: (action: PendingAuthAction | null) => void;
  executePendingAction: () => Promise<void>;
  clearPendingAction: () => void;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, name: string, password: string, confirmPassword: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  setAuthenticatedState: (authenticated: boolean) => void;
  refreshAuthStatus: () => Promise<void>;
  clearAuthState: () => Promise<void>;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Maximum age for pending auth actions (24 hours in milliseconds)
const PENDING_ACTION_MAX_AGE = 24 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [pendingAuthAction, setPendingAuthActionState] = useState<PendingAuthAction | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const currentRouteRef = useRef<string>('');
  const { registerForPushNotifications, unregisterPushToken, expoPushToken } = useNotifications();

  // Computed guest state: user is a guest if not authenticated and not loading
  const isGuest = !isAuthenticated && !isLoading;

  // Track current route
  useEffect(() => {
    const route = '/' + segments.join('/');
    currentRouteRef.current = route;
  }, [segments]);

  useEffect(() => {
    checkAuthStatus();

    // Register current route getter
    setCurrentRouteGetter(() => currentRouteRef.current);

    // Register global session expired handler
    setGlobalSessionExpiredHandler((shouldShow: boolean) => {
      if (shouldShow) {
        handleSessionExpired();
      }
    });
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      // Don't auto-register for push notifications here
      // Let the user decide via the notification permission screen
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await AuthService.login({ email, password });
      setIsAuthenticated(true);

      // Don't auto-register for push notifications here
      // Let the user decide via the notification permission screen
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister push token before logout
      if (expoPushToken) {
        try {
          await unregisterPushToken(expoPushToken);
        } catch (notifError) {
          // Don't fail logout if push token unregistration fails
          console.error('Failed to unregister push token:', notifError);
        }
      }

      await AuthService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string, confirmPassword: string) => {
    try {
      await AuthService.register({
        email,
        name,
        password,
        confirm_password: confirmPassword,
      });
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      await AuthService.verifyOtp({ email, otp });
      setIsAuthenticated(true);

      // Don't auto-register for push notifications here
      // Let the user decide via the notification permission screen
    } catch (error) {
      throw error;
    }
  };

  const setAuthenticatedState = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  const refreshAuthStatus = async () => {
    await checkAuthStatus();
  };

  const clearAuthState = async () => {
    try {
      // Unregister push token before clearing auth state
      if (expoPushToken) {
        try {
          await unregisterPushToken(expoPushToken);
        } catch (notifError) {
          console.error('Failed to unregister push token:', notifError);
          // Non-critical, continue
        }
      }

      // Clear authentication token from SecureStore
      try {
        await AuthService.logout();
      } catch (logoutError) {
        console.error('Logout API call failed (non-critical):', logoutError);
        // Token is already removed by logout method, so this is non-critical
      }

      // Update authentication state
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth state:', error);
      // Even if everything fails, clear local state
      setIsAuthenticated(false);
    }
  };

  const handleSessionExpired = () => {
    // Prevent showing dialog during initial load
    if (isLoading) return;

    setShowSessionExpired(true);
    setIsAuthenticated(false);
  };

  /**
   * Set a pending auth action to be executed after authentication
   * Used by the auth guard system for contextual authentication
   */
  const setPendingAuthAction = (action: PendingAuthAction | null) => {
    if (action) {
      // Add timestamp if not present
      const actionWithTimestamp = {
        ...action,
        timestamp: action.timestamp || Date.now(),
      };
      setPendingAuthActionState(actionWithTimestamp);
      console.log('📝 Pending auth action set:', actionWithTimestamp.type);
    } else {
      setPendingAuthActionState(null);
    }
  };

  /**
   * Clear the pending auth action
   */
  const clearPendingAction = () => {
    setPendingAuthActionState(null);
    console.log('🧹 Pending auth action cleared');
  };

  /**
   * Execute the pending auth action if it exists and is not expired
   * Should be called after successful authentication
   */
  const executePendingAction = async () => {
    if (!pendingAuthAction) {
      console.log('ℹ️ No pending auth action to execute');
      return;
    }

    // Check if action is expired (older than 24 hours)
    const age = Date.now() - pendingAuthAction.timestamp;
    if (age > PENDING_ACTION_MAX_AGE) {
      console.log('⏰ Pending auth action expired, clearing');
      clearPendingAction();
      return;
    }

    console.log('▶️ Executing pending auth action:', pendingAuthAction.type);

    try {
      if (pendingAuthAction.type === 'callback' && pendingAuthAction.callback) {
        await pendingAuthAction.callback();
      } else if (pendingAuthAction.type === 'navigate' && pendingAuthAction.returnPath) {
        router.replace(pendingAuthAction.returnPath as any);
      }
    } catch (error) {
      console.error('❌ Error executing pending auth action:', error);
    } finally {
      // Always clear after execution attempt
      clearPendingAction();
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    showSessionExpired,
    isGuest,
    pendingAuthAction,
    setPendingAuthAction,
    executePendingAction,
    clearPendingAction,
    login,
    logout,
    register,
    verifyOtp,
    setAuthenticatedState,
    refreshAuthStatus,
    clearAuthState,
    handleSessionExpired,
  };

  const handleRedirectToLogin = () => {
    setShowSessionExpired(false);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredDialog
        visible={showSessionExpired}
        onRedirect={handleRedirectToLogin}
      />
    </AuthContext.Provider>
  );
};
