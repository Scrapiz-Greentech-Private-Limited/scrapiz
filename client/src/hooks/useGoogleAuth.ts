import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { AuthService } from '../api/apiService';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const { setAuthenticatedState, refreshAuthStatus } = useAuth();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID_V2,
  });

  useEffect(() => {
    const handleResponse = async () => {
      if (!response) return;

      if (response.type === 'cancel') {
        setError('Sign in was cancelled');
        setIsLoading(false);
        setAuthSuccess(false);
        return;
      }

      if (response.type === 'success') {
        setIsLoading(true);
        setError(null);
        setAuthSuccess(false);

        try {
          const { params } = response;
          const idToken = params.id_token;

          if (!idToken) {
            throw new Error('No ID token received from Google');
          }

          console.log('ID Token received:', idToken.substring(0, 20) + '...');

          const serverResponse = await AuthService.googleLogin(idToken);

          if (serverResponse.jwt) {
            console.log('Login successful, JWT received');
            console.log('User:', serverResponse.user);
            
            // Wait for AsyncStorage to fully persist the token
            // This prevents race conditions on iOS where the token might not be ready
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Verify the token was actually stored
            const isStored = await AuthService.isAuthenticated();
            if (!isStored) {
              console.warn('JWT was not stored properly, retrying...');
              // Token wasn't stored, this shouldn't happen but handle gracefully
              throw new Error('Failed to store authentication token');
            }
            
            console.log('JWT verified in storage');
            
            // Update authentication state
            setAuthenticatedState(true);
            
            // Note: Removed refreshAuthStatus() call to prevent race condition
            // that was causing app crash on iOS after redirect to home
            
            setError(null);
            setAuthSuccess(true);
            setIsLoading(false);
          } else {
            throw new Error('No JWT received from server');
          }
        } catch (err: any) {
          console.error('Auth error:', err);
          const errorMessage = err.message || 'Unable to sign in. Please try again';
          setError(errorMessage);
          setAuthSuccess(false);
          setIsLoading(false);
        }
      } else if (response.type === 'error') {
        console.error('Google auth error:', response.error);
        const errorMessage = response.error?.message || 'Unable to sign in. Please try again';
        setError(errorMessage);
        setAuthSuccess(false);
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    setAuthSuccess(false);
    setIsLoading(true);

    try {
      console.log('Starting Google sign in...');
      console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
      console.log('Android Client ID:', process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
      console.log('Platform:', Platform.OS);

      const result = await promptAsync();
      console.log('Prompt result:', result.type);

      // If user cancelled or there was an error, stop loading immediately
      if (result.type === 'cancel' || result.type === 'error') {
        setIsLoading(false);
        if (result.type === 'cancel') {
          setError('Sign in was cancelled');
        } else {
          setError('Unable to sign in. Please try again');
        }
        return false;
      }

      // Keep loading true for success case - will be handled by useEffect
      return result.type === 'success';
    } catch (err: any) {
      console.error('Google Prompt Error:', err);
      setError(err.message || 'Unable to sign in. Please try again');
      setIsLoading(false);
      setAuthSuccess(false);
      return false;
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    error,
    authSuccess,
  };
};