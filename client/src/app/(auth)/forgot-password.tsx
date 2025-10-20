import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import {StyleSheet, Platform} from 'react-native'

import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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

  const handleBackToLogin = ()=>{
    router.replace('/(auth)/login')
  }

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

  if(step === 'success'){
    return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity style={styles.backIcon} onPress={handleBackToLogin}>
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>

        <View style={styles.header}>
          <ScrapizLogo size={56} />
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>
            {getStepDescription()}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {step === 'email' && (
            <View>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>
                {error && (<Text style={styles.errorText}>{error}</Text>)}
              </View>

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handleSendResetEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Send Reset Code</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View>
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, {justifyContent: 'center'}]}>
                  <TextInput
                    style={[styles.input, styles.otpInput, error && styles.inputError]}
                    placeholder="0000"
                    placeholderTextColor="#9ca3af"
                    value={otp}
                    onChangeText={(text) => { setOtp(text); setError(''); }}
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!isLoading}
                  />
                </View>
                {error ? (<Text style={styles.errorText}>{error}</Text>) : (
                    <Text style={styles.instructionTextSmall}>A 4-digit code was sent to {email}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Verify Code</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.linkGroup}>
                <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                    <Text style={styles.linkText}>Resend Code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('email')} disabled={isLoading}>
                    <Text style={styles.linkText}>Change Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'newPassword' && (
            <View>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="New Password (min 6 characters)"
                    placeholderTextColor="#9ca3af"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setError(''); }}
                    secureTextEntry
                  />
                </View>
                {error && (<Text style={styles.errorText}>{error}</Text>)}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
                    secureTextEntry
                  />
                </View>
                {error && (<Text style={styles.errorText}>{error}</Text>)}
              </View>
              
              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.linkGroup}>
                <TouchableOpacity onPress={() => setStep('otp')} disabled={isLoading}>
                    <Text style={styles.linkText}>Back to OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        {step !== 'success' && (
            <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                    <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
            </View>
        )}
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  formContainer: {
    flex: 1,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 16,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
});