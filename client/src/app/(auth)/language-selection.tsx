import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Check } from 'lucide-react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { Language, SUPPORTED_LANGUAGES } from '../../localization/languages';

const { width, height } = Dimensions.get('window');

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { changeLanguage } = useLocalization();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnims = useRef(
    SUPPORTED_LANGUAGES.map(() => new Animated.Value(1))
  ).current;

  // Initialize animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Handle language option press
   * Updates selected language state with visual feedback
   */
  const handleLanguagePress = (languageCode: Language, index: number) => {
    // Animate the card selection
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedLanguage(languageCode);

    // Announce selection to screen readers
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    if (selectedLang) {
      AccessibilityInfo.announceForAccessibility(
        `${selectedLang.nativeName} selected. Tap Continue to proceed.`
      );
    }
  };

  /**
   * Handle Continue button press
   * Saves language preference and navigates to next screen
   */
  const handleContinue = async () => {
    if (!selectedLanguage || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Save language preference using LocalizationContext
      await changeLanguage(selectedLanguage);
      
      // Navigate to location permission screen (next in flow)
      router.replace('/(auth)/location-permission');
    } catch (error) {
      console.error('Error saving language:', error);
      // Error toast is already shown by changeLanguage in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Section */}
      <LinearGradient
        colors={['#16a34a', '#15803d', '#14532d']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        accessible={true}
        accessibilityRole="header"
      >
        <View style={styles.headerContent}>
          <View 
            style={styles.iconContainer}
            accessible={true}
            accessibilityLabel="Language selection icon"
          >
            <Globe size={48} color="#ffffff" strokeWidth={2} />
          </View>
          <Text 
            style={styles.title}
            accessible={true}
            accessibilityRole="header"
          >
            Choose a Language
          </Text>
          <Text 
            style={styles.subtitle}
            accessible={true}
          >
            Select your preferred language to continue
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Options */}
        <Animated.View 
          style={[
            styles.languageList,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {SUPPORTED_LANGUAGES.map((language, index) => {
            const isSelected = selectedLanguage === language.code;
            
            return (
              <Animated.View
                key={language.code}
                style={{
                  transform: [{ scale: scaleAnims[index] }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.languageCard,
                    isSelected && styles.languageCardSelected,
                  ]}
                  onPress={() => handleLanguagePress(language.code, index)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Select ${language.name}`}
                  accessibilityHint={`Tap to select ${language.nativeName} as your preferred language`}
                >
                {/* Language Icon */}
                <View style={[
                  styles.languageIconContainer,
                  isSelected && styles.languageIconContainerSelected,
                ]}>
                  <Text style={[
                    styles.languageIcon,
                    isSelected && styles.languageIconSelected,
                  ]}>
                    {language.icon}
                  </Text>
                </View>

                {/* Language Name */}
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    isSelected && styles.languageNameSelected,
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageSubtext,
                    isSelected && styles.languageSubtextSelected,
                  ]}>
                    {language.name}
                  </Text>
                </View>

                {/* Radio Button Indicator */}
                <View style={[
                  styles.radioButton,
                  isSelected && styles.radioButtonSelected,
                ]}>
                  {isSelected && (
                    <View style={styles.radioButtonInner}>
                      <Check size={16} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedLanguage || isSubmitting) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage || isSubmitting}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityHint="Tap to save your language preference and continue"
          accessibilityState={{ disabled: !selectedLanguage || isSubmitting }}
        >
          <LinearGradient
            colors={['#16a34a', '#15803d', '#14532d']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Helper Text */}
        {!selectedLanguage && (
          <Text 
            style={styles.helperText}
            accessible={true}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            Please select a language to continue
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 30,
  },
  languageList: {
    gap: 16,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 88,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  languageCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  languageIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  languageIconContainerSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  languageIcon: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6b7280',
  },
  languageIconSelected: {
    color: '#16a34a',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#166534',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageSubtextSelected: {
    color: '#16a34a',
  },
  radioButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioButtonSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#16a34a',
  },
  radioButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    marginTop: 32,
    borderRadius: 16,
    height: 56,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  continueButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});
