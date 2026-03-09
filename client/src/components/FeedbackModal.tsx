import React, { useState, useEffect, useCallback } from 'react';
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
  Linking,
  useWindowDimensions,
} from 'react-native';
import { X, Star, ChevronRight, ChevronLeft, Send, MessageSquare, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { FeedbackService, FeedbackQuestion, FeedbackResponseData } from '../api/apiService';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.scrapiz.app';
const MAX_TEXT_LENGTH = 500;

const DEFAULT_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 1,
    question_text: 'How would you rate your experience with Scrapiz?',
    question_type: 'rating',
    context: 'order_completion',
    order: 1,
    is_required: true,
    placeholder_text: null,
    options: null,
  },
  {
    id: 2,
    question_text: 'What can we improve to make your experience better?',
    question_type: 'text',
    context: 'order_completion',
    order: 2,
    is_required: false,
    placeholder_text: 'Share your suggestions with us...',
    options: null,
  },
];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  orderId?: number | null;
  context?: string;
  onSubmitSuccess?: () => void;
}

const RATING_EMOJI: Record<number, string> = {
  1: '😟',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🎉',
};

const RATING_LABELS: Record<number, string> = {
  1: "We'll work on improving!",
  2: 'Thanks for the feedback',
  3: 'Good to know!',
  4: 'Great to hear!',
  5: 'Awesome! Thank you!',
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  orderId,
  context = 'order_completion',
  onSubmitSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, FeedbackResponseData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPlayStorePrompt, setShowPlayStorePrompt] = useState(false);

  useEffect(() => {
    if (visible) {
      loadQuestions();
    } else {
      setCurrentStep(0);
      setResponses({});
      setShowPlayStorePrompt(false);
    }
  }, [visible, context]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const fetched = await FeedbackService.getQuestions(context);
      setQuestions(fetched.length > 0 ? fetched : DEFAULT_QUESTIONS);
    } catch {
      setQuestions(DEFAULT_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSelect = useCallback((questionId: number, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { question_id: questionId, rating_value: rating },
    }));
  }, []);

  const handleTextChange = useCallback((questionId: number, text: string) => {
    const sanitized = text.slice(0, MAX_TEXT_LENGTH);
    setResponses(prev => ({
      ...prev,
      [questionId]: { question_id: questionId, text_value: sanitized },
    }));
  }, []);

  const handleNext = () => {
    const q = questions[currentStep];
    if (q.is_required && !responses[q.id]) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please answer this question to continue' });
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const q = questions[currentStep];
    if (q.is_required && !responses[q.id]) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please answer this question to submit' });
      return;
    }

    setSubmitting(true);
    try {
      const responseArray = Object.values(responses).filter(
        r => r.rating_value !== undefined || (r.text_value && r.text_value.trim() !== '')
      );

      if (responseArray.length === 0) {
        Toast.show({ type: 'error', text1: 'No Feedback', text2: 'Please provide at least one response' });
        setSubmitting(false);
        return;
      }

      await FeedbackService.submitFeedback({ order_id: orderId, context, responses: responseArray });

      // Check if user gave a high rating — prompt for Play Store review
      const hasHighRating = responseArray.some(r => r.rating_value && r.rating_value >= 4);
      if (hasHighRating) {
        setShowPlayStorePrompt(true);
      } else {
        Toast.show({ type: 'success', text1: 'Thank You! 🎉', text2: 'Your feedback helps us improve' });
        onSubmitSuccess?.();
        onClose();
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to submit feedback' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPlayStore = async () => {
    try {
      await Linking.openURL(PLAY_STORE_URL);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open Play Store' });
    } finally {
      Toast.show({ type: 'success', text1: 'Thank You! 🎉', text2: 'Your support means a lot' });
      onSubmitSuccess?.();
      onClose();
    }
  };

  const handleSkipPlayStore = () => {
    Toast.show({ type: 'success', text1: 'Thank You! 🎉', text2: 'Your feedback helps us improve' });
    onSubmitSuccess?.();
    onClose();
  };

  const renderRatingQuestion = (question: FeedbackQuestion) => {
    const selected = responses[question.id]?.rating_value;
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Star size={22} color={colors.primary} />
          <Text style={[styles.questionText, { color: colors.text }]}>{question.question_text}</Text>
        </View>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(val => (
            <TouchableOpacity
              key={val}
              style={[
                styles.ratingCircle,
                {
                  backgroundColor: selected === val ? colors.primary : isDark ? '#374151' : '#f3f4f6',
                  borderColor: selected === val ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleRatingSelect(question.id, val)}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratingText, { color: selected === val ? '#fff' : colors.text }]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingLabels}>
          <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>Poor</Text>
          <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>Excellent</Text>
        </View>

        {selected != null && (
          <View style={[styles.selectedFeedback, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#f0fdf4' }]}>
            <Text style={[styles.selectedFeedbackText, { color: colors.primary }]}>
              {RATING_EMOJI[selected]} {RATING_LABELS[selected]}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTextQuestion = (question: FeedbackQuestion) => {
    const textValue = responses[question.id]?.text_value || '';
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <MessageSquare size={22} color={colors.primary} />
          <Text style={[styles.questionText, { color: colors.text }]}>{question.question_text}</Text>
        </View>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border, color: colors.text },
          ]}
          placeholder={question.placeholder_text || 'Type your feedback here...'}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={MAX_TEXT_LENGTH}
          value={textValue}
          onChangeText={text => handleTextChange(question.id, text)}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
          {textValue.length}/{MAX_TEXT_LENGTH}
        </Text>
      </View>
    );
  };

  const renderQuestion = (question: FeedbackQuestion) => {
    switch (question.question_type) {
      case 'rating':
        return renderRatingQuestion(question);
      case 'text':
        return renderTextQuestion(question);
      default:
        return null;
    }
  };

  // Play Store rating prompt shown after high-rating feedback submission
  const renderPlayStorePrompt = () => (
    <View style={styles.playStoreContainer}>
      <View style={[styles.playStoreIcon, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#f0fdf4' }]}>
        <Star size={32} color={colors.primary} />
      </View>
      <Text style={[styles.playStoreTitle, { color: colors.text }]}>Glad you love Scrapiz!</Text>
      <Text style={[styles.playStoreSubtitle, { color: colors.textSecondary }]}>
        Would you mind rating us on the Play Store? It really helps us grow!
      </Text>
      <TouchableOpacity style={styles.playStoreButton} onPress={handleOpenPlayStore} activeOpacity={0.8}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.playStoreButtonGradient}>
          <ExternalLink size={18} color="#fff" />
          <Text style={styles.playStoreButtonText}>Rate on Play Store</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipPlayStore} onPress={handleSkipPlayStore}>
        <Text style={[styles.skipPlayStoreText, { color: colors.textSecondary }]}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );

  const isLastStep = currentStep === questions.length - 1;
  const currentQuestion = questions[currentStep];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, maxHeight: screenHeight * 0.78 }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Share Your Feedback</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Help us improve your experience
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
              onPress={onClose}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading questions...
                </Text>
              </View>
            ) : showPlayStorePrompt ? (
              renderPlayStorePrompt()
            ) : questions.length > 0 && currentQuestion ? (
              <>
                {/* Step dots */}
                {questions.length > 1 && (
                  <>
                    <View style={styles.stepIndicator}>
                      {questions.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.stepDot,
                            { backgroundColor: i <= currentStep ? colors.primary : isDark ? '#374151' : '#e5e7eb' },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                      Step {currentStep + 1} of {questions.length}
                    </Text>
                  </>
                )}
                {renderQuestion(currentQuestion)}
              </>
            ) : (
              <View style={styles.centeredContainer}>
                <MessageSquare size={32} color={colors.textSecondary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  No questions available right now
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {!loading && !showPlayStorePrompt && questions.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
              <View style={styles.navigationButtons}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[styles.navButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                    onPress={handlePrevious}
                  >
                    <ChevronLeft size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={isLastStep ? handleSubmit : handleNext}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                    style={styles.primaryButtonGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>{isLastStep ? 'Submit' : 'Next'}</Text>
                        {isLastStep ? <Send size={18} color="#fff" /> : <ChevronRight size={18} color="#fff" />}
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    flexShrink: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
    fontSize: 14,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ratingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 12,
  },
  selectedFeedback: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  selectedFeedbackText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Play Store prompt
  playStoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  playStoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  playStoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  playStoreSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  playStoreButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  playStoreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  playStoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  skipPlayStore: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipPlayStoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FeedbackModal;
