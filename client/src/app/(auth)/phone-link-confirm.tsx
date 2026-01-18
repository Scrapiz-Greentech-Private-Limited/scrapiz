import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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
  Link as LinkIcon,
  Mail,
  X,
  CheckCircle,
  AlertTriangle,
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
 * Phone Link Confirmation Screen Component
 * 
 * Implements Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6:
 * - Display explanation about existing account
 * - Display existing account's auth provider (email/Google/Apple)
 * - Show "Link Account" button
 * - Show "Cancel" button
 * - Call /phone/confirm-link/ with confirmed=true on Link Account
 * - Call /phone/confirm-link/ with confirmed=false on Cancel
 * 
 * @see .kiro/specs/phone-otp-authentication/design.md
 */
export default function PhoneLinkConfirmScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  const { setAuthenticatedState } = useAuth();
  
  // Phone auth store
  const { 
    phoneNumber, 
    firebaseUid,
    existingEmail,
    existingAuthProvider,
    handleLinkSuccess,
    handleLinkCancelled,
    setError,
  } = usePhoneAuthStore();

  // Local state
  const [isLinking, setIsLinking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
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

  /**
   * Get display name for auth provider
   * Requirement 13.2: Display existing account's authentication provider
   * 
   * @param provider - Auth provider string from backend
   * @returns Human-readable provider name
   */
  const getProviderDisplayName = (provider: string | null): string => {
    if (!provider) return t('auth.phoneLinkConfirm.emailPassword') || 'Email/Password';
    
    switch (provider.toLowerCase()) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'email':
      case 'password':
        return t('auth.phoneLinkConfirm.emailPassword') || 'Email/Password';
      default:
        return provider;
    }
  };

  /**
   * Get icon for auth provider
   * 
   * @param provider - Auth provider string
   * @returns Icon component or null
   */
  const getProviderIcon = (provider: string | null) => {
    if (!provider) return <Mail size={20} color={colors.primary} />;
    
    switch (provider.toLowerCase()) {
      case 'google':
        return (
          <Image 
            source={require('../../../assets/images/GoogleFavicon.png')}
            style={styles.providerIconImage}
          />
        );
      case 'apple':
        return <Text style={styles.appleIcon}></Text>;
      default:
        return <Mail size={20} color={colors.primary} />;
    }
  };

  /**
   * Handle Link Account button press
   * Requirement 13.5: Call /phone/confirm-link/ with confirmed=true
   */
  const handleLinkAccount = async () => {
    if (!phoneNumber || !firebaseUid || !existingEmail) {
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: t('auth.errors.sessionExpired') || 'Session expired. Please try again.',
      });
      router.replace('/(auth)/phone-login');
      return;
    }

    setIsLinking(true);

    try {
      const response = await AuthService.phoneConfirmLink({
        confirmed: true,
        email: existingEmail,
        phone_number: phoneNumber,
        firebase_uid: firebaseUid,
      });

      // Check if linking was successful (has jwt and user)
      if ('jwt' in response && response.jwt && 'user' in response && response.user) {
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
          text2: t('auth.phoneLinkConfirm.linkSuccess') || 'Account linked successfully!',
        });
        
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Account linking error:', err);
      setError(err.message || 'Account linking failed');
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: err.message || t('auth.phoneLinkConfirm.linkFailed') || 'Account linking failed',
      });
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Handle Cancel button press
   * Requirement 13.6: Call /phone/confirm-link/ with confirmed=false
   */
  const handleCancel = async () => {
    if (!phoneNumber || !firebaseUid || !existingEmail) {
      // If session data is missing, just go back to profile screen
      handleLinkCancelled();
      router.replace('/(auth)/phone-profile');
      return;
    }

    setIsCancelling(true);

    try {
      await AuthService.phoneConfirmLink({
        confirmed: false,
        email: existingEmail,
        phone_number: phoneNumber,
        firebase_uid: firebaseUid,
      });

      // Update store state
      handleLinkCancelled();
      
      Toast.show({
        type: 'info',
        text1: t('auth.phoneLinkConfirm.linkCancelled') || 'Linking Cancelled',
        text2: t('auth.phoneLinkConfirm.tryDifferentEmail') || 'You can try with a different email.',
      });
      
      // Navigate back to profile screen to try different email
      router.replace('/(auth)/phone-profile');
    } catch (err: any) {
      console.error('Cancel linking error:', err);
      // Even if the API call fails, we should still allow the user to go back
      handleLinkCancelled();
      router.replace('/(auth)/phone-profile');
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handle back button press
   */
  const handleBack = () => {
    handleCancel();
  };

  const isAnyLoading = isLinking || isCancelling;

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
              disabled={isAnyLoading}
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
              {t('auth.phoneLinkConfirm.title') || 'Link Your Account'}
            </Text>
          </Animated.View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Alert Icon */}
            <View style={[styles.alertIconContainer, { backgroundColor: isDark ? '#422006' : '#fef3c7' }]}>
              <AlertTriangle size={32} color="#f59e0b" />
            </View>

            {/* Explanation Text - Requirement 13.1 */}
            <Text style={[styles.explanationTitle, { color: colors.text }]}>
              {t('auth.phoneLinkConfirm.accountExists') || 'Account Already Exists'}
            </Text>
            
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
              {t('auth.phoneLinkConfirm.explanation') || 
                'An account with this email already exists. Would you like to link your phone number to this existing account?'}
            </Text>

            {/* Existing Account Info Card */}
            <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.accountCardHeader}>
                <View style={[styles.accountIconContainer, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                  <Mail size={24} color={colors.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
                    {t('auth.phoneLinkConfirm.existingAccount') || 'Existing Account'}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.text }]}>
                    {existingEmail || 'user@example.com'}
                  </Text>
                </View>
              </View>
              
              {/* Auth Provider Info - Requirement 13.2 */}
              <View style={[styles.providerRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>
                  {t('auth.phoneLinkConfirm.signedInWith') || 'Signed in with'}
                </Text>
                <View style={styles.providerBadge}>
                  {getProviderIcon(existingAuthProvider)}
                  <Text style={[styles.providerName, { color: colors.text }]}>
                    {getProviderDisplayName(existingAuthProvider)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Phone Number Being Linked */}
            <View style={[styles.phoneCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary }]}>
              <View style={styles.phoneCardContent}>
                <LinkIcon size={20} color={colors.primary} />
                <Text style={[styles.phoneCardText, { color: colors.text }]}>
                  {t('auth.phoneLinkConfirm.phoneToLink') || 'Phone number to link:'}
                </Text>
              </View>
              <Text style={[styles.phoneNumber, { color: colors.primary }]}>
                {phoneNumber || '+91 XXXXXXXXXX'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* Link Account Button - Requirement 13.3, 13.5 */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.linkButton, isAnyLoading && styles.buttonDisabled]}
                onPress={handleLinkAccount}
                disabled={isAnyLoading}
              >
                <LinearGradient
                  colors={isAnyLoading 
                    ? ['#9ca3af', '#6b7280', '#4b5563'] 
                    : ['#16a34a', '#15803d', '#14532d']
                  }
                  style={styles.linkButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLinking ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.linkButtonText}>
                        {t('auth.phoneLinkConfirm.linking') || 'Linking...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={22} color="white" />
                      <Text style={styles.linkButtonText}>
                        {t('auth.phoneLinkConfirm.linkAccount') || 'Link Account'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button - Requirement 13.4, 13.6 */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.cancelButton, 
                  { borderColor: colors.border },
                  isAnyLoading && styles.buttonDisabled
                ]}
                onPress={handleCancel}
                disabled={isAnyLoading}
              >
                {isCancelling ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : (
                  <>
                    <X size={20} color={colors.textSecondary} />
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                      {t('auth.phoneLinkConfirm.cancel') || 'Cancel'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              {t('auth.phoneLinkConfirm.helpText') || 
                'If you cancel, you can go back and try with a different email address.'}
            </Text>
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
  contentContainer: {
    marginBottom: spacing(20),
  },
  alertIconContainer: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing(16),
  },
  explanationTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(12),
  },
  explanationText: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: spacing(24),
    paddingHorizontal: spacing(8),
  },
  accountCard: {
    borderRadius: spacing(16),
    borderWidth: 1,
    overflow: 'hidden',
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
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(16),
  },
  accountIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(12),
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: fs(12),
    fontWeight: '500',
    marginBottom: spacing(4),
  },
  accountEmail: {
    fontSize: fs(15),
    fontWeight: '600',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderTopWidth: 1,
  },
  providerLabel: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  providerIconImage: {
    width: wp(5),
    height: wp(5),
  },
  appleIcon: {
    fontSize: fs(20),
    color: '#000000',
  },
  providerName: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  phoneCard: {
    borderRadius: spacing(12),
    borderWidth: 1.5,
    padding: spacing(16),
    marginBottom: spacing(24),
  },
  phoneCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    marginBottom: spacing(8),
  },
  phoneCardText: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  phoneNumber: {
    fontSize: fs(18),
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: spacing(28),
  },
  buttonContainer: {
    gap: spacing(12),
    marginBottom: spacing(16),
  },
  linkButton: {
    borderRadius: spacing(16),
    height: hp(6.9),
    overflow: 'hidden',
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
  linkButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(10),
  },
  linkButtonText: {
    fontSize: fs(17),
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  cancelButton: {
    borderRadius: spacing(16),
    height: hp(6.9),
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
  },
  cancelButtonText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpText: {
    fontSize: fs(13),
    textAlign: 'center',
    lineHeight: fs(20),
    paddingHorizontal: spacing(16),
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
