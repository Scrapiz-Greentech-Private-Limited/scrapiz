import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await AuthService.passwordResetRequest(email);
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
      // For this step, we'll just move to the next step
      // In a real implementation, you might want to verify the OTP first
      setStep('newPassword');
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

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await AuthService.passwordReset({
        email,
        otp,
        new_password: newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset successfully!',
      });
      router.replace('/(auth)/login');
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
      await AuthService.passwordResetRequest(email);
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

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Forgot Password';
      case 'otp':
        return 'Verify OTP';
      case 'newPassword':
        return 'New Password';
      default:
        return 'Forgot Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return 'Enter your email to receive a reset code';
      case 'otp':
        return 'Enter the OTP sent to your email';
      case 'newPassword':
        return 'Enter your new password';
      default:
        return 'Enter your email to receive a reset code';
    }
  };

  return (
    <LinearGradient colors={['#2C3E50', '#34495E']} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-20">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-2">
              {getStepTitle()}
            </Text>
            <Text className="text-white/80 text-center">
              {getStepDescription()}
            </Text>
          </View>

          {step === 'email' && (
            /* Email Form */
            <View className="space-y-6">
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

              <TouchableOpacity onPress={handleSendResetEmail} disabled={loading} className={`rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: '#27AE60' }}>
                <Text className="text-white font-bold text-lg">{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="items-center"
              >
                <Text className="text-white/80 underline">Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            /* OTP Form */
            <View className="space-y-6">
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

              <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} className={`rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: '#27AE60' }}>
                <Text className="text-white font-bold text-lg">{loading ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={loading}
                className="items-center"
              >
                <Text className="text-white/80 underline">
                  Didn't receive OTP? Resend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep('email')}
                className="items-center"
              >
                <Text className="text-white/60">Back to Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'newPassword' && (
            /* New Password Form */
            <View className="space-y-6">
              <View>
                <Text className="text-white font-medium mb-2">New Password</Text>
                <TextInput
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View>
                <Text className="text-white font-medium mb-2">Confirm New Password</Text>
                <TextInput
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60"
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity onPress={handleResetPassword} disabled={loading} className={`rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: '#27AE60' }}>
                <Text className="text-white font-bold text-lg">{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep('otp')}
                className="items-center"
              >
                <Text className="text-white/60">Back to OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
    </LinearGradient>
  );
}