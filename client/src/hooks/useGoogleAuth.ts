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
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  });

  useEffect(() => {
    const handleResponse = async () => {
      if (!response) return;

      if (response.type === 'cancel') {
        setError('Sign in was cancelled');
        setIsLoading(false);
        return;
      }

      if (response.type === 'success') {
        setIsLoading(true);
        setError(null);

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
            
            // Update authentication state
            setAuthenticatedState(true);
            
            // Refresh auth status to ensure everything is in sync
            await refreshAuthStatus();
            
            setError(null);
            setAuthSuccess(true);
          } else {
            throw new Error('No JWT received from server');
          }
        } catch (err: any) {
          console.error('Auth error:', err);
          setError(err.message || 'Authentication failed');
          setAuthSuccess(false);
        } finally {
          setIsLoading(false);
        }
      } else if (response.type === 'error') {
        console.error('Google auth error:', response.error);
        setError(response.error?.message || 'Authentication failed');
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('Starting Google sign in...');
      console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
      console.log('Android Client ID:', process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
      console.log('Platform:', Platform.OS);

      const result = await promptAsync();
      console.log('Prompt result:', result.type);

      return result.type === 'success';
    } catch (err: any) {
      console.error('Google Prompt Error:', err);
      setError(err.message || 'Failed to start sign in');
      setIsLoading(false);
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