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
  Dimensions,
  Animated,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Chrome,
  X,
  Link as LinkIcon,
  Phone,
} from 'lucide-react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import ScrapizLogo from '../../components/ScrapizLogo';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth, AppleAuthError, appleAuthErrorMessages } from '../../hooks/useAppleAuth';
import { useLocalization } from '../../context/LocalizationContext';
import { wp, hp, fs, spacing } from '../../utils/responsive'
import { useTheme } from '../../context/ThemeContext.tsx';
import { ForceUpdateModal } from '../../components/ForceUpdateModal';
import { checkAppVersion } from '../../utils/versionCheck';
import { loadGuestOrderState, clearGuestOrderState } from '../../utils/guestOrderPersistence';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();

  // Get returnTo parameter for post-auth navigation (guest flow support)
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?
    : string; password?: string
  }>({});

  // Force update state
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState('');
  const [minVersion, setMinVersion] = useState('1.0.0');

  // Google Auth Hook
  const { signInWithGoogle, isLoading: isGoogleLoading, error: googleError, authSuccess } = useGoogleAuth();

  // Apple Auth Hook (iOS only)
  const {
    signInWithApple,
    confirmAccountLink,
    isLoading: isAppleLoading,
    error: appleError,
    errorType: appleErrorType,
    authSuccess: appleAuthSuccess,
    isAvailable: isAppleAvailable,
    pendingLinkEmail,
    clearError: clearAppleError,
  } = useAppleAuth();

  // State for account linking confirmation modal
  const [showLinkConfirmModal, setShowLinkConfirmModal] = useState(false);

  // Refs for input navigation
  const passwordInputRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Check app version on mount
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const versionCheck = await checkAppVersion();

        if (versionCheck.force_update) {
          setShowForceUpdate(true);
          setUpdateUrl(versionCheck.update_url);
          setMinVersion(versionCheck.min_app_version);
        }
      } catch (error) {
        console.error('Version check failed:', error);
        // Fail open - don't block users if check fails
      }
    };

    checkVersion();
  }, []);

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

  /**
   * Shared navigation helper for post-auth flow
   * Handles returnTo parameter for guest flow and notification permission check
   */
  const navigateAfterAuth = async () => {
    // Check if we should show notification permission screen
    const { hasShownNotificationPermission } = await import('../../utils/notificationPermission');
    const hasShown = await hasShownNotificationPermission();

    // Small delay to ensure auth state is fully propagated before navigation
    // This prevents race conditions on iOS that can cause app crashes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Determine destination based on returnTo parameter
    let destination = '/(tabs)/home';

    if (returnTo) {
      // Decode the returnTo parameter
      const decodedReturnTo = decodeURIComponent(returnTo);
      console.log('🔄 Post-auth redirect to:', decodedReturnTo);

      // Clear any saved guest order state if we're returning to sell screen
      // (the state will be restored by the sell screen itself)
      if (decodedReturnTo.includes('/sell')) {
        console.log('📦 Returning to sell flow, guest order state will be restored');
      }

      destination = decodedReturnTo;
    }

    if (!hasShown) {
      // Navigate to notification permission screen first
      // After that, user will be redirected appropriately
      router.replace('/notification-permission');
    } else {
      // Navigate to destination (either returnTo path or home)
      router.replace(destination as any);
    }
  };

  // Handle Google auth success
  useEffect(() => {
    const handleAuthSuccess = async () => {
      if (authSuccess) {
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('notifications.languageChanged'),
        });

        await navigateAfterAuth();
      }
    };

    handleAuthSuccess();
  }, [authSuccess, t, returnTo]);

  // Handle Apple auth success (Requirements: 1.5)
  useEffect(() => {
    const handleAppleAuthSuccess = async () => {
      if (appleAuthSuccess) {
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('auth.appleSignInSuccess') || 'Signed in with Apple successfully',
        });

        await navigateAfterAuth();
      }
    };

    handleAppleAuthSuccess();
  }, [appleAuthSuccess, t, returnTo]);

  // Show account linking confirmation modal when pendingLinkEmail is set (Requirements: 4.2)
  useEffect(() => {
    if (pendingLinkEmail) {
      setShowLinkConfirmModal(true);
    }
  }, [pendingLinkEmail]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Improved email validation regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    if (!trimmedPassword) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (trimmedPassword.length < 6) {
      newErrors.password = t('auth.errors.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Prevent multiple submissions
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Trim inputs before sending
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      // Call API service
      await AuthService.login({ email: trimmedEmail, password: trimmedPassword });

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('notifications.languageChanged'),
      });

      // Navigate using shared helper (handles returnTo parameter)
      await navigateAfterAuth();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('notifications.languageChangeFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const success = await signInWithGoogle();
      // Navigation will be handled by useEffect when authSuccess changes
      // Error toast will be shown by the error useEffect below
    } catch (error: any) {
      console.error('Google login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: error.message || 'Unable to sign in. Please try again',
      });
    }
  };

  /**
   * Handle Apple Sign-In button press
   * Task 8.2: Implement handleAppleLogin function
   * Requirements: 1.1, 1.5, 7.1, 7.2, 7.3, 7.4
   */
  const handleAppleLogin = async () => {
    try {
      clearAppleError();
      const success = await signInWithApple();
      // Navigation will be handled by useEffect when appleAuthSuccess changes
      // If success is false and pendingLinkEmail is set, modal will show
      // Error toast will be shown by the error useEffect
    } catch (error: any) {
      console.error('Apple login error:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.signInFailed') || 'Sign In Failed',
        text2: error.message || t('auth.unableToSignIn') || 'Unable to sign in. Please try again',
      });
    }
  };

  /**
   * Handle account linking confirmation
   * Task 8.3: Implement account linking confirmation dialog
   * Requirements: 4.2
   */
  const handleConfirmLink = async (confirmed: boolean) => {
    setShowLinkConfirmModal(false);

    if (!confirmed) {
      // User declined linking
      await confirmAccountLink(false);
      return;
    }

    try {
      const success = await confirmAccountLink(true);
      // Navigation will be handled by useEffect when appleAuthSuccess changes
      if (!success) {
        Toast.show({
          type: 'error',
          text1: t('auth.linkingFailed') || 'Linking Failed',
          text2: t('auth.linkingFailedMessage') || 'Unable to link accounts. Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Account linking error:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.linkingFailed') || 'Linking Failed',
        text2: error.message || t('auth.linkingFailedMessage') || 'Unable to link accounts. Please try again.',
      });
    }
  };

  // Show Google error toast
  useEffect(() => {
    if (googleError) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: googleError,
      });
    }
  }, [googleError]);

  // Show Apple error toast (Requirements: 7.1, 7.2, 7.3, 7.4)
  useEffect(() => {
    if (appleError && appleErrorType) {
      // Don't show toast for cancelled - user intentionally cancelled
      if (appleErrorType === AppleAuthError.CANCELLED) {
        return;
      }
      // Don't show toast for link cancelled - handled by modal
      if (appleErrorType === AppleAuthError.LINK_CANCELLED) {
        Toast.show({
          type: 'info',
          text1: t('auth.linkingCancelled') || 'Linking Cancelled',
          text2: t('auth.linkingCancelledMessage') || 'You can create a new account instead',
        });
        return;
      }
      Toast.show({
        type: 'error',
        text1: t('auth.signInFailed') || 'Sign In Failed',
        text2: appleError,
      });
    }
  }, [appleError, appleErrorType, t]);

  const isAnyLoading = isLoading || isGoogleLoading || isAppleLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Green Gradient Header */}
          <LinearGradient
            colors={isDark ? ['#22c55e', '#16a34a', '#15803d'] : ['#16a34a', '#15803d', '#14532d']}
            style={styles.greenHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Texture Pattern */}
            <View
              style={styles.texturePattern}>
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

            {/* Header Content in Green Section */}
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
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/images/LogowithoutS.png')} style={styles.logoImage} resizeMode='contain' />
                <View style={styles.badge}>
                  <Sparkles size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>{t('auth.trustedBy')}</Text>
                </View>
              </View>

              <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>

            </Animated.View>
          </LinearGradient>
          {/* Login Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: errors.email ? colors.error : colors.inputBorder }]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                  <Mail size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.enterEmail')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase());
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isAnyLoading}
                />
              </View>
              {errors.email && (
                <View className='mt-1.5 ml-1'>
                  <Text style={styles.errorText}>⚠️ {errors.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: errors.password ? colors.error : colors.inputBorder }]}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                  <Lock size={20} color={colors.primary} />
                </View>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.enterPassword')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isAnyLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isAnyLoading}
                >
                  {showPassword ? (
                    <EyeOff size={22} color={colors.textSecondary} />
                  ) : (
                    <Eye size={22} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errors.password}</Text>
                </View>
              )}
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7} disabled={isAnyLoading}>
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>{t('auth.forgotPasswordLink')}</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.loginButton, isAnyLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isAnyLoading}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d', '#14532d']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>{t('auth.signIn')}</Text>
                    <ArrowRight size={22} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('auth.orContinueWith')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.googleButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isAnyLoading && styles.googleButtonDisabled
              ]}
              onPress={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : (
                <>
                  <Image
                    source={require('../../../assets/images/GoogleFavicon.png')}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>{t('auth.continueWithGoogle')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Continue with Phone Button - Task 16.1 */}
            {/* Requirements: 10.1 */}
            {/* TEMPORARILY HIDDEN: Phone authentication postponed - uncomment when ready to enable */}
            {/* <TouchableOpacity
                style={[
                  styles.phoneButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isAnyLoading && styles.phoneButtonDisabled
                ]}
                onPress={() => router.push('/(auth)/phone-login')}
                disabled={isAnyLoading}
              >
                <View style={[styles.phoneIconCircle, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                  <Phone size={20} color={colors.primary} />
                </View>
                <Text style={[styles.phoneButtonText, { color: colors.text }]}>{t('auth.continueWithPhone') || 'Continue with Phone'}</Text>
              </TouchableOpacity> */}

            {/* Apple Sign-In Button (iOS only) - Task 8.1 */}
            {/* Requirements: 6.1, 6.2, 6.3 */}
            {Platform.OS === 'ios' && isAppleAvailable && (
              <View style={styles.appleButtonContainer}>
                {isAppleLoading ? (
                  <View style={[styles.appleButtonLoading, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ActivityIndicator color={colors.textSecondary} size="small" />
                  </View>
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={isDark
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={spacing(14)}
                    style={styles.appleButton}
                    onPress={handleAppleLogin}
                  />
                )}
              </View>
            )}
          </Animated.View>

          {/* Footer + Trust Indicators wrapped together to ensure spacing */}
          <View style={{ paddingBottom: spacing(24), paddingHorizontal: spacing(24) }}>
            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('auth.dontHaveAccount')}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity disabled={isAnyLoading}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>{t('auth.signUpLink')}</Text>
                </TouchableOpacity>
              </Link>
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
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>{t('auth.secure')}</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: isDark ? '#16a34a' : '#bbf7d0' }]} />
              <View style={styles.trustItem}>
                <Zap size={18} color="#f59e0b" />
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>{t('auth.fastPayout')}</Text>
              </View>
              <View style={[styles.trustDivider, { backgroundColor: isDark ? '#16a34a' : '#bbf7d0' }]} />
              <View style={styles.trustItem}>
                <Sparkles size={18} color="#8b5cf6" />
                <Text style={[styles.trustText, { color: isDark ? '#86efac' : '#166534' }]}>{t('auth.bestRates')}</Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account Linking Confirmation Modal - Task 8.3 */}
      {/* Requirements: 4.2 */}
      <Modal
        visible={showLinkConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleConfirmLink(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => handleConfirmLink(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.modalIconContainer, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
              <LinkIcon size={32} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('auth.linkAccountTitle') || 'Link Your Account?'}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t('auth.linkAccountMessage', { email: pendingLinkEmail }) ||
                `An account with the email ${pendingLinkEmail} already exists. Would you like to link your Apple ID to this existing account?`}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonCancel, { borderColor: colors.border }]}
                onPress={() => handleConfirmLink(false)}
                disabled={isAppleLoading}
              >
                <Text style={[styles.modalButtonCancelText, { color: colors.textSecondary }]}>
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => handleConfirmLink(true)}
                disabled={isAppleLoading}
              >
                <LinearGradient
                  colors={['#16a34a', '#15803d', '#14532d']}
                  style={styles.modalButtonConfirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>
                      {t('auth.linkAccount') || 'Link Account'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Force Update Modal */}
      <ForceUpdateModal
        visible={showForceUpdate}
        updateUrl={updateUrl}
        minVersion={minVersion}
      />

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
    width: '100%',
    minHeight: hp(32),
    borderBottomLeftRadius: spacing(32),
    borderBottomRightRadius: spacing(32),
    overflow: 'hidden',
    marginBottom: spacing(16),
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(10),
  },
  headerInGreen: {
    paddingTop: hp(6),
    paddingBottom: spacing(8),
    alignItems: 'center',
    paddingHorizontal: spacing(20),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing(36),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(12),
    width: '100%',
  },
  logoImage: {
    width: wp(70),
    height: hp(10),
    marginBottom: spacing(8),
  },
  logoGlow: {
    display: 'none',
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
    fontSize: fs(26),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing(2),
    marginTop: spacing(2),
    textAlign: 'center',
    letterSpacing: -0.5,
    textDecorationLine: 'none',
    paddingHorizontal: spacing(20),
    lineHeight: fs(32),
  },
  subtitleText: {
    fontSize: fs(13),
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: fs(18),
    maxWidth: wp(85.3),
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: spacing(20),
    paddingHorizontal: spacing(24),
  },
  inputContainer: {
    marginBottom: spacing(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing(14),
    borderWidth: 1.5,
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(4),
    height: hp(6.5),
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
  iconCircle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
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
  eyeIcon: {
    padding: spacing(8),
  },
  errorContainer: {
    marginTop: spacing(6),
    marginLeft: spacing(4),
  },
  errorText: {
    fontSize: fs(13),
    color: '#dc2626',
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing(24),
    marginTop: spacing(-4),
  },
  forgotPasswordText: {
    fontSize: fs(14),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  loginButton: {
    borderRadius: spacing(14),
    height: hp(6.5),
    overflow: 'hidden',
    marginBottom: spacing(24),
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
  loginButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(10),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: fs(17),
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(20),
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fs(13),
    fontWeight: '600',
    paddingHorizontal: spacing(14),
    fontFamily: 'Inter-SemiBold',
  },
  googleButton: {
    borderRadius: spacing(14),
    height: hp(6.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(12),
    borderWidth: 1.5,
    marginBottom: spacing(12),
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
  googleIcon: {
    width: wp(6),
    height: wp(6),
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: fs(15),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  // Phone Sign-In Button Styles (Task 16.1)
  phoneButton: {
    borderRadius: spacing(14),
    height: hp(6.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(12),
    borderWidth: 1.5,
    marginBottom: spacing(12),
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
  phoneButtonDisabled: {
    opacity: 0.6,
  },
  phoneIconCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneButtonText: {
    fontSize: fs(15),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing(8),
    marginBottom: spacing(16),
  },
  footerText: {
    fontSize: fs(15),
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  footerLink: {
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
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
  // Apple Sign-In Button Styles (Task 8.1)
  appleButtonContainer: {
    marginBottom: spacing(12),
  },
  appleButton: {
    width: '100%',
    height: hp(6.5),
  },
  appleButtonLoading: {
    width: '100%',
    height: hp(6.5),
    borderRadius: spacing(14),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Account Linking Modal Styles (Task 8.3)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(24),
  },
  modalContent: {
    width: '100%',
    maxWidth: wp(90),
    borderRadius: spacing(20),
    padding: spacing(24),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing(16),
    right: spacing(16),
    padding: spacing(4),
  },
  modalIconContainer: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(16),
  },
  modalTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(12),
  },
  modalMessage: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: spacing(24),
    paddingHorizontal: spacing(8),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing(12),
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    height: hp(6),
    borderRadius: spacing(12),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    height: hp(6),
    borderRadius: spacing(12),
    overflow: 'hidden',
  },
  modalButtonConfirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#ffffff',
  },
});
