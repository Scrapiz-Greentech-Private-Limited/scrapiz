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
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>We're sorry to see you go</Text>
                <Text style={styles.subtitle}>
                  Help us improve by sharing why you're leaving
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={loading}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Reason Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Why did you decide to delete your account? *
                </Text>
                
                {DELETION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.radioOption,
                      selectedReason === reason.value && styles.radioOptionSelected,
                    ]}
                    onPress={() => handleReasonSelect(reason.value)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioButton}>
                      {selectedReason === reason.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        selectedReason === reason.value && styles.radioLabelSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {showError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      Please select a reason for deletion
                    </Text>
                  </View>
                )}
              </View>

              {/* Comments Section */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Additional comments (optional)
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tell us more about your decision..."
                  placeholderTextColor="#9ca3af"
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
                    remainingChars < 50 && styles.charCounterWarning,
                  ]}
                >
                  {remainingChars} characters remaining
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
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
    backgroundColor: '#ffffff',
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
    borderBottomColor: '#f3f4f6',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    minHeight: 56,
  },
  radioOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
  },
  radioLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  radioLabelSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
    maxHeight: 180,
  },
  charCounter: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'right',
  },
  charCounterWarning: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#dc2626',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
