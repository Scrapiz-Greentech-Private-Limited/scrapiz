import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

interface InlineStarRatingProps {
  /** Callback when a rating is selected */
  onRatingSelect: (rating: number) => void;
  /** Initial rating value (optional) */
  initialRating?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom label text (optional) */
  label?: string;
  /** Size of the stars (optional, default: 32) */
  starSize?: number;
}

/**
 * InlineStarRating Component
 * A 5-star rating component for order feedback.
 * Displays stars that can be tapped to select a rating.
 * 
 * Requirements: 4.1, 4.2
 * - 4.1: Display inline star rating with "Rate your experience" label
 * - 4.2: Tap to select rating with visual highlight
 */
export default function InlineStarRating({
  onRatingSelect,
  initialRating = 0,
  disabled = false,
  label,
  starSize = 32,
}: InlineStarRatingProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  const [selectedRating, setSelectedRating] = useState<number>(initialRating);
  const [scaleValues] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );

  /**
   * Handle star press with animation
   * Per requirement 4.2: Highlight selected star and all stars before it
   */
  const handleStarPress = useCallback((rating: number) => {
    if (disabled) return;

    // Animate the pressed star
    Animated.sequence([
      Animated.timing(scaleValues[rating - 1], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[rating - 1], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedRating(rating);
    onRatingSelect(rating);
  }, [disabled, onRatingSelect, scaleValues]);

  /**
   * Render a single star
   * Filled if index < selectedRating, outlined otherwise
   */
  const renderStar = (index: number) => {
    const starNumber = index + 1;
    const isFilled = starNumber <= selectedRating;
    
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(starNumber)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isFilled }}
        style={styles.starTouchable}
      >
        <Animated.View
          style={[
            styles.starContainer,
            { transform: [{ scale: scaleValues[index] }] },
          ]}
        >
          <Star
            size={starSize}
            color={isFilled ? '#FBBF24' : colors.border}
            fill={isFilled ? '#FBBF24' : 'transparent'}
            strokeWidth={1.5}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          disabled && styles.labelDisabled,
        ]}
      >
        {label || t('orderRating.rateYourExperience', { defaultValue: 'Rate your experience' })}
      </Text>
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, index) => renderStar(index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  labelDisabled: {
    opacity: 0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starTouchable: {
    padding: 4,
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
