import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Easing,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, ArrowRight, CheckCircle2, Navigation, SkipForward } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const mapAsset = require('../../../assets/images/asset.png')

// Check if skip is enabled from environment variable
const ENABLE_LOCATION_SKIP = process.env.EXPO_PUBLIC_ENABLE_LOCATION_SKIP === 'true';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { setLocationFromPincode, serviceAvailable, getCurrentLocation, currentLocation, isLoading: locationLoading, error: locationError } = useLocation();
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if skip is enabled (from env or backend)
    checkSkipAvailability();

    // Entrance Animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,    // Lower friction = more bounce
        tension: 40,    // Higher tension = faster snap
        useNativeDriver: true,
      }),
    ]).start(() =>{
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03, // Scale up just 3% (Very subtle)
            duration: 3000, // Slow breath (3 seconds)
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    })

    
  }, []);

  const checkSkipAvailability = async () => {
    // First check environment variable
    if (ENABLE_LOCATION_SKIP) {
      setCanSkip(true);
      return;
    }

    // Optionally check backend for skip permission
    // This allows dynamic control without app updates
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/content/app-config/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enable_location_skip === true) {
          setCanSkip(true);
        }
      }
    } catch (error) {
      // Silently fail - skip will remain disabled
      console.log('Could not check skip availability from backend');
    }
  };

  // Handle location updates from GPS
  useEffect(() => {
    if (isUsingGPS && currentLocation && !locationLoading) {
      // Location successfully retrieved
      if (serviceAvailable) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(auth)/service-unavailable');
      }
      setIsUsingGPS(false);
    }
  }, [currentLocation, serviceAvailable, locationLoading, isUsingGPS]);

  // Handle location errors
  useEffect(() => {
    if (locationError && isUsingGPS) {
      setError(locationError);
      setIsUsingGPS(false);
    }
  }, [locationError, isUsingGPS]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSubmit = async () => {
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setError('');

    try {
      const success = await setLocationFromPincode(pincode);
      if (success) {
        router.replace('/(auth)/login');
      } else {
        if (!serviceAvailable) {
            router.replace('/(auth)/service-unavailable');
        } else {
            setError('We are not in this area yet, but we are coming soon!');
        }
      }
    } catch (error) {
      setError('Connection issue. Please check internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsUsingGPS(true);
    setError('');
    Keyboard.dismiss();

    try {
      await getCurrentLocation();
      
      // Wait a bit for location to be set
      setTimeout(() => {
        if (locationError) {
          setError(locationError);
          setIsUsingGPS(false);
          return;
        }

        if (currentLocation) {
          // Check if service is available
          if (serviceAvailable) {
            router.replace('/(auth)/login');
          } else {
            router.replace('/(auth)/service-unavailable');
          }
        }
        setIsUsingGPS(false);
      }, 1000);
    } catch (err) {
      setError('Failed to get your location. Please try again or enter PIN code manually.');
      setIsUsingGPS(false);
    }
  };

  const handleSkip = () => {
    // Set a default location for testing (Mumbai)
    setLocationFromPincode('400001');
    router.replace('/(auth)/login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white">
        {/* Modern Background Gradient Mesh */}
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          className="absolute w-full h-full"
        />

        {/* Decorative Circle Top Right */}
        <View className="absolute -top-20 -right-20 w-64 h-64 bg-green-200/30 rounded-full blur-3xl" />
        
        {/* Decorative Circle Bottom Left */}
        <View className="absolute bottom-0 -left-10 w-48 h-48 bg-emerald-200/20 rounded-full blur-2xl" />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View 
            className="flex-1 justify-center px-6"
            style={{ transform: [{ translateY: slideAnim }] }}
          >
            
            {/* --- HERO SECTION --- */}
            <View className="items-center mb-10">
              {/* Replacing the boxy image with a composite Icon Layer */}
              <Animated.View 
                style={{ 
                  transform: [
                    { scale: scaleAnim }, // The Entrance Pop
                    { scale: pulseAnim }  // The Subtle Breath
                  ] 
                }}
              >
                <Image 
                    source={mapAsset}
                    resizeMode="contain"
                    style={{
                      width: width * 0.85, // 85% of screen width (Makes it huge)
                      height: undefined,
                      aspectRatio: 1.8,    // Maintains the 2:1 shape of your image
                    }}
                />
                
                
              </Animated.View>

              <Text className="text-3xl font-extrabold text-slate-800 text-center mb-2 tracking-tight">
                What's your <Text className="text-green-600">Location?</Text>
              </Text>
              <Text className="text-base text-slate-500 text-center max-w-[280px] leading-relaxed">
                Enter your area PIN code to check instant pickup availability.
              </Text>
            </View>

            {/* --- INPUT SECTION --- */}
            <Animated.View 
              style={{ transform: [{ scale: inputScale }] }}
              className={`w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border transition-all duration-300 ${
                isFocused ? 'border-green-500 border-2' : error ? 'border-red-400 border-2' : 'border-white'
              }`}
            >
              <View className="px-6 py-8 items-center">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Postal Code
                </Text>
                
                <TextInput
                  className="text-4xl font-black text-slate-800 w-full text-center tracking-[8px]"
                  placeholder="000 000"
                  placeholderTextColor="#cbd5e1"
                  value={pincode}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                    setPincode(cleaned);
                    if(error) setError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  selectionColor="#16a34a"
                />
              </View>
            </Animated.View>

            {/* --- ERROR MESSAGE --- */}
            {error ? (
              <Animated.View className="mt-4 bg-red-50 p-3 rounded-xl flex-row items-center justify-center gap-2">
                 <View className="w-2 h-2 rounded-full bg-red-500" />
                 <Text className="text-red-500 font-semibold text-sm">{error}</Text>
              </Animated.View>
            ) : (
               /* Minimal Value Props instead of the big list */
              <View className="mt-6 flex-row justify-center gap-6 opacity-60">
                <View className="flex-row items-center gap-1.5">
                  <CheckCircle2 size={14} color="#15803d" />
                  <Text className="text-xs font-medium text-slate-600">Best Rates</Text>
                </View>
                <View className="w-[1px] h-4 bg-slate-300" />
                <View className="flex-row items-center gap-1.5">
                  <CheckCircle2 size={14} color="#15803d" />
                  <Text className="text-xs font-medium text-slate-600">Instant Cash</Text>
                </View>
              </View>
            )}

            {/* --- ACTION BUTTON --- */}
            <View className="mt-10">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || pincode.length !== 6}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={pincode.length === 6 ? ['#16a34a', '#15803d'] : ['#cbd5e1', '#94a3b8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-green-200"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-lg font-bold text-white mr-2">
                         Check Availability 
                      </Text>
                      <ArrowRight size={24} color="white" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Use current location button */}
              <TouchableOpacity 
                className="mt-6 flex-row items-center justify-center gap-2 py-3 px-4 bg-green-50 rounded-xl active:bg-green-100"
                onPress={handleUseCurrentLocation}
                disabled={isUsingGPS || locationLoading}
                activeOpacity={0.7}
              >
                {isUsingGPS || locationLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#16a34a" />
                    <Text className="text-green-700 font-bold text-sm">Getting location...</Text>
                  </>
                ) : (
                  <>
                    <Navigation size={16} color="#16a34a" fill="#16a34a" />
                    <Text className="text-green-700 font-bold text-sm">Use my current location</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Skip button for testers - only shown when enabled */}
              {canSkip && (
                <TouchableOpacity 
                  className="mt-4 flex-row items-center justify-center gap-2 py-3 px-4 bg-amber-50 rounded-xl active:bg-amber-100 border border-amber-200"
                  onPress={handleSkip}
                  activeOpacity={0.7}
                >
                  <SkipForward size={16} color="#d97706" />
                  <Text className="text-amber-700 font-bold text-sm">Skip (Tester Mode)</Text>
                </TouchableOpacity>
              )}
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}