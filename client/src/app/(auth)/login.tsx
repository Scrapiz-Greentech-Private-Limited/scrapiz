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
} from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ScrapizLogo from '../../components/ScrapizLogo';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useLocalization } from '../../context/LocalizationContext';
import {wp, hp, fs, spacing} from '../../utils/responsive'
import {useTheme} from '../../context/ThemeContext.tsx';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLocalization();
   const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Google Auth Hook
  const { signInWithGoogle, isLoading: isGoogleLoading, error: googleError, authSuccess } = useGoogleAuth();

  // Refs for input navigation
  const passwordInputRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  // Handle Google auth success
  useEffect(() => {
    if (authSuccess) {
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('notifications.languageChanged'),
      });
      router.replace('/(tabs)/home');
    }
  }, [authSuccess, t]);

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
      
      router.replace('/(tabs)/home');
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
      await signInWithGoogle();
      // Navigation will be handled by useEffect when authSuccess changes
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // Show Google error toast
  useEffect(() => {
    if (googleError) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: googleError,
      });
    }
  }, [googleError, t]);

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.backgroundWrapper}>
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
                zIndex:1,
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
              {zIndex:1,
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
              {zIndex:10,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/images/LogowithoutS.png')} style={styles.logoImage} resizeMode='contain'/>
              <View style={styles.badge}>
                <Sparkles size={12} color="#ffffff" />
                <Text style={styles.badgeText}>{t('auth.trustedBy')}</Text>
              </View>
            </View>
            
            <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitleText}>
            Sell scrap, get cash — sign in!
            </Text>
          </Animated.View>
        </LinearGradient>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.scrollContent}>
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
                 <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }, errors.email && styles.inputError]}>
                  <View style={styles.iconCircle}>
                    <Mail size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder={t('auth.enterEmail')}
                    placeholderTextColor="#9ca3af"
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
                 <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }, errors.password && styles.inputError]}>
                  <View style={styles.iconCircle}>
                    <Lock size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor="#9ca3af"
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
                      <EyeOff size={22} color="#9ca3af" />
                    ) : (
                      <Eye size={22} color="#9ca3af" />
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
                  <Text style={styles.forgotPasswordText}>{t('auth.forgotPasswordLink')}</Text>
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
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, isAnyLoading && styles.googleButtonDisabled]}
                onPress={handleGoogleLogin}
                disabled={isAnyLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#6b7280" size="small" />
                ) : (
                  <>
                    <Image source={require('../../../assets/images/Gooogle Favicon.png')}
                    className='w-6 h-6 object-contain'/>
                    <Text className='text-[15px] font-bold text-gray-800'>{t('auth.continueWithGoogle')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              style={[
                styles.footer,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity disabled={isAnyLoading}>
                  <Text style={styles.footerLink}>{t('auth.signUpLink')}</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>

            {/* Trust Indicators */}
            <Animated.View 
              style={[
                styles.trustIndicators,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.trustItem}>
                <Shield size={18} color="#10b981" />
                <Text style={styles.trustText}>{t('auth.secure')}</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <Zap size={18} color="#f59e0b" />
                <Text style={styles.trustText}>{t('auth.fastPayout')}</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <Sparkles size={18} color="#8b5cf6" />
                <Text style={styles.trustText}>{t('auth.bestRates')}</Text>
              </View>
            </Animated.View>
          </View>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing(24),
    paddingTop: hp(36) + spacing(20),
    paddingBottom: spacing(30),
    justifyContent: 'space-between',
  },
  headerInGreen: {
    position: 'absolute',
    top: hp(7.4),
    left: 0,
    right: 0,
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
    marginBottom: spacing(16),
    width: '100%',
  },
  logoImage: {
    width: wp(80),
    height: hp(14.8),
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
    fontSize: fs(20),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing(8),
    marginTop: spacing(4),
    textAlign: 'center',
    letterSpacing: -0.4,
    textDecorationLine: 'none',
    paddingHorizontal: spacing(20),
    lineHeight: fs(26),
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
  },
  inputContainer: {
    marginBottom: spacing(14),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: spacing(16),
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
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
  iconCircle: {
    width: wp(10.1),
    height: wp(10.1),
    borderRadius: wp(5.05),
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(12),
  },
  input: {
    flex: 1,
    fontSize: fs(15),
    color: '#1f2937',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
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
    marginBottom: spacing(20),
  },
  forgotPasswordText: {
    fontSize: fs(14),
    color: '#16a34a',
    fontWeight: '700',
  },
  loginButton: {
    borderRadius: spacing(16),
    height: hp(6.9),
    overflow: 'hidden',
    marginBottom: spacing(18),
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
    marginBottom: spacing(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: fs(13),
    color: '#9ca3af',
    fontWeight: '600',
    paddingHorizontal: spacing(14),
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: spacing(16),
    height: hp(6.9),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(12),
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: spacing(16),
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
    width: fs(24),
    height: fs(24),
    resizeMode: 'contain',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(12),
  },
  footerText: {
    fontSize: fs(15),
    color: '#6b7280',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: fs(15),
    color: '#16a34a',
    fontWeight: '800',
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(10),
    backgroundColor: '#f0fdf4',
    borderRadius: spacing(14),
    gap: spacing(8),
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
    color: '#166534',
    fontWeight: '700',
    flexShrink: 1,
  },
  trustDivider: {
    width: 1,
    height: spacing(16),
    backgroundColor: '#bbf7d0',
  },
});
