import { View, Text, Image, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthService } from '../api/apiService';
import { useLocation } from '../context/LocationContext';
import { useLocalization } from '../context/LocalizationContext';
import SplashScreen from '../components/SplashScreen';


export default function IndexScreen(){
  const router = useRouter();
  const {currentLocation, locationSet, serviceAvailable, checkServiceAvailability} = useLocation();
  const {isLanguageSet, isLoading: isLanguageLoading} = useLocalization();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthCheckDone, setIsAuthCheckDone] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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
    
    console.log('🚀 Navigation Debug:', {
      isLanguageSet,
      locationSet,
      hasCurrentLocation: !!currentLocation,
      serviceAvailable,
      isAuthenticated: isAuthenticated,
    });
    
    let routeToNavigate = ""
    
    /**
     * Navigation Flow Priority:
     * Priority 0: Language Selection (NEW - highest priority)
     *   - First-time users must select language before anything else
     *   - Returning users skip this step (language already set)
     * 
     * Priority 1: Location Permission
     *   - Users need to set their location for service availability
     * 
     * Priority 2: Service Availability
     *   - Check if service is available in user's location
     * 
     * Priority 3: Authentication
     *   - Authenticated users go to home
     *   - Non-authenticated users go to login
     */
    
    // Priority 0: Check language selection first
    if (!isLanguageSet) {
      console.log('➡️ Navigating to: language-selection (no language set)');
      routeToNavigate = '/(auth)/language-selection';
    }
    // Priority 1: Check location
    else if (!locationSet || !currentLocation){
      console.log('➡️ Navigating to: location-permission (no location set)');
      routeToNavigate = '/(auth)/location-permission';
    }
    // Priority 2: Check if location is serviceable
    else if (!serviceAvailable) {
      console.log('➡️ Navigating to: service-unavailable');
      routeToNavigate = '/(auth)/service-unavailable';
    }
    // Priority 3: Check authentication
    else {
      if (isAuthenticated) {
        console.log('➡️ Navigating to: tabs/home (authenticated)');
        routeToNavigate = '/(tabs)/home'; 
      } else {
        console.log('➡️ Navigating to: login (not authenticated)');
        routeToNavigate = '/(auth)/login';
      }
    }
    
    if(routeToNavigate) router.replace(routeToNavigate)
  },[
  showSplash,
  isAuthCheckDone,
  isLanguageLoading,
  isLanguageSet,
  locationSet,
  currentLocation,
  serviceAvailable,
  isAuthenticated,
  router
]);

if(showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

return (
    <View className='flex-1 bg-slate-50'>
      <StatusBar style="auto" />
    </View>
)
}

