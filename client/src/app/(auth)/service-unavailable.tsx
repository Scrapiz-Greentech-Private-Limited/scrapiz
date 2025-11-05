import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Rocket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../../context/LocationContext';
import { SERVICE_CITIES, getComingSoonCityInfo } from '../../constants/serviceArea';
import { WaitlistService } from '../../api/apiService';

export default function ServiceUnavailableScreen() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityName = currentLocation?.city || 'your city';
  const comingSoonInfo = getComingSoonCityInfo(cityName);

  const handleNotifyMe = async () => {
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Required', 'Please enter your email or phone number');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.replace(/[\s\-()]/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await WaitlistService.submitWaitlist({
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
        city: cityName,
      });

      setEmail('');
      setPhone('');

      Alert.alert(
        '🎉 Success!',
        response.message || `Thank you for your interest! We'll notify you as soon as Scrapiz launches in ${cityName}.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const errorDetails = error.response?.data?.details;
      let errorMessage = 'Failed to save your details. Please try again.';

      if (errorDetails) {
        const errors = Object.entries(errorDetails)
          .map(([field, messages]) => {
            const fieldName = field === 'phone_number' ? 'Phone' : field.charAt(0).toUpperCase() + field.slice(1);
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        errorMessage = errors;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-slate-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon */}
        <View className='items-center mb-8'>
          <View className='w-32 h-32 rounded-full bg-green-100 justify-center items-center'>
            <Rocket size={64} color="#16a34a" strokeWidth={1.5} />
          </View>
        </View>

        {/* Title Section */}
        <View className='mb-10'>
          <Text className='text-3xl font-bold text-gray-900 text-center mb-3'>
            Coming Soon to {cityName}!
          </Text>
          <Text className='text-base text-gray-600 text-center leading-relaxed px-4'>
            We're not in {cityName} yet, but we're expanding fast across India! 🚀
          </Text>
        </View>

        {/* Notify Me Form */}
        <View className='bg-white rounded-2xl p-6 mb-6 shadow-sm'>
          <Text className='text-lg font-bold text-gray-900 mb-5 text-center'>
            Get Notified When We Launch
          </Text>

          <View className='mb-5'>
            <View className='bg-gray-50 rounded-xl border border-gray-200 px-4 py-4 mb-3'>
              <Text className='text-xs text-gray-500 mb-1 font-medium'>Email Address</Text>
              <TextInput
                className='text-base text-gray-900'
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className='bg-gray-50 rounded-xl border border-gray-200 px-4 py-4'>
              <Text className='text-xs text-gray-500 mb-1 font-medium'>Phone Number (Optional)</Text>
              <TextInput
                className='text-base text-gray-900'
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    setPhone(cleaned);
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <TouchableOpacity
            className='rounded-xl overflow-hidden'
            onPress={handleNotifyMe}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              className='flex-row items-center justify-center py-4'
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Bell size={20} color="white" strokeWidth={2.5} />
                  <Text className='text-base font-bold text-white ml-2'>Notify Me</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Expanding Cities */}
        <View className='bg-white rounded-2xl p-5 mb-6 shadow-sm'>
          <Text className='text-sm font-semibold text-gray-700 mb-4'>Expanding to:</Text>
          <View className='flex-row flex-wrap gap-2.5'>
            {SERVICE_CITIES.comingSoon.slice(0, 6).map((city, index) => (
              <View 
                key={index} 
                className='flex-row items-center bg-green-50 px-3.5 py-2.5 rounded-lg border border-green-200'
              >
                <MapPin size={14} color="#16a34a" strokeWidth={2} />
                <Text className='text-sm font-semibold text-green-800 ml-1.5'>{city.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer Note */}
        <View className='px-4'>
          <Text className='text-xs text-gray-400 text-center leading-5'>
            🌱 As a bootstrapped startup, we're building Scrapiz sustainably. Every city we expand to is carefully planned for quality service!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}