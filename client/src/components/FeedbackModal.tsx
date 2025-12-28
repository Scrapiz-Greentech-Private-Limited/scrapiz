import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Star, ChevronRight, ChevronLeft, Send, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { FeedbackService, FeedbackQuestion, FeedbackResponseData } from '../api/apiService';

const { width, height } = Dimensions.get('window');

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  orderId?: number | null;
  context?: string;
  onSubmitSuccess?: () => void;
}

interface RatingCircleProps {
  value: number;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}

const RatingCircle: React.FC<RatingCircleProps> = ({ value, selected, onPress, colors, isDark }) => (
  <TouchableOpacity
    style={[
      styles.ratingCircle,
      { 
        backgroundColor: selected 
          ? colors.primary 
          : isDark ? '#374151' : '#f3f4f6',
        borderColor: selected ? colors.primary : colors.border,
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[
      styles.ratingText,
      { color: selected ? 'white' : colors.text }
    ]}>
      {value}
    </Text>
  </TouchableOpacity>
);

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  orderId,
  context = 'order_completion',
  onSubmitSuccess,
}) => {
  const { colors, isDark } = useTheme();
  
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, FeedbackResponseData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load questions when modal opens
  useEffect(() => {
    if (visible) {
      loadQuestions();
    } else {
      // Reset state when modal closes
      setCurrentStep(0);
      setResponses({});
      setError(null);
    }
  }, [visible, context]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedQuestions = await FeedbackService.getQuestions(context);
      setQuestions(fetchedQuestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
      // Use default questions as fallback
      setQuestions([
        {
          id: 1,
          question_text: 'How easy was it to use our app?',
          question_type: 'rating',
          context: 'order_completion',
          order: 1,
          is_required: true,
          placeholder_text: null,
          options: null,
        },
        {
          id: 2,
          question_text: 'What can we do better to enhance your experience?',
          question_type: 'text',
          context: 'order_completion',
          order: 2,
          is_required: false,
          placeholder_text: 'Share your suggestions with us...',
          options: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSelect = useCallback((questionId: number, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        rating_value: rating,
      }
    }));
  }, []);

  const handleTextChange = useCallback((questionId: number, text: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        text_value: text,
      }
    }));
  }, []);

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    // Validate required questions
    if (currentQuestion.is_required && !responses[currentQuestion.id]) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please answer this question to continue',
      });
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const currentQuestion = questions[currentStep];
    
    // Validate last question if required
    if (currentQuestion.is_required && !responses[currentQuestion.id]) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please answer this question to submit',
      });
      return;
    }

    setSubmitting(true);
    try {
      const responseArray = Object.values(responses).filter(r => 
        r.rating_value !== undefined || 
        (r.text_value && r.text_value.trim() !== '')
      );

      if (responseArray.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'No Feedback',
          text2: 'Please provide at least one response',
        });
        setSubmitting(false);
        return;
      }

      await FeedbackService.submitFeedback({
        order_id: orderId,
        context,
        responses: responseArray,
      });

      Toast.show({
        type: 'success',
        text1: 'Thank You! 🎉',
        text2: 'Your feedback helps us improve',
      });

      onSubmitSuccess?.();
      onClose();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to submit feedback',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
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

  const renderRatingQuestion = (question: FeedbackQuestion) => {
    const selectedRating = responses[question.id]?.rating_value;
    
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Star size={24} color={colors.primary} />
          <Text style={[styles.questionText, { color: colors.text }]}>
            {question.question_text}
          </Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((value) => (
            <RatingCircle
              key={value}
              value={value}
              selected={selectedRating === value}
              onPress={() => handleRatingSelect(question.id, value)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
        
        <View style={styles.ratingLabels}>
          <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
            Very Difficult
          </Text>
          <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
            Very Easy
          </Text>
        </View>
        
        {selectedRating && (
          <View style={[styles.selectedFeedback, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}>
            <Text style={[styles.selectedFeedbackText, { color: colors.primary }]}>
              {selectedRating === 1 && '😟 We\'ll work on improving!'}
              {selectedRating === 2 && '😐 Thanks for the feedback'}
              {selectedRating === 3 && '🙂 Good to know!'}
              {selectedRating === 4 && '😊 Great to hear!'}
              {selectedRating === 5 && '🎉 Awesome! Thank you!'}
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
          <MessageSquare size={24} color={colors.primary} />
          <Text style={[styles.questionText, { color: colors.text }]}>
            {question.question_text}
          </Text>
        </View>
        
        <TextInput
          style={[
            styles.textInput,
            { 
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              borderColor: colors.border,
              color: colors.text,
            }
          ]}
          placeholder={question.placeholder_text || 'Type your feedback here...'}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={textValue}
          onChangeText={(text) => handleTextChange(question.id, text)}
          textAlignVertical="top"
        />
        
        <Text style={[styles.charCount, { color: colors.textSecondary }]}>
          {textValue.length}/500
        </Text>
      </View>
    );
  };

  const isLastStep = currentStep === questions.length - 1;
  const currentQuestion = questions[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Share Your Feedback
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Help us improve your experience
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
              onPress={handleSkip}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading questions...
                </Text>
              </View>
            ) : questions.length > 0 ? (
              <>
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                  {questions.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: index <= currentStep 
                            ? colors.primary 
                            : isDark ? '#374151' : '#e5e7eb',
                        }
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  Step {currentStep + 1} of {questions.length}
                </Text>

                {/* Question */}
                {currentQuestion && renderQuestion(currentQuestion)}
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error || 'No questions available'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {!loading && questions.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.skipButton]}
                onPress={handleSkip}
              >
                <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                  Skip
                </Text>
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
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          {isLastStep ? 'Submit' : 'Next'}
                        </Text>
                        {isLastStep ? (
                          <Send size={18} color="white" />
                        ) : (
                          <ChevronRight size={18} color="white" />
                        )}
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
    maxHeight: height * 0.75,
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
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
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
    fontSize: 18,
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
    color: 'white',
  },
});

export default FeedbackModal;
