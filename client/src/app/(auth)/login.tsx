import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await AuthService.login({ email, password });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Login successful!',
      });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2C3E50', '#34495E']} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-20">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-2">Welcome Back</Text>
            <Text className="text-white/80 text-center">
              Sign in to continue your journey
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            {/* Email Input */}
            <View>
              <Text className="text-white font-medium mb-2">Email</Text>
              <TextInput
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-white font-medium mb-2">Password</Text>
              <TextInput
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              className="items-end"
            >
              <Text className="text-white/80 underline">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} className={`rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: '#27AE60' }}>
              <Text className="text-white font-bold text-lg">{loading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-white/30" />
              <Text className="text-white/60 px-4">or</Text>
              <View className="flex-1 h-px bg-white/30" />
            </View>

            {/* Social Login Buttons */}
            <TouchableOpacity className="bg-white/10 border border-white/20 rounded-lg py-3 items-center">
              <Text className="text-white font-medium">Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white/10 border border-white/20 rounded-lg py-3 items-center">
              <Text className="text-white font-medium">Continue with Facebook</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-white/80">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-white font-bold underline">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </LinearGradient>
  );
}