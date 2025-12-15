import { View } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthService } from '../api/apiService';
import { useLocalization } from '../context/LocalizationContext';
import { useTheme } from '../context/ThemeContext';
import SplashScreen from '../components/SplashScreen';


export default function IndexScreen(){
  const router = useRouter();
  const segments = useSegments();
  const {isLanguageSet, isLoading: isLanguageLoading} = useLocalization();
  const { colors, isDark } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthCheckDone, setIsAuthCheckDone] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const hasNavigatedRef = useRef(false);

   useEffect(() => {
    let isActive = true;
    const runInitialChecks = async () => {
      try {
        const authStatus = await AuthService.isAuthenticated();
        if (isActive) setIsAuthenticated(authStatus);
      } catch (error) {
        console.error("Auth check failed", error);
        if (isActive) setIsAuthenticated(false);
      } finally {
        if (isActive) setIsAuthCheckDone(true);
      }
    };
    runInitialChecks();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };
  useEffect(()=>{
    // Wait for splash screen, auth check, and language initialization to complete
    if (showSplash || !isAuthCheckDone || isLanguageLoading) return;
    
    // Prevent duplicate navigation - only navigate once from index
    if (hasNavigatedRef.current) {
      console.log('🛑 Navigation already performed, skipping...');
      return;
    }
    
    // Check if we're still on the index route - if not, don't navigate
    // This prevents race conditions when auth state changes after user already navigated
    const currentRoute = '/' + segments.join('/');
    if (segments.length > 0 && currentRoute !== '/') {
      console.log('🛑 Already navigated away from index, skipping navigation. Current:', currentRoute);
      hasNavigatedRef.current = true;
      return;
    }
    
    console.log('🚀 Navigation Debug:', {
      isLanguageSet,
      isAuthenticated: isAuthenticated,
    });
    
    let routeToNavigate = ""
    
    /**
     * Navigation Flow Priority:
     * Priority 0: Language Selection (highest priority)
     *   - First-time users must select language before anything else
     *   - Returning users skip this step (language already set)
     * 
     * Priority 1: Authentication
     *   - Authenticated users go to home
     *   - Non-authenticated users go to login
     * 
     * Note: Location/serviceability check is now handled in the Sell screen
     * Users can browse the app freely, but will be prompted for location
     * when they try to sell scrap.
     */
    
    // Priority 0: Check language selection first
    if (!isLanguageSet) {
      console.log('➡️ Navigating to: language-selection (no language set)');
      routeToNavigate = '/(auth)/language-selection';
    }
    // Priority 1: Check authentication
    else {
      if (isAuthenticated) {
        console.log('➡️ Navigating to: tabs/home (authenticated)');
        routeToNavigate = '/(tabs)/home'; 
      } else {
        console.log('➡️ Navigating to: login (not authenticated)');
        routeToNavigate = '/(auth)/login';
      }
    }
    
    if(routeToNavigate) {
      hasNavigatedRef.current = true;
      router.replace(routeToNavigate);
    }
  },[
  showSplash,
  isAuthCheckDone,
  isLanguageLoading,
  isLanguageSet,
  isAuthenticated,
  router,
  segments
]);

if(showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
)
}

