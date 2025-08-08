import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully!',
      });
      router.replace('/auth/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-20">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-2">Welcome to Scrapiz</Text>
            <Text className="text-white/80 text-center">
              Your Travel Companion
            </Text>
          </View>

          {/* Main Content */}
          <View className="space-y-6">
            {/* Welcome Card */}
            <View className="bg-white/10 border border-white/20 rounded-lg p-6">
              <Text className="text-white text-lg font-semibold mb-2">
                🎉 Congratulations!
              </Text>
              <Text className="text-white/80">
                You have successfully logged in to Scrapiz. Start exploring amazing travel destinations and plan your next adventure!
              </Text>
            </View>

            {/* Features */}
            <View className="space-y-4">
              <Text className="text-white text-xl font-bold mb-4">What's New</Text>
              
              <View className="bg-white/10 border border-white/20 rounded-lg p-4">
                <Text className="text-white font-semibold mb-1">🌍 Discover Destinations</Text>
                <Text className="text-white/80">Explore amazing places around the world</Text>
              </View>

              <View className="bg-white/10 border border-white/20 rounded-lg p-4">
                <Text className="text-white font-semibold mb-1">✈️ Plan Your Trip</Text>
                <Text className="text-white/80">Create detailed travel itineraries</Text>
              </View>

              <View className="bg-white/10 border border-white/20 rounded-lg p-4">
                <Text className="text-white font-semibold mb-1">📸 Share Memories</Text>
                <Text className="text-white/80">Share your travel experiences with friends</Text>
              </View>

              <View className="bg-white/10 border border-white/20 rounded-lg p-4">
                <Text className="text-white font-semibold mb-1">🎯 Smart Recommendations</Text>
                <Text className="text-white/80">Get personalized travel suggestions</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-4 mt-8">
              <TouchableOpacity className="bg-white rounded-lg py-4 items-center">
                <Text className="text-purple-600 font-bold text-lg">Start Exploring</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-white/10 border border-white/20 rounded-lg py-4 items-center">
                <Text className="text-white font-bold text-lg">View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleLogout}
                className="bg-red-500/20 border border-red-500/30 rounded-lg py-4 items-center"
              >
                <Text className="text-red-300 font-bold text-lg">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </LinearGradient>
  );
}
