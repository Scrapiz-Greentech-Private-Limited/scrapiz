import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { X, Lock, Mail, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { AuthService } from '../api/apiService';
import Toast from 'react-native-toast-message';

type Step = 'request' | 'verify' | 'newPassword' | 'success';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function ChangePasswordModal({ visible, onClose, userEmail }: ChangePasswordModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  
  const [step, setStep] = useState<Step>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      resetState();
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const resetState = () => {
    setStep('request');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResendTimer(0);
    setIsLoading(false);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      resetState();
      onClose();
    });
  };

  const handleRequestOtp = async () => {
    setIsLoading(true);
    try {
      await AuthService.passwordResetRequest(userEmail);
      setStep('verify');
      setResendTimer(60);
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Check your email for the verification code' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await AuthService.passwordResetRequest(userEmail);
      setResendTimer(60);
      Toast.show({ type: 'success', text1: 'OTP Resent', text2: 'A new code has been sent to your email' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to resend OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      if (pastedOtp.length === 6) {
        otpInputRefs.current[5]?.blur();
      }
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter all 6 digits' });
      return;
    }
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.passwordReset({
        email: userEmail,
        otp: otp.join(''),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep('success');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to reset password' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['request', 'verify', 'newPassword'].map((s, i) => (
        <View key={s} style={styles.stepRow}>
          <View style={[
            styles.stepDot,
            { backgroundColor: step === s || ['verify', 'newPassword', 'success'].indexOf(step) > i - 1 
              ? colors.primary 
              : colors.border 
            }
          ]} />
          {i < 2 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: ['verify', 'newPassword', 'success'].indexOf(step) > i 
                ? colors.primary 
                : colors.border 
              }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderRequestStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }]}>
        <Lock size={32} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Change Password</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        We'll send a verification code to your email to confirm it's you.
      </Text>
      
      <View style={[styles.emailBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Mail size={20} color={colors.textSecondary} />
        <Text style={[styles.emailText, { color: colors.text }]}>{userEmail}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleRequestOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('request')}>
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>
      
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }]}>
        <Mail size={32} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Enter Verification Code</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Enter the 6-digit code sent to {userEmail}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (otpInputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              { 
                backgroundColor: colors.surface, 
                borderColor: digit ? colors.primary : colors.border,
                color: colors.text 
              }
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
        onPress={handleResendOtp}
        disabled={resendTimer > 0 || isLoading}
      >
        <Text style={[styles.resendText, { color: resendTimer > 0 ? colors.textTertiary : colors.primary }]}>
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }, otp.join('').length !== 6 && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={otp.join('').length !== 6}
      >
        <Text style={styles.primaryButtonText}>Verify Code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewPasswordStep = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('verify')}>
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }]}>
        <Lock size={32} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Create New Password</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Your new password must be at least 8 characters long.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
        <View style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Lock size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.passwordTextInput, { color: colors.text }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
            {showNewPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
        <View style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Lock size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.passwordTextInput, { color: colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleResetPassword}
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContent}>
      <View style={[styles.successIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }]}>
        <CheckCircle size={48} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Password Updated!</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Your password has been changed successfully. You can now use your new password to log in.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleClose}
      >
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={handleClose}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step !== 'success' && renderStepIndicator()}

          <ScrollView 
            style={styles.modalBody} 
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'request' && renderRequestStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'newPassword' && renderNewPasswordStep()}
            {step === 'success' && renderSuccessStep()}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      <Toast />
    </Modal>
  );
}


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 480,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: 4,
  },
  modalBody: {
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: 24,
    paddingBottom: 48,
  },
  stepContent: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
    gap: 12,
  },
  emailText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
