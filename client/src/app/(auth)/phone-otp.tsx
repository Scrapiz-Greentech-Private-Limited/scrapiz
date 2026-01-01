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
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { usePhoneAuthStore } from '../../store/phoneAuthStore';
import { usePhoneAuth } from '../../hooks/usePhoneAuth';
import { useLocalization } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { AuthService } from '../../api/apiService';
import Toast from 'react-native-toast-message';

const StepIndicator = ({ currentStep = 2 }: { currentStep?: number }) => {
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

export default function PhoneOtpScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  const { setAuthenticatedState } = useAuth();
  
  const { 
    phoneNumber, 
    handleAuthSuccess, 
    handleProfileRequired, 
    setError,
  } = usePhoneAuthStore();
  
  const { 
    verifyOtp, 
    resendOtp, 
    isLoading, 
    error, 
    clearError,
    resendCountdown,
  } = usePhoneAuth();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: error,
      });
    }
  }, [error, t]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    clearError();
    
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = (): boolean => {
    return otp.every(digit => digit !== '');
  };

  const getOtpString = (): string => {
    return otp.join('');
  };

  const handleVerify = async () => {
    if (!isOtpComplete()) {
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: t('auth.errors.otpRequired') || 'Please enter the complete OTP',
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const idToken = await verifyOtp(getOtpString());
      
      if (!idToken) {
        setIsVerifying(false);
        return;
      }
      
      const response = await AuthService.phoneVerify(idToken);
      
      if ('profile_required' in response && response.profile_required) {
        handleProfileRequired(response.phone_number, response.firebase_uid);
        router.replace('/(auth)/phone-profile');
      } else if ('jwt' in response && response.jwt && response.user) {
        handleAuthSuccess(response.user);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const isStored = await AuthService.isAuthenticated();
        if (!isStored) {
          console.warn('JWT was not stored properly');
          throw new Error('Failed to store authentication token');
        }
        
        setAuthenticatedState(true);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Phone verify error:', err);
      setError(err.message || 'Verification failed');
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: err.message || 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    setOtp(['', '', '', '', '', '']);
    
    const success = await resendOtp();
    
    if (success) {
      Toast.show({
        type: 'success',
        text1: t('common.success') || 'Success',
        text2: t('auth.phoneOtp.otpResent') || 'OTP sent successfully',
      });
      inputRefs.current[0]?.focus();
    }
  };

  const formatPhoneForDisplay = (phone: string | null): string => {
    if (!phone) return '';
    return phone;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#374151' : '#ffffff' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <StepIndicator currentStep={2} />

          <Text style={[styles.title, { color: isDark ? colors.text : '#000000' }]}>
            {t('auth.phoneOtp.title') || 'Enter OTP Verification code.'}
          </Text>

          <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {t('auth.phoneOtp.instruction') || 'Verification code has been sent to'}
          </Text>

          <Text style={[styles.phoneNumber, { color: isDark ? colors.text : '#000000' }]}>
            {formatPhoneForDisplay(phoneNumber)}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View 
                key={index}
                style={[
                  styles.otpInputWrapper,
                  { 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: digit 
                      ? (isDark ? colors.text : '#000000') 
                      : (isDark ? '#4b5563' : '#d1d5db'),
                  }
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[styles.otpInput, { color: isDark ? colors.text : '#000000' }]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading && !isVerifying}
                />
              </View>
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {t('auth.phoneOtp.didntReceive') || "Didn't receive the code?"}{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendCountdown > 0 || isLoading || isVerifying}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.resendLink, 
                { color: isDark ? colors.text : '#000000' }
              ]}>
                {resendCountdown > 0 
                  ? `${t('auth.phoneOtp.resend') || 'Resend'} (${resendCountdown}s)`
                  : t('auth.phoneOtp.resend') || 'Resend'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomButton}>
          <TouchableOpacity
            style={[
              styles.nextBtn,
              {
                backgroundColor: isOtpComplete() && !isLoading && !isVerifying
                  ? (isDark ? '#ffffff' : '#1f2937')
                  : (isDark ? '#4b5563' : '#9ca3af'),
              },
            ]}
            onPress={handleVerify}
            disabled={!isOtpComplete() || isLoading || isVerifying}
            activeOpacity={0.8}
          >
            {isLoading || isVerifying ? (
              <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} size="small" />
            ) : (
              <Text style={[styles.nextBtnText, { color: isDark ? '#000000' : '#ffffff' }]}>
                {t('common.next') || 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    marginBottom: spacing(4),
  },
  phoneNumber: {
    fontSize: fs(16),
    fontWeight: '600',
    marginBottom: spacing(32),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing(10),
    marginBottom: spacing(24),
  },
  otpInputWrapper: {
    width: wp(12),
    height: wp(14),
    borderRadius: spacing(10),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: fs(22),
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(8),
  },
  resendText: {
    fontSize: fs(14),
  },
  resendLink: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  bottomButton: {
    paddingHorizontal: spacing(24),
    paddingBottom: Platform.OS === 'ios' ? hp(5) : spacing(24),
  },
  nextBtn: {
    height: hp(6.5),
    borderRadius: spacing(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
});
