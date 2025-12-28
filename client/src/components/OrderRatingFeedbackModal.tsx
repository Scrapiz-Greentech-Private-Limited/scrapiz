import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { X, Check, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { RatingTag, RatingSubmission } from '../types/rating';
import { RatingService } from '../api/apiService';

/**
 * Tag configuration with display labels
 * Maps RatingTag enum values to user-friendly display text
 */
const RATING_TAGS: { value: RatingTag; label: string; labelKey: string }[] = [
  { value: 'POLITE', label: 'Agent was polite', labelKey: 'orderRating.tags.polite' },
  { value: 'ACCURATE_WEIGHT', label: 'Accurate weight', labelKey: 'orderRating.tags.accurateWeight' },
  { value: 'ON_TIME', label: 'On time', labelKey: 'orderRating.tags.onTime' },
  { value: 'GOOD_PRICE', label: 'Good Price', labelKey: 'orderRating.tags.goodPrice' },
  { value: 'PROFESSIONAL', label: 'Smooth experience', labelKey: 'orderRating.tags.smoothExperience' },
];

interface OrderRatingFeedbackModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The order ID being rated */
  orderId: number;
  /** The agent's name to display in the title */
  agentName: string;
  /** The star rating selected by the user (1-5) */
  rating: number;
  /** Callback when rating is successfully submitted */
  onSubmitSuccess?: () => void;
}

/**
 * OrderRatingFeedbackModal Component
 * 
 * A modal for collecting detailed feedback after a user selects a star rating.
 * Displays selectable tag chips and an optional text input for additional feedback.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5
 * - 5.1: Display "How was your experience with [Agent_Name]?" as the title
 * - 5.2: Display selectable tags for feedback
 * - 5.3: Include optional text input for additional feedback
 * - 5.5: Display success confirmation and close modal on successful submission
 */
export default function OrderRatingFeedbackModal({
  visible,
  onClose,
  orderId,
  agentName,
  rating,
  onSubmitSuccess,
}: OrderRatingFeedbackModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  const [selectedTags, setSelectedTags] = useState<RatingTag[]>([]);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Reset form state when modal closes
   */
  const resetForm = useCallback(() => {
    setSelectedTags([]);
    setFeedback('');
  }, []);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  /**
   * Toggle tag selection
   * Adds tag if not selected, removes if already selected
   */
  const handleTagToggle = useCallback((tag: RatingTag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  }, []);

  /**
   * Handle feedback submission
   * Submits rating, tags, and optional feedback to the API
   */
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const submissionData: RatingSubmission = {
        order_id: orderId,
        rating,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        feedback: feedback.trim() || undefined,
      };

      await RatingService.submitRating(submissionData);

      Toast.show({
        type: 'success',
        text1: t('orderRating.thankYou', { defaultValue: 'Thank You! 🎉' }),
        text2: t('orderRating.feedbackReceived', { defaultValue: 'Your feedback helps us improve' }),
      });

      resetForm();
      onSubmitSuccess?.();
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error', { defaultValue: 'Error' }),
        text2: error.message || t('orderRating.submitError', { defaultValue: 'Failed to submit rating' }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Render a single tag chip
   */
  const renderTagChip = (tag: { value: RatingTag; label: string; labelKey: string }) => {
    const isSelected = selectedTags.includes(tag.value);
    
    return (
      <TouchableOpacity
        key={tag.value}
        style={[
          styles.tagChip,
          {
            backgroundColor: isSelected
              ? (isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7')
              : (isDark ? '#374151' : '#f3f4f6'),
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleTagToggle(tag.value)}
        activeOpacity={0.7}
        accessibilityLabel={tag.label}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        {isSelected && (
          <Check size={16} color={colors.primary} style={styles.tagCheckIcon} />
        )}
        <Text
          style={[
            styles.tagText,
            {
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {t(tag.labelKey, { defaultValue: tag.label })}
        </Text>
      </TouchableOpacity>
    );
  };

  const remainingChars = 500 - feedback.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground || colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('orderRating.modalTitle', { 
                    defaultValue: 'How was your experience with {{agentName}}?',
                    agentName 
                  })}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('orderRating.selectTags', { defaultValue: 'Select all that apply' })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={submitting}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Rating Display */}
              <View style={styles.ratingDisplay}>
                <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                  {t('orderRating.yourRating', { defaultValue: 'Your rating' })}
                </Text>
                <View style={styles.starsDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={styles.starEmoji}>
                      {star <= rating ? '⭐' : '☆'}
                    </Text>
                  ))}
                </View>
              </View>

              {/* Tag Selection */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  {t('orderRating.whatWentWell', { defaultValue: 'What went well?' })}
                </Text>
                <View style={styles.tagsContainer}>
                  {RATING_TAGS.map(renderTagChip)}
                </View>
              </View>

              {/* Feedback Text Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  {t('orderRating.additionalFeedback', { defaultValue: 'Additional feedback (optional)' })}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBackground || (isDark ? '#1f2937' : '#f9fafb'),
                      borderColor: colors.inputBorder || colors.border,
                      color: colors.inputText || colors.text,
                    },
                  ]}
                  placeholder={t('orderRating.feedbackPlaceholder', { 
                    defaultValue: 'Tell us more about your experience...' 
                  })}
                  placeholderTextColor={colors.inputPlaceholder || colors.textSecondary}
                  value={feedback}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setFeedback(text);
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  editable={!submitting}
                />
                <Text
                  style={[
                    styles.charCounter,
                    {
                      color: remainingChars < 50 ? colors.warning || '#f59e0b' : colors.textSecondary,
                      fontWeight: remainingChars < 50 ? '500' : '400',
                    },
                  ]}
                >
                  {remainingChars} {t('common.charactersRemaining', { defaultValue: 'characters remaining' })}
                </Text>
              </View>
            </ScrollView>

            {/* Footer with Submit Button */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { opacity: submitting ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {t('common.submit', { defaultValue: 'Submit' })}
                      </Text>
                      <Send size={18} color="white" />
                    </>
                  )}
                </LinearGradient>
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
    maxHeight: '85%',
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
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
  ratingDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 4,
  },
  starEmoji: {
    fontSize: 24,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagCheckIcon: {
    marginRight: 6,
  },
  tagText: {
    fontSize: 14,
    lineHeight: 18,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    maxHeight: 150,
    lineHeight: 22,
  },
  charCounter: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
