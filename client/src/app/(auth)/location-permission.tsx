import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { setLocationFromPincode, serviceAvailable } = useLocation();
  const { isAuthenticated } = useAuth();
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSubmit = async () => {
    // Step 1: Validate input
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 2: Call LocationContext validation
      const success = await setLocationFromPincode(pincode);

      if (success) {
        // ✅ Pincode is serviceable
        // Always go to login screen for new location setup
        // The index.tsx will handle authenticated users on next app launch
        router.replace('/(auth)/login');
      } else {
        // ❌ Pincode not serviceable
        if (!serviceAvailable) {
          // Navigate to fallback screen
          router.replace('/(auth)/service-unavailable');
        } else {
          // Show inline error with retry
          setError('Sorry, we don\'t service this PIN code yet. We\'re expanding soon!');
        }
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setError('');
    setPincode('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          className="w-full max-w-[400px] items-center"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Icon */}
          <Animated.View
            className="mb-8"
            style={{
              transform: [{ scale: pulseAnim }],
              shadowColor: '#16a34a',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d', '#166534']}
              className="w-36 h-36 rounded-full justify-center items-center border-4 border-white/30"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MapPin size={64} color="white" strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Text className="text-[28px] font-extrabold text-gray-900 text-center mb-3 tracking-tight">
            Enter Your PIN Code
          </Text>
          <Text className="text-base text-gray-500 text-center leading-6 max-w-xs mb-8">
            We need your PIN code to check service availability in your area
          </Text>

          {/* Benefits */}
          <View className="w-full bg-white rounded-[20px] p-6 mb-8 shadow-lg">
            <View className="flex-row items-center mb-4">
              <View className="w-7 h-7 rounded-full bg-green-100 justify-center items-center mr-3">
                <Text className="text-base font-extrabold text-green-600">✓</Text>
              </View>
              <Text className="flex-1 text-[15px] text-gray-700 font-medium">
                Check service availability
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="w-7 h-7 rounded-full bg-green-100 justify-center items-center mr-3">
                <Text className="text-base font-extrabold text-green-600">✓</Text>
              </View>
              <Text className="flex-1 text-[15px] text-gray-700 font-medium">
                Calculate accurate pickup rates
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-7 h-7 rounded-full bg-green-100 justify-center items-center mr-3">
                <Text className="text-base font-extrabold text-green-600">✓</Text>
              </View>
              <Text className="flex-1 text-[15px] text-gray-700 font-medium">
                Get best prices for your scrap
              </Text>
            </View>
          </View>

          {/* PIN Code Input */}
          <View className="w-full mb-4">
            <View className="flex-row items-center bg-white rounded-2xl border-2 border-gray-200 px-4 h-[58px] mb-2">
              <MapPin size={20} color="#6b7280" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-base text-gray-800 font-medium"
                placeholder="Enter 6-digit PIN code"
                placeholderTextColor="#9ca3af"
                value={pincode}
                onChangeText={(text) => {
                  // Only allow numbers and max 6 digits
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setPincode(cleaned);
                  if (error) setError('');
                }}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isLoading}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
                <Text className="text-sm text-red-600 text-center font-medium">
                  {error}
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="w-full rounded-2xl overflow-hidden mb-4"
            style={{
              shadowColor: '#16a34a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
              opacity: isLoading || !pincode || pincode.length !== 6 ? 0.5 : 1,
            }}
            onPress={handleSubmit}
            disabled={isLoading || !pincode || pincode.length !== 6}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              className="flex-row items-center justify-center py-[18px] gap-2.5"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-[17px] font-extrabold text-white tracking-[0.3px]">
                    Checking availability...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-[17px] font-extrabold text-white tracking-[0.3px]">
                    Continue
                  </Text>
                  <ChevronRight size={22} color="white" strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Try Again Button (shown when error) */}
          {error && (
            <TouchableOpacity
              className="py-3"
              onPress={handleTryAgain}
              disabled={isLoading}
            >
              <Text className="text-[15px] text-green-600 font-semibold">
                Try Again
              </Text>
            </TouchableOpacity>
          )}

          {/* Privacy Note */}
          <Text className="text-xs text-gray-400 text-center mt-6 max-w-[300px] leading-[18px]">
            🔒 Your location data is secure and used only for service delivery
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
