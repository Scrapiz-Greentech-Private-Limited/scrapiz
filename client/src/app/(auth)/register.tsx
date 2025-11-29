import React, { useState, useEffect, useRef } from 'react';
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
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Mail,
  Lock,
  Eye,
  ArrowLeft,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, [fadeAnim, slideAnim]);

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
    const handleAuthSuccess = async () => {
      if (authSuccess) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Sign up successful!',
        });
        
        // Check if we should show notification permission screen
        const { hasShownNotificationPermission } = await import('../../utils/notificationPermission');
        const hasShown = await hasShownNotificationPermission();
        
        if (!hasShown) {
          // Navigate to notification permission screen first
          router.replace('/notification-permission');
        } else {
          // Navigate directly to home
          router.replace('/(tabs)/home');
        }
      }
    };
    
    handleAuthSuccess();
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.otpHeader}>
              <ScrapizLogo size={56} />
              <Text style={[styles.otpTitle, { color: colors.text }]}>Verify Your Email</Text>
              <Text style={[styles.otpSubtitle, { color: colors.textSecondary }]}>
                Enter the 6-digit OTP sent to {formData.email}
              </Text>
            </View>

            <View style={styles.otpFormContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.otpInput,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.otp ? colors.error : colors.inputBorder,
                      color: colors.text
                    }
                  ]}
                  placeholder="000000"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  editable={!isLoading}
                />
                {errors.otp && (
                  <Text style={styles.errorText}>{errors.otp}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: colors.primary },
                  isLoading && styles.registerButtonDisabled
                ]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.registerButtonText}>Verifying...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Verify OTP</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={isLoading}
              >
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  Didn't receive OTP? Resend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToRegisterButton}
                onPress={() => setStep('register')}
              >
                <Text style={[styles.backToRegisterText, { color: colors.textSecondary }]}>
                  Back to Register
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <Toast />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Render registration form
  return (
  <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback>
          <View>
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <ScrapizLogo width={220} />
              <Text style={[styles.welcomeText, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                Join thousands of users earning money while helping the environment
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.fullName ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.fullName}
                    onChangeText={(text) => handleInputChange('fullName', text)}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!isanyLoading}
                  />
                </View>
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.email ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Mail size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email Address"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isanyLoading}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.phone ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Phone size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!isanyLoading}
                  />
                </View>
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Referral Code Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.referralCode ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Gift size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Referral Code (Optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.referralCode}
                    onChangeText={(text) => handleInputChange('referralCode', text)}
                    autoCapitalize="characters"
                    maxLength={9}
                    editable={!isanyLoading}
                  />
                </View>
                {errors.referralCode && (
                  <Text style={styles.errorText}>{errors.referralCode}</Text>
                )}
                {!errors.referralCode && formData.referralCode.trim() && formData.referralCode.length === 9 && (
                  <Text style={[styles.referralHintText, { color: colors.success }]}>
                    🎁 You'll get ₹5 bonus on your first order over ₹500!
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.password ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Lock size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    editable={!isanyLoading}
                  />
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.confirmPassword ? colors.error : colors.inputBorder
                  }
                ]}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Lock size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    editable={!isanyLoading}
                  />
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: colors.primary },
                  isLoading && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.registerButtonText}>Creating Account...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Create Account</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              {/* Terms and Privacy */}
              <View style={{ paddingHorizontal: 8 }}>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  By creating an account, you agree to our{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              style={[
                styles.footer,
                { opacity: fadeAnim }
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 16,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    marginTop: 16,
  },
  subtitleText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  formContainer: {
    flex: 1,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 4,
  },
  referralHintText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 4,
  },
  registerButton: {
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 12,
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
    fontFamily: 'Inter-Bold',
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontFamily: 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  // OTP Screen Styles
  otpHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    marginTop: 20,
  },
  otpSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  otpFormContainer: {
    flex: 1,
    marginBottom: 24,
  },
  otpInput: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
  backToRegisterButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backToRegisterText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});