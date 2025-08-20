import { View, Text, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from '../api/apiService';

export default function SplashScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user is already authenticated
      const isAuthenticated = await AuthService.isAuthenticated();
      
      setTimeout(() => {
        if (isAuthenticated) {
          // User has valid token, go directly to home
          router.replace('/(tabs)/home');
        } else {
          // No valid token, go to login
          router.replace('/(auth)/login');
        }
        setIsChecking(false);
      }, 2000); // Keep splash for 2 seconds for better UX
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, default to login screen
      setTimeout(() => {
        router.replace('/(auth)/login');
        setIsChecking(false);
      }, 2000);
    }
  };

  return (
    <LinearGradient colors={['#2C3E50', '#34495E']} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <View className="items-center space-y-6">
          {/* Logo */}
          <View className="w-24 h-24 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: '#27AE60' }}>
           <Image source={require('../../assets/images/scrapiz.jpg')} className="w-24 h-24 rounded-full" />
          </View>
          
          {/* App Name */}
          <Text className="text-4xl font-bold text-white">Scrapiz</Text>
          
          {/* Tagline */}
          <Text className="text-lg text-white/80 text-center px-8">
            Your Dukaan Wala
          </Text>
        </View>
        
        {/* Loading indicator */}
        <View className="absolute bottom-20">
          <View className="w-8 h-8 border-2 border-white/30 rounded-full animate-spin" style={{ borderTopColor: '#27AE60' }} />
        </View>
      </View>
    </LinearGradient>
  );
}