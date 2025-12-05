import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  I18nManager,
} from 'react-native';
import Svg, { Defs, Rect, Mask, Circle, RoundedRect } from 'react-native-svg';
import { useTutorialStore } from '@/src/store/tutorialStore';
import { useTheme } from '@/src/context/ThemeContext';
import { useLocalization } from '@/src/context/LocalizationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback colors if theme context is unavailable
const FALLBACK_COLORS = {
  card: '#ffffff',
  border: '#e5e7eb',
  shadow: '#000000',
  primary: '#16a34a',
  text: '#111827',
  textSecondary: '#6b7280',
};

const TutorialOverlay: React.FC = () => {
  const {
    isActive,
    currentStepIndex,
    steps,
    nextStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  // Use theme with fallback
  let colors = FALLBACK_COLORS;
  let isDark = false;
  
  try {
    const theme = useTheme();
    colors = theme.colors || FALLBACK_COLORS;
    isDark = theme.isDark || false;
  } catch (error) {
    console.warn('Theme context unavailable, using fallback colors:', error);
  }

  // Use localization with fallback
  let t = (key: string) => key;
  let isRTL = false;
  
  try {
    const localization = useLocalization();
    t = localization.t;
    isRTL = I18nManager.isRTL;
  } catch (error) {
    console.warn('Localization context unavailable, using fallback:', error);
  }
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Animate in when tutorial becomes active
  useEffect(() => {
    if (isActive && steps.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [isActive, currentStepIndex]);

  if (!isActive || steps.length === 0) {
    return null;
  }

  // Validate current step index
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
    console.error('Invalid step index:', currentStepIndex);
    return null;
  }

  const currentStep = steps[currentStepIndex];
  
  // Validate current step
  if (!currentStep || typeof currentStep !== 'object') {
    console.error('Invalid current step:', currentStep);
    return null;
  }
  
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Calculate spotlight properties
  const targetElement = currentStep.targetElement;
  
  // Validate target element if present
  let hasSpotlight = false;
  let spotlightX = 0;
  let spotlightY = 0;
  let spotlightWidth = 0;
  let spotlightHeight = 0;
  let spotlightRadius = 0;

  if (targetElement) {
    // Validate target element has required properties
    if (
      typeof targetElement.x === 'number' &&
      typeof targetElement.y === 'number' &&
      typeof targetElement.width === 'number' &&
      typeof targetElement.height === 'number' &&
      targetElement.width > 0 &&
      targetElement.height > 0
    ) {
      hasSpotlight = true;
      spotlightX = targetElement.x;
      spotlightY = targetElement.y;
      spotlightWidth = targetElement.width;
      spotlightHeight = targetElement.height;
      
      // Calculate spotlight radius (use custom or auto-calculate)
      // Add padding around the element
      spotlightRadius = currentStep.spotlightRadius || 
        Math.max(spotlightWidth, spotlightHeight) / 2 + 30;
    } else {
      console.warn('Invalid target element dimensions, skipping spotlight:', targetElement);
    }
  }

  // Calculate card position (below spotlight if present, otherwise centered)
  // Improved positioning to avoid overlapping with highlighted elements
  const cardTop = hasSpotlight && targetElement
    ? (() => {
        const belowSpotlight = spotlightY + spotlightHeight + 30;
        const aboveSpotlight = spotlightY - 280;
        
        // If there's enough space below, place it there
        if (belowSpotlight + 250 < SCREEN_HEIGHT) {
          return belowSpotlight;
        }
        // If there's enough space above, place it there
        else if (aboveSpotlight > 0) {
          return Math.max(20, aboveSpotlight);
        }
        // Otherwise, place at bottom with some padding
        else {
          return SCREEN_HEIGHT - 270;
        }
      })()
    : SCREEN_HEIGHT / 2 - 125;

  // Handle tap on spotlight area (advance to next step)
  const handleSpotlightTap = () => {
    if (hasSpotlight) {
      if (isLastStep) {
        completeTutorial();
      } else {
        nextStep();
      }
    }
  };

  // Handle next button
  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  // Overlay color based on theme - smooth transparent blur effect
  const overlayColor = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(30, 41, 59, 0.65)';

  return (
    <Modal
      transparent
      visible={isActive}
      animationType="none"
      statusBarTranslucent
      onRequestClose={skipTutorial}
      accessible={true}
      accessibilityLabel="Tutorial overlay"
      accessibilityViewIsModal={true}
    >
      <View 
        style={styles.container}
        accessible={false}
        pointerEvents="box-none"
      >
        {/* Smooth transparent overlay with spotlight cutout */}
        {hasSpotlight && targetElement ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Svg 
              width={SCREEN_WIDTH} 
              height={SCREEN_HEIGHT}
              accessible={false}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <Mask id="spotlight-mask">
                  {/* White rectangle covers entire screen */}
                  <Rect
                    x="0"
                    y="0"
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT}
                    fill="white"
                  />
                  {/* Black rounded rectangle creates the spotlight cutout */}
                  <Rect
                    x={Math.max(0, spotlightX - 15)}
                    y={Math.max(0, spotlightY - 15)}
                    width={Math.min(SCREEN_WIDTH - Math.max(0, spotlightX - 15), spotlightWidth + 30)}
                    height={spotlightHeight + 30}
                    rx={16}
                    ry={16}
                    fill="black"
                  />
                </Mask>
              </Defs>
              {/* Apply mask to create spotlight effect */}
              <Rect
                x="0"
                y="0"
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                fill={overlayColor}
                mask="url(#spotlight-mask)"
              />
            </Svg>
            {/* Invisible touchable area for spotlight interaction */}
            <TouchableWithoutFeedback 
              onPress={handleSpotlightTap}
              accessible={true}
              accessibilityLabel={`Tap highlighted area to advance to ${isLastStep ? 'finish tutorial' : 'next step'}`}
              accessibilityRole="button"
              accessibilityHint="Double tap to proceed to the next tutorial step"
            >
              <View 
                style={{
                  position: 'absolute',
                  left: Math.max(0, spotlightX - 20),
                  top: Math.max(0, spotlightY - 20),
                  width: Math.min(SCREEN_WIDTH - Math.max(0, spotlightX - 20), spotlightWidth + 40),
                  height: spotlightHeight + 40,
                }}
              />
            </TouchableWithoutFeedback>
          </View>
        ) : (
          // Full overlay without spotlight
          <View 
            style={[styles.fullOverlay, { backgroundColor: overlayColor }]}
            accessible={false}
          />
        )}

        {/* Tutorial Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              top: cardTop,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessible={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            accessible={true}
            accessibilityLabel={`Tutorial step ${currentStepIndex + 1} of ${totalSteps}: ${currentStep.title}. ${currentStep.description}`}
            accessibilityRole="alert"
          >
            {/* Step Indicator */}
            <View 
              style={styles.stepIndicatorContainer}
              accessible={true}
              accessibilityLabel={`Step ${currentStepIndex + 1} of ${totalSteps}`}
              accessibilityRole="text"
            >
              <Text
                style={[
                  styles.stepIndicator,
                  { color: colors.primary },
                ]}
                accessible={false}
              >
                {t('tutorial.ui.stepIndicator', { current: currentStepIndex + 1, total: totalSteps })}
              </Text>
            </View>

            {/* Title */}
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
              accessible={true}
              accessibilityLabel={currentStep.title}
              accessibilityRole="header"
            >
              {currentStep.title}
            </Text>

            {/* Description */}
            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
              accessible={true}
              accessibilityLabel={currentStep.description}
              accessibilityRole="text"
            >
              {currentStep.description}
            </Text>

            {/* Buttons */}
            <View 
              style={[
                styles.buttonContainer,
                isRTL && styles.buttonContainerRTL,
              ]}
              accessible={false}
            >
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  { borderColor: colors.border },
                ]}
                onPress={skipTutorial}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={t('tutorial.ui.skip')}
                accessibilityRole="button"
                accessibilityHint="Double tap to exit the tutorial and return to normal app usage"
              >
                <Text
                  style={[
                    styles.skipButtonText,
                    { color: colors.textSecondary },
                  ]}
                  accessible={false}
                >
                  {t('tutorial.ui.skip')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel={isLastStep ? t('tutorial.ui.finish') : t('tutorial.ui.next')}
                accessibilityRole="button"
                accessibilityHint={isLastStep ? 'Double tap to complete the tutorial' : 'Double tap to advance to the next tutorial step'}
              >
                <Text 
                  style={styles.nextButtonText}
                  accessible={false}
                >
                  {isLastStep ? t('tutorial.ui.finish') : t('tutorial.ui.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  cardContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    pointerEvents: 'auto',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  stepIndicatorContainer: {
    marginBottom: 12,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  skipButton: {
    flex: 1,
    minHeight: 44, // Minimum touch target size for accessibility
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    minHeight: 44, // Minimum touch target size for accessibility
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TutorialOverlay;
