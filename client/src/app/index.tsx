import { View, Text, Image } from 'react-native';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <View className="items-center space-y-6">
          {/* Logo */}
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-lg">
            <Text className="text-3xl font-bold text-purple-600">S</Text>
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
          <View className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </View>
      </View>
    </LinearGradient>
  );
}