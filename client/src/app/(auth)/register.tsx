import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,

  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Chrome,
  Phone,
  Gift,
} from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import ScrapizLogo from '../../components/ScrapizLogo';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '', // Optional referral/promo code
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

 const { signInWithGoogle, isLoading: isGoogleLoading, error: googleError, authSuccess } = useGoogleAuth();


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Referral code validation (optional field)
    if (formData.referralCode.trim()) {
      const referralCode = formData.referralCode.trim().toUpperCase();
      // Validate format: Should be alphanumeric with hyphen, 9 characters (XXXX-XXXX)
      if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(referralCode)) {
        newErrors.referralCode = 'Invalid referral code format (e.g., ABCD-1234)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    // Auto-uppercase and format referral code as user types
    if (field === 'referralCode') {
      value = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      // Auto-add hyphen after 4 characters
      if (value.length === 4 && !value.includes('-')) {
        value = value + '-';
      }
      // Limit to 9 characters (XXXX-XXXX)
      value = value.slice(0, 9);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Call actual backend API with optional promo code
      const registerData: any = {
        email: formData.email,
        name: formData.fullName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      // Add promo_code only if provided
      if (formData.referralCode.trim()) {
        registerData.promo_code = formData.referralCode.trim().toUpperCase();
      }

      await AuthService.register(registerData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent to your email!',
      });
      
      // Move to OTP verification step
      setStep('otp');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Unable to create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter a valid 4-digit OTP',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call actual backend API for OTP verification
      await AuthService.verifyOtp({ 
        email: formData.email, 
        otp 
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account verified successfully!',
      });
      
      // Navigate to tabs/home after successful verification
      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.message || 'Invalid OTP. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    
    try {
      await AuthService.resendOtp(formData.email);
      
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new OTP has been sent to your email',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.message || 'Unable to resend OTP. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      // Navigation will be handled by useEffect when authSuccess changes
    } catch (error) {
      console.error('Google sign-up error:', error);
    }
  };

  // Handle Google auth success
  useEffect(() => {
    if (authSuccess) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Sign up successful!',
      });
      router.replace('/(tabs)/home');
    }
  }, [authSuccess]);

  // Show Google error toast
  useEffect(() => {
    if (googleError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: googleError,
      });
    }
  }, [googleError]);

  const isanyLoading = isLoading || isGoogleLoading;

  // Render OTP screen
  if (step === 'otp') {
    return (
      <KeyboardAvoidingView 
        className='flex-1 bg-slate-50'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className='items-center mb-8'>
            <ScrapizLogo size={56} />
            <Text className='text-2xl font-semibold text-gray-900 font-inter-semibold mb-2 mt-5'>Verify Your Email</Text>
            <Text className='text-base text-gray-500 font-inter-regular text-center leading-6 max-w-xs'>
              Enter the 6-digit OTP sent to {formData.email}
            </Text>
          </View>

          <View className='flex-1 mb-6'>
            <View className='mb-4'>
              <TextInput
                style={[styles.otpInput, errors.otp && styles.inputError]}
                placeholder="000000"
                placeholderTextColor="#9ca3af"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                editable={!isLoading}
              />
              {errors.otp && (
                <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.otp}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text className='text-base font-semibold text-white font-inter-semibold'>Verifying...</Text>
              ) : (
                <>
                  <Text className='text-base font-semibold text-white font-inter-semibold'>Verify OTP</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className='items-center mt-4'
              onPress={handleResendOtp}
              disabled={isLoading}
            >
              <Text className='text-sm text-green-600 font-inter-medium underline'>
                Didn't receive OTP? Resend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='items-center mt-6'
              onPress={() => setStep('register')}
            >
              <Text className='text-sm text-gray-500 font-inter-regular'>Back to Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Toast />
      </KeyboardAvoidingView>
    );
  }

  // Render registration form
  return (
    <KeyboardAvoidingView 
      className='flex-1 bg-slate-50'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className='items-center mb-8'>
          <ScrapizLogo size={56} />
          <Text className='text-2xl font-semibold text-gray-900 font-inter-semibold mb-2 mt-5'>Create Account</Text>
          <Text className='text-base text-gray-500 font-inter-regular text-center leading-6 max-w-xs'>
            Join thousands of users earning money while helping the environment
          </Text>
        </View>

        <View className='flex-1 mb-6'>
          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <User size={20} color="#6b7280" className='mr-3' />
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isanyLoading}
              />
            </View>
            {errors.fullName && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.fullName}</Text>
            )}
          </View>

          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <Mail size={20} color="#6b7280" className='mr-3' />
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email Address"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isanyLoading}
              />
            </View>
            {errors.email && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.email}</Text>
            )}
          </View>

          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <Phone size={20} color="#6b7280" className='mr-3' />
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Phone Number"
                placeholderTextColor="#9ca3af"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isanyLoading}
              />
            </View>
            {errors.phone && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.phone}</Text>
            )}
          </View>

          {/* Referral Code Input */}
          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <Gift size={20} color="#16a34a" className='mr-3' />
              <TextInput
                style={[styles.input, errors.referralCode && styles.inputError]}
                placeholder="Referral Code (Optional)"
                placeholderTextColor="#9ca3af"
                value={formData.referralCode}
                onChangeText={(text) => handleInputChange('referralCode', text)}
                autoCapitalize="characters"
                maxLength={9}
                editable={!isanyLoading}
              />
            </View>
            {errors.referralCode && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.referralCode}</Text>
            )}
            {!errors.referralCode && formData.referralCode.trim() && formData.referralCode.length === 9 && (
              <Text className='text-xs text-green-600 font-inter-medium mt-1.5 ml-1'>
                🎁 You'll get ₹5 bonus on your first order over ₹500!
              </Text>
            )}
          </View>

          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <Lock size={20} color="#6b7280" className='mr-3' />
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                editable={!isanyLoading}
              />
              <TouchableOpacity
                className='p-1'
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.password}</Text>
            )}
          </View>

          <View className='mb-4'>
            <View className='flex-row items-center bg-white rounded-2xl border border-gray-200 px-4 h-14 shadow-sm shadow-black/5'>
              <Lock size={20} color="#6b7280" className='mr-3' />
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                placeholderTextColor="#9ca3af"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                editable={!isanyLoading}
              />
              <TouchableOpacity
                className='p-1'
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text className='text-xs text-red-500 font-inter-regular mt-1.5 ml-1'>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text className='text-base font-semibold text-white font-inter-semibold'>Creating Account...</Text>
            ) : (
              <>
                <Text className='text-base font-semibold text-white font-inter-semibold'>Create Account</Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <View className='px-2'>
            <Text className='text-xs text-gray-500 font-inter-regular text-center leading-[18px]'>
              By creating an account, you agree to our{' '}
              <Text className='text-green-600 font-inter-medium'>Terms of Service</Text>
              {' '}and{' '}
              <Text className='text-green-600 font-inter-medium'>Privacy Policy</Text>
            </Text>
          </View>
        </View>

        <View className='flex-row justify-center items-center'>
          <Text className='text-sm text-gray-500 font-inter-regular'>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className='text-sm text-green-600 font-inter-semibold'>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  inputError: {
    borderColor: '#ef4444',
  },

  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    marginLeft: 4,
  },

  otpInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 80,
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    letterSpacing: 16,
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

  googleIcon: {
    marginRight: 12,
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
});