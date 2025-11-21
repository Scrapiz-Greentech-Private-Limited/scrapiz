import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {StyleSheet} from 'react-native'
import { useRouter, useSegments } from 'expo-router';
import { AuthService, setGlobalSessionExpiredHandler, setCurrentRouteGetter } from '../api/apiService';
import SessionExpiredDialog from '../components/SessionExpiredDialog';
import { useNotifications } from '../hooks/useNotifications';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  showSessionExpired: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const currentRouteRef = useRef<string>('');
  const { registerForPushNotifications, unregisterPushToken, expoPushToken } = useNotifications();

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
        }
      }
      
      // Clear authentication token from AsyncStorage
      await AuthService.logout();
      
      // Update authentication state
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth state:', error);
      // Even if logout fails, clear local state
      setIsAuthenticated(false);
    }
  };

  const handleSessionExpired = () => {
    // Prevent showing dialog during initial load
    if (isLoading) return;
    
    setShowSessionExpired(true);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    showSessionExpired,
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
