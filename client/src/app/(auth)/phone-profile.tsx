import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  User,
  Mail,
  Phone,
  CheckCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhoneAuthStore } from '../../store/phoneAuthStore';
import { useLocalization } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

/**
 * Phone Profile Completion Screen Component
 * 
 * Implements Requirements 12.1, 12.2, 12.3, 12.4, 12.5:
 * - Full Name input field (required)
 * - Email input field (required)
 * - Verified phone number displayed as read-only
 * - NO password field
 * - Form validation before submission
 * 
 * @see .kiro/specs/phone-otp-authentication/design.md
 */
export default function PhoneProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  const { setAuthenticatedState } = useAuth();
  
  // Phone auth store
  const { 
    phoneNumber, 
    firebaseUid,
    handleLinkSuccess,
    handleLinkConfirmationRequired,
    setError,
  } = usePhoneAuthStore();

  // Local state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Refs
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Run entrance animations
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

  // Focus name input on mount
  useEffect(() => {
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  /**
   * Validate name field
   * Requirement 12.1: Full Name input (required)
   * 
   * @param value - Name value to validate
   * @returns true if valid, false otherwise
   */
  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError(t('auth.errors.nameRequired') || 'Name is required');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError(t('auth.errors.nameTooShort') || 'Name must be at least 2 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  /**
   * Validate email field
   * Requirement 12.2: Email input (required)
   * 
   * @param value - Email value to validate
   * @returns true if valid, false otherwise
   */
  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError(t('auth.errors.emailRequired') || 'Email is required');
      return false;
    }
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t('auth.errors.invalidEmail') || 'Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  /**
   * Validate all form fields
   * Requirement 12.5: Validate all required fields before submission
   * 
   * @returns true if all fields are valid
   */
  const validateForm = (): boolean => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    return isNameValid && isEmailValid;
  };

  /**
   * Check if form can be submitted
   */
  const isFormValid = (): boolean => {
    return name.trim().length >= 2 && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
           !isSubmitting;
  };

  /**
   * Handle name input change
   */
  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) {
      setNameError(null);
    }
  };

  /**
   * Handle email input change
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  };

  /**
   * Handle form submission
   * Calls backend /phone/complete-profile/ endpoint
   * Handles state transitions based on response
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!phoneNumber || !firebaseUid) {
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: t('auth.errors.sessionExpired') || 'Session expired. Please try again.',
      });
      router.replace('/(auth)/phone-login');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AuthService.phoneCompleteProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber,
        firebase_uid: firebaseUid,
      });

      // Handle response based on type
      if ('requires_link_confirmation' in response && response.requires_link_confirmation) {
        // Email collision - needs link confirmation
        handleLinkConfirmationRequired(response.existing_email, response.auth_provider);
        router.replace('/(auth)/phone-link-confirm');
      } else if ('jwt' in response && response.jwt && response.user) {
        // New user created successfully
        handleLinkSuccess(response.user);
        
        // Wait for SecureStorage to fully persist the token
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Verify the token was actually stored
        const isStored = await AuthService.isAuthenticated();
        if (!isStored) {
          console.warn('JWT was not stored properly');
          throw new Error('Failed to store authentication token');
        }
        
        // Update authentication state
        setAuthenticatedState(true);
        
        Toast.show({
          type: 'success',
          text1: t('common.success') || 'Success',
          text2: t('auth.phoneProfile.accountCreated') || 'Account created successfully!',
        });
        
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Profile completion error:', err);
      setError(err.message || 'Profile completion failed');
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: err.message || 'Profile completion failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back button press
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Format phone number for display
   */
  const formatPhoneForDisplay = (phone: string | null): string => {
    if (!phone) return '';
    return phone;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.backgroundWrapper}>
        {/* Green Gradient Header */}
        <LinearGradient
          colors={isDark ? ['#22c55e', '#16a34a', '#15803d'] : ['#16a34a', '#15803d', '#14532d']}
          style={styles.greenHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Texture Pattern */}
          <View style={styles.texturePattern}>
            {Array.from({ length: 80 }).map((_, i) => (
              <View key={i} style={styles.textureDot} />
            ))}
          </View>
          
          {/* Decorative Circles */}
          <Animated.View 
            style={[
              styles.bgCircle1,
              {
                zIndex: 1,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.15]
                })
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.bgCircle2,
              {
                zIndex: 1,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1]
                })
              }
            ]}
          />
          
          {/* Header Content */}
          <Animated.View 
            style={[
              styles.headerInGreen,
              {
                zIndex: 10,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/images/LogowithoutS.png')} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
              <View style={styles.badge}>
                <Sparkles size={12} color="#ffffff" />
                <Text style={styles.badgeText}>{t('auth.trustedBy') || 'Trusted by 10k+ users'}</Text>
              </View>
            </View>
            
            <Text style={styles.welcomeText}>
              {t('auth.phoneProfile.title') || 'Complete Your Profile'}
            </Text>
          </Animated.View>
        </LinearGradient>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                {t('auth.phoneProfile.instruction') || 'Please provide your details to complete registration'}
              </Text>

              {/* Verified Phone Number - Read Only (Requirement 12.3) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.phoneProfile.phoneLabel') || 'Phone Number'}
                </Text>
                <View 
                  style={[
                    styles.inputWrapper,
                    styles.readOnlyInput,
                    { 
                      backgroundColor: isDark ? '#1f2937' : '#f3f4f6', 
                      borderColor: colors.primary 
                    }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Phone size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.readOnlyText, { color: colors.text }]}>
                    {formatPhoneForDisplay(phoneNumber)}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={16} color={colors.primary} />
                    <Text style={[styles.verifiedText, { color: colors.primary }]}>
                      {t('auth.phoneProfile.verified') || 'Verified'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Full Name Input - Required (Requirement 12.1) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.phoneProfile.nameLabel') || 'Full Name'} <Text style={styles.required}>*</Text>
                </Text>
                <View 
                  style={[
                    styles.inputWrapper,
                    { 
                      backgroundColor: colors.inputBackground, 
                      borderColor: nameError ? colors.error : colors.inputBorder 
                    }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    ref={nameInputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('auth.phoneProfile.namePlaceholder') || 'Enter your full name'}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={name}
                    onChangeText={handleNameChange}
                    onBlur={() => validateName(name)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>
                {nameError && (
                  <Text style={styles.errorText}>⚠️ {nameError}</Text>
                )}
              </View>

              {/* Email Input - Required (Requirement 12.2) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.phoneProfile.emailLabel') || 'Email Address'} <Text style={styles.required}>*</Text>
                </Text>
                <View 
                  style={[
                    styles.inputWrapper,
                    { 
                      backgroundColor: colors.inputBackground, 
                      borderColor: emailError ? colors.error : colors.inputBorder 
                    }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <Mail size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('auth.phoneProfile.emailPlaceholder') || 'Enter your email address'}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={() => validateEmail(email)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
                {emailError && (
                  <Text style={styles.errorText}>⚠️ {emailError}</Text>
                )}
              </View>

              {/* Note: NO password field as per Requirement 12.4 */}
              
              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.submitButton,
                  (!isFormValid()) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid()}
              >
                <LinearGradient
                  colors={isFormValid() 
                    ? ['#16a34a', '#15803d', '#14532d'] 
                    : ['#9ca3af', '#6b7280', '#4b5563']
                  }
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.submitButtonText}>
                        {t('auth.phoneProfile.creating') || 'Creating Account...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={22} color="white" />
                      <Text style={styles.submitButtonText}>
                        {t('auth.phoneProfile.submit') || 'Create Account'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Trust Indicators */}
            <Animated.View 
              style={[
                styles.trustIndicators,
                { 
                  backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                  borderColor: isDark ? '#16a34a' : '#bbf7d0',
                  opacity: fadeAnim 
                }
              ]}
            >
              <View style={styles.trustItem}>
                <Shield size={18} color="#10b981" />
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>
                  {t('auth.secure') || '100% Secure'}
                </Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: isDark ? '#16a34a' : '#bbf7d0' }]} />
              <View style={styles.trustItem}>
                <Zap size={18} color="#f59e0b" />
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>
                  {t('auth.fastPayout') || 'Fast Payout'}
                </Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: isDark ? '#16a34a' : '#bbf7d0' }]} />
              <View style={styles.trustItem}>
                <Sparkles size={18} color="#8b5cf6" />
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>
                  {t('auth.bestRates') || 'Best Rates'}
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundWrapper: {
    flex: 1,
  },
  greenHeader: {
    position: 'absolute',
    width: '100%',
    height: hp(36),
    top: 0,
    borderBottomLeftRadius: spacing(32),
    borderBottomRightRadius: spacing(32),
    overflow: 'hidden',
  },
  texturePattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.15,
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(20),
  },
  textureDot: {
    width: spacing(3),
    height: spacing(3),
    borderRadius: spacing(1.5),
    backgroundColor: '#ffffff',
    margin: spacing(12),
  },
  bgCircle1: {
    position: 'absolute',
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: hp(-12.3),
    right: wp(-21.3),
  },
  bgCircle2: {
    position: 'absolute',
    width: wp(58.7),
    height: wp(58.7),
    borderRadius: wp(29.3),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: hp(-7.4),
    left: wp(-16),
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing(24),
    paddingTop: hp(36) + spacing(20),
    paddingBottom: spacing(30),
    justifyContent: 'space-between',
  },
  headerInGreen: {
    position: 'absolute',
    top: hp(5),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing(20),
  },
  backButton: {
    position: 'absolute',
    left: spacing(16),
    top: spacing(8),
    padding: spacing(8),
    zIndex: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(16),
    width: '100%',
  },
  logoImage: {
    width: wp(60),
    height: hp(10),
    marginBottom: spacing(8),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(8),
    borderRadius: spacing(20),
    gap: spacing(6),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: fs(11),
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  welcomeText: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing(8),
    marginTop: spacing(4),
    textAlign: 'center',
    letterSpacing: -0.4,
    paddingHorizontal: spacing(20),
    lineHeight: fs(26),
  },
  formContainer: {
    marginBottom: spacing(20),
  },
  instructionText: {
    fontSize: fs(14),
    textAlign: 'center',
    marginBottom: spacing(24),
    lineHeight: fs(20),
  },
  inputGroup: {
    marginBottom: spacing(16),
  },
  inputLabel: {
    fontSize: fs(14),
    fontWeight: '600',
    marginBottom: spacing(8),
  },
  required: {
    color: '#dc2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing(16),
    borderWidth: 1.5,
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(4),
    height: hp(7.1),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  readOnlyInput: {
    borderWidth: 2,
  },
  iconCircle: {
    width: wp(10.1),
    height: wp(10.1),
    borderRadius: wp(5.05),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(12),
  },
  input: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  readOnlyText: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(4),
    borderRadius: spacing(8),
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  verifiedText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  errorText: {
    fontSize: fs(13),
    color: '#dc2626',
    fontWeight: '600',
    marginTop: spacing(6),
    marginLeft: spacing(4),
  },
  submitButton: {
    borderRadius: spacing(16),
    height: hp(6.9),
    overflow: 'hidden',
    marginTop: spacing(24),
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(10),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fs(17),
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(10),
    borderRadius: spacing(14),
    gap: spacing(8),
    borderWidth: 1,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    flex: 1,
    justifyContent: 'center',
  },
  trustText: {
    fontSize: fs(11),
    fontWeight: '700',
    flexShrink: 1,
    fontFamily: 'Inter-Bold',
  },
  trustDivider: {
    width: 1,
    height: spacing(16),
  },
});
