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
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import {
  Check,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { usePhoneAuthStore } from '../../store/phoneAuthStore';
import { usePhoneAuth } from '../../hooks/usePhoneAuth';
import { useLocalization } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import Toast from 'react-native-toast-message';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
];

const StepIndicator = ({ currentStep = 1 }: { currentStep?: number }) => {
  const { colors, isDark } = useTheme();
  const borderColor = isDark ? '#6b7280' : '#374151';
  const activeColor = isDark ? colors.text : '#000000';
  
  return (
    <View style={styles.stepContainer}>
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <View
            style={[
              styles.stepCircle,
              {
                borderColor: step <= currentStep ? activeColor : borderColor,
                backgroundColor: 'transparent',
              },
            ]}
          >
            {step <= currentStep && (
              <Check size={16} color={activeColor} strokeWidth={2.5} />
            )}
          </View>
          {index < 2 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step < currentStep ? activeColor : borderColor },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  
  const { setPhoneNumber, startPhoneLogin } = usePhoneAuthStore();
  const { sendOtp, isLoading, error, errorType, clearError, isQuotaOrRateLimitError } = usePhoneAuth();
  
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumberLocal] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const phoneInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startPhoneLogin();
  }, [startPhoneLogin]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (error) {
      if (isQuotaOrRateLimitError) {
        setShowFallbackUI(true);
        Toast.show({
          type: 'error',
          text1: t('common.error') || 'Error',
          text2: t('auth.phoneLogin.quotaExceeded') || 'Something went wrong. Try again with Google or manual sign in.',
          visibilityTime: 5000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('common.error') || 'Error',
          text2: error,
        });
      }
    }
  }, [error, isQuotaOrRateLimitError, t]);

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (selectedCountry.code === '+91') {
      return digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly);
    }
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const isButtonEnabled = (): boolean => {
    return validatePhoneNumber(phoneNumber) && !isLoading;
  };

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    setPhoneNumberLocal(digitsOnly);
    setValidationError(null);
    clearError();
  };

  const formatPhoneDisplay = (phone: string): string => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  };

  const handleNextPress = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setValidationError(t('auth.errors.invalidPhone') || 'Please enter a valid phone number');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSendOtp = async () => {
    setShowConfirmModal(false);
    const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;
    setPhoneNumber(fullPhoneNumber);
    const success = await sendOtp(fullPhoneNumber);
    if (success) {
      router.push('/(auth)/phone-otp');
    }
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setValidationError(null);
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#374151' : '#6b7280' }]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <StepIndicator currentStep={1} />

          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth.phoneLogin.title') || 'Enter your phone number.'}
          </Text>

          <Text style={[styles.subtitle, { color: isDark ? '#d1d5db' : '#e5e7eb' }]}>
            {t('auth.phoneLogin.instruction') || 'Please enter your phone number to using Device Care+ services'}
          </Text>

          <Text style={[styles.inputLabel, { color: isDark ? '#9ca3af' : '#d1d5db' }]}>
            {t('auth.phoneLogin.phoneLabel') || 'Phone number'}
          </Text>

          <View
            style={[
              styles.phoneInputContainer,
              {
                backgroundColor: isDark ? '#1f2937' : '#4b5563',
                borderColor: validationError ? colors.error : (isDark ? '#4b5563' : '#6b7280'),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.countryCodeSection}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={[styles.countryCode, { color: colors.text }]}>
                {selectedCountry.code}
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.inputDivider, { backgroundColor: isDark ? '#4b5563' : '#6b7280' }]} />

            <TextInput
              ref={phoneInputRef}
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder={t('auth.phoneLogin.placeholder') || '812 345 678'}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={formatPhoneDisplay(phoneNumber)}
              onChangeText={(text) => handlePhoneChange(text.replace(/\s/g, ''))}
              keyboardType="phone-pad"
              maxLength={14}
              autoFocus
              editable={!isLoading}
            />
          </View>

          {validationError && (
            <Text style={styles.errorText}>⚠️ {validationError}</Text>
          )}

          {showCountryPicker && (
            <View
              style={[
                styles.countryDropdown,
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              {COUNTRY_CODES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    selectedCountry.code === country.code && {
                      backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                    },
                  ]}
                  onPress={() => handleCountrySelect(country)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[styles.countryName, { color: isDark ? colors.text : '#000' }]}>
                    {country.country}
                  </Text>
                  <Text style={[styles.countryCodeOption, { color: isDark ? colors.textSecondary : '#6b7280' }]}>
                    {country.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showFallbackUI && (
            <View
              style={[
                styles.fallbackContainer,
                {
                  backgroundColor: isDark ? '#451a03' : '#fef3c7',
                  borderColor: isDark ? '#f59e0b' : '#fbbf24',
                },
              ]}
            >
              <View style={styles.fallbackHeader}>
                <AlertTriangle size={18} color="#f59e0b" />
                <Text style={[styles.fallbackTitle, { color: isDark ? '#fcd34d' : '#92400e' }]}>
                  {t('auth.phoneLogin.fallbackTitle') || 'Something went wrong'}
                </Text>
              </View>
              <Text style={[styles.fallbackMessage, { color: isDark ? '#fde68a' : '#a16207' }]}>
                {t('auth.phoneLogin.fallbackMessage') ||
                  'Phone verification is temporarily unavailable. Please try signing in with Google or email instead.'}
              </Text>
              <TouchableOpacity
                style={[styles.fallbackButton, { borderColor: colors.primary }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.fallbackButtonText, { color: colors.primary }]}>
                  {t('auth.phoneLogin.tryGoogleOrEmail') || 'Try Google or Email'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { borderColor: isDark ? '#9ca3af' : '#ffffff' },
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { color: isDark ? '#ffffff' : '#ffffff' }]}>
              {t('common.back') || 'Back'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextBtn,
              {
                backgroundColor: isButtonEnabled() 
                  ? (isDark ? '#ffffff' : '#1f2937') 
                  : (isDark ? '#4b5563' : '#9ca3af'),
              },
            ]}
            onPress={handleNextPress}
            disabled={!isButtonEnabled()}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} size="small" />
            ) : (
              <Text style={[styles.nextBtnText, { color: isDark ? '#000000' : '#ffffff' }]}>
                {t('common.next') || 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowConfirmModal(false)}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {t('auth.phoneLogin.confirmTitle') || 'Do you want to continue?'}
            </Text>

            <Text style={styles.modalSubtitle}>
              {t('auth.phoneLogin.confirmMessage') ||
                "We will send the authentication code to the phone number you've entered:"}
            </Text>

            <Text style={styles.modalPhone}>
              ({selectedCountry.code}) {formatPhoneDisplay(phoneNumber)}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalNextBtn}
                onPress={handleConfirmSendOtp}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalNextText}>{t('common.next') || 'Next'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(24),
    paddingTop: Platform.OS === 'ios' ? hp(10) : hp(8),
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(48),
  },
  stepCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stepLine: {
    width: wp(10),
    height: 2,
    marginHorizontal: spacing(2),
  },
  title: {
    fontSize: fs(28),
    fontWeight: '600',
    marginBottom: spacing(16),
  },
  subtitle: {
    fontSize: fs(14),
    lineHeight: fs(20),
    marginBottom: spacing(32),
  },
  inputLabel: {
    fontSize: fs(13),
    fontWeight: '400',
    marginBottom: spacing(10),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing(12),
    borderWidth: 1,
    height: hp(7),
    paddingHorizontal: spacing(16),
  },
  countryCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    paddingRight: spacing(12),
  },
  countryCode: {
    fontSize: fs(16),
    fontWeight: '500',
  },
  inputDivider: {
    width: 1,
    height: '50%',
    marginRight: spacing(12),
  },
  phoneInput: {
    flex: 1,
    fontSize: fs(16),
    fontWeight: '400',
  },
  errorText: {
    fontSize: fs(13),
    color: '#ef4444',
    fontWeight: '500',
    marginTop: spacing(8),
  },
  countryDropdown: {
    position: 'absolute',
    top: hp(32),
    left: spacing(24),
    width: wp(55),
    borderRadius: spacing(12),
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 100,
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
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    gap: spacing(10),
  },
  countryFlag: {
    fontSize: fs(18),
  },
  countryName: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: '500',
  },
  countryCodeOption: {
    fontSize: fs(13),
    fontWeight: '600',
  },
  fallbackContainer: {
    marginTop: spacing(24),
    padding: spacing(16),
    borderRadius: spacing(12),
    borderWidth: 1,
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    marginBottom: spacing(8),
  },
  fallbackTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  fallbackMessage: {
    fontSize: fs(13),
    lineHeight: fs(18),
    marginBottom: spacing(12),
  },
  fallbackButton: {
    paddingVertical: spacing(10),
    borderRadius: spacing(8),
    borderWidth: 1.5,
    alignItems: 'center',
  },
  fallbackButtonText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing(24),
    paddingBottom: Platform.OS === 'ios' ? hp(5) : spacing(24),
    gap: spacing(12),
  },
  backBtn: {
    flex: 1,
    height: hp(6.5),
    borderRadius: spacing(12),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backBtnText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    height: hp(6.5),
    borderRadius: spacing(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: spacing(24),
    borderTopRightRadius: spacing(24),
    paddingHorizontal: spacing(24),
    paddingTop: spacing(12),
    paddingBottom: Platform.OS === 'ios' ? hp(5) : spacing(24),
  },
  modalHandle: {
    width: wp(10),
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: spacing(24),
  },
  modalTitle: {
    fontSize: fs(22),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing(12),
    color: '#000000',
  },
  modalSubtitle: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: spacing(16),
    color: '#6b7280',
  },
  modalPhone: {
    fontSize: fs(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(28),
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing(12),
  },
  modalCancelBtn: {
    flex: 1,
    height: hp(6.5),
    borderRadius: spacing(12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalCancelText: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#000000',
  },
  modalNextBtn: {
    flex: 1,
    height: hp(6.5),
    borderRadius: spacing(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  modalNextText: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#ffffff',
  },
});
