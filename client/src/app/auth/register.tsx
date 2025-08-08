import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register({
        email,
        name,
        password,
        confirm_password: confirmPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent to your email!',
      });
      setStep('otp');
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

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await AuthService.verifyOtp({ email, otp });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account verified successfully!',
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

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await AuthService.resendOtp(email);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP resent successfully!',
      });
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
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-20">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-2">
              {step === 'register' ? 'Create Account' : 'Verify OTP'}
            </Text>
            <Text className="text-white/80 text-center">
              {step === 'register' 
                ? 'Join us and start your journey' 
                : 'Enter the OTP sent to your email'
              }
            </Text>
          </View>

          {step === 'register' ? (
            /* Register Form */
            <View className="space-y-6">
              {/* Name Input */}
              <View>
                <Text className="text-white font-medium mb-2">Full Name</Text>
                <TextInput
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

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

              {/* Confirm Password Input */}
              <View>
                <Text className="text-white font-medium mb-2">Confirm Password</Text>
                <TextInput
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                className={`bg-white rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
              >
                <Text className="text-purple-600 font-bold text-lg">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center mt-8">
                <Text className="text-white/80">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text className="text-white font-bold underline">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* OTP Verification Form */
            <View className="space-y-6">
              {/* OTP Input */}
              <View>
                <Text className="text-white font-medium mb-2">OTP Code</Text>
                <TextInput
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 text-center text-2xl font-bold"
                  placeholder="0000"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={loading}
                className={`bg-white rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
              >
                <Text className="text-purple-600 font-bold text-lg">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={loading}
                className="items-center"
              >
                <Text className="text-white/80 underline">
                  Didn't receive OTP? Resend
                </Text>
              </TouchableOpacity>

              {/* Back to Register */}
              <TouchableOpacity
                onPress={() => setStep('register')}
                className="items-center mt-4"
              >
                <Text className="text-white/60">Back to Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </LinearGradient>
  );
}