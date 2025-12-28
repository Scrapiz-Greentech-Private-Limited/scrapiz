import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RatingToastProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** The agent's name to display in the message */
  agentName: string;
  /** Callback when user taps "Rate Now" */
  onRateNow: () => void;
  /** Callback when user taps "Later" */
  onLater: () => void;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * RatingToast Component
 * 
 * A toast notification that prompts users to rate their pickup experience.
 * Displays the agent name and provides "Rate Now" and "Later" options.
 * 
 * Requirements: 3.1, 3.2, 3.4
 * - 3.1: Display rating toast when user has unrated completed order
 * - 3.2: Display message "How was your Scrapiz pickup experience with [Agent_Name]?"
 * - 3.4: Navigate to order details on "Rate Now" tap
 */
export default function RatingToast({
  visible,
  agentName,
  onRateNow,
  onLater,
  onDismiss,
}: RatingToastProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) {
    return null;
  }

  const handleRateNow = () => {
    onRateNow();
  };

  const handleLater = () => {
    onLater();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#1f2937', '#111827'] : ['#ffffff', '#f9fafb']}
        style={[
          styles.toastContent,
          {
            borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.2)',
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss rating toast"
          accessibilityRole="button"
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Icon and Message */}
        <View style={styles.contentRow}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7' }
          ]}>
            <Star size={24} color={isDark ? '#4ade80' : '#16a34a'} fill={isDark ? '#4ade80' : '#16a34a'} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: colors.text }]}>
              {t('orderRating.toastMessage', {
                defaultValue: 'How was your Scrapiz pickup experience with {{agentName}}?',
                agentName,
              })}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.laterButton,
              {
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                borderColor: colors.border,
              },
            ]}
            onPress={handleLater}
            activeOpacity={0.7}
            accessibilityLabel="Rate later"
            accessibilityRole="button"
          >
            <Text style={[styles.laterButtonText, { color: colors.textSecondary }]}>
              {t('orderRating.later', { defaultValue: 'Later' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rateNowButton}
            onPress={handleRateNow}
            activeOpacity={0.8}
            accessibilityLabel="Rate now"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
              style={styles.rateNowGradient}
            >
              <Text style={styles.rateNowButtonText}>
                {t('orderRating.rateNow', { defaultValue: 'Rate Now' })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toastContent: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateNowButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rateNowGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
