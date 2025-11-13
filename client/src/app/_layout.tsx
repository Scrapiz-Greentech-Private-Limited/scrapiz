import { Stack, Tabs } from "expo-router";
import * as Sentry from '@sentry/react-native'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import '@/global.css';
import React from "react";
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocationProvider } from "../context/LocationContext";
import { ProfileProvider } from "../context/ProfileContext";
import { ReferralProvider } from "../context/ReferralContext";
import { LocalizationProvider, useLocalization } from "../context/LocalizationContext";

import '../localization/i18n';

SplashScreen.preventAutoHideAsync();


/**
 * AppContent component
 * Handles loading states for fonts and i18n initialization
 * Wrapped by LocalizationProvider to access localization context
 */
Sentry.init({
  dsn: 'https://9807026f129b55b9e72bd3463a847960@o4510356583284736.ingest.de.sentry.io/4510356588003408',
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: ,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  spotlight: __DEV__,
})
function AppContent() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  const { isLoading: isLocalizationLoading } = useLocalization();

  useEffect(() => {
    // Hide splash screen only when both fonts and i18n are ready
    if (fontsLoaded && !isLocalizationLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLocalizationLoading]);

  // Show loading indicator while fonts or i18n are initializing
  if (!fontsLoaded || isLocalizationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ReferralProvider>
        <ProfileProvider>
          <LocationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <Toast />
            <StatusBar style="auto" />
          </LocationProvider>
        </ProfileProvider>
      </ReferralProvider>
    </AuthProvider>
  );
}

/**
 * RootLayout component
 * Root of the application with LocalizationProvider wrapping everything
 * Ensures i18n is initialized before the app renders
 */
export Sentry.wrap(AppContent);

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  );
}
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});