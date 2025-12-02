import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { DeletionFeedback, DELETION_REASONS, DeletionReason } from '../types/account';
import { useTheme } from '../context/ThemeContext';

interface DeleteAccountFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: DeletionFeedback) => void;
  loading?: boolean;
}

export default function DeleteAccountFeedbackModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: DeleteAccountFeedbackModalProps) {
  const { colors, isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState<DeletionReason | null>(null);
  const [comments, setComments] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) {
      setShowError(true);
      return;
    }

    onSubmit({
      reason: selectedReason,
      comments: comments.trim() || undefined,
    });
  };

  const handleClose = () => {
    // Reset form state
    setSelectedReason(null);
    setComments('');
    setShowError(false);
    onClose();
  };

  const handleReasonSelect = (reason: DeletionReason) => {
    setSelectedReason(reason);
    if (showError) {
      setShowError(false);
    }
  };

  const remainingChars = 500 - comments.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.text }]}>We're sorry to see you go</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Help us improve by sharing why you're leaving
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={loading}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Reason Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Why did you decide to delete your account? *
                </Text>
                
                {DELETION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.radioOption,
                      {
                        backgroundColor: selectedReason === reason.value 
                          ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
                          : colors.surface,
                        borderColor: selectedReason === reason.value 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => handleReasonSelect(reason.value)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.radioButton,
                      { borderColor: selectedReason === reason.value ? colors.primary : colors.border }
                    ]}>
                      {selectedReason === reason.value && (
                        <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        {
                          color: selectedReason === reason.value ? colors.primary : colors.text,
                          fontWeight: selectedReason === reason.value ? '600' : '400',
                        }
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {showError && (
                  <View style={[
                    styles.errorContainer,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
                    }
                  ]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      Please select a reason for deletion
                    </Text>
                  </View>
                )}
              </View>

              {/* Comments Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Additional comments (optional)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    }
                  ]}
                  placeholder="Tell us more about your decision..."
                  placeholderTextColor={colors.inputPlaceholder}
                  value={comments}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setComments(text);
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  editable={!loading}
                />
                <Text
                  style={[
                    styles.charCounter,
                    {
                      color: remainingChars < 50 ? colors.warning : colors.textSecondary,
                      fontWeight: remainingChars < 50 ? '500' : '400',
                    }
                  ]}
                >
                  {remainingChars} characters remaining
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  {
                    backgroundColor: colors.error,
                    opacity: loading ? 0.6 : 1,
                  }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
    minHeight: 56,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    maxHeight: 180,
  },
  charCounter: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    // Dynamic background color applied inline
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
