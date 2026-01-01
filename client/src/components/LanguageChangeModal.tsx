import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Language, LanguageOption, SUPPORTED_LANGUAGES } from '../localization/languages';
import { useLocalization } from '../context/LocalizationContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Props for the LanguageChangeModal component
 */
interface LanguageChangeModalProps {
  visible: boolean;
  currentLanguage: Language;
  onClose: () => void;
  onLanguageChange: (language: Language) => void;
}

/**
 * LanguageChangeModal Component
 * Modal for changing the app language from profile settings
 * Displays all supported languages with radio button selection
 */
export default function LanguageChangeModal({
  visible,
  currentLanguage,
  onClose,languageInfo,
  onLanguageChange
}: LanguageChangeModalProps) {
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  
  // State for selected language (initialized with current language)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  
  // State for loading during language change
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update selected language when currentLanguage prop changes
  React.useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  /**
   * Handle language option press
   * Updates the selected language state with visual feedback
   */
  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  /**
   * Handle Cancel button press
   * Closes the modal without saving changes
   * Resets selected language to current language
   */
  const handleCancel = () => {
    setSelectedLanguage(currentLanguage);
    setIsLoading(false);
    onClose();
  };

  /**
   * Handle Apply button press
   * Saves the selected language and closes the modal
   * Calls onLanguageChange callback with the selected language
   */
  const handleApply = async () => {
    // If no change, just close the modal
    if (selectedLanguage === currentLanguage) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      
      // Call the onLanguageChange callback
      await onLanguageChange(selectedLanguage);
      
      // Close the modal on success
      onClose();
    } catch (error) {
      console.error('[LanguageChangeModal] Error applying language change:', error);
      // Reset to current language on error
      setSelectedLanguage(currentLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{t('languageSelection.title')}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
                disabled={isLoading}
                accessibilityLabel="Close language selection"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without saving changes"
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Language Options */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.languageList}>
                {SUPPORTED_LANGUAGES.map((language: LanguageOption) => {
                  const isSelected = selectedLanguage === language.code;
                  
                  return (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.languageOption,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: colors.primary },
                      ]}
                      onPress={() => handleLanguageSelect(language.code)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Select ${language.name}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View style={styles.languageInfo}>
                        <View style={[styles.languageIconContainer]}>
                          <Text style={styles.languageIcon ,{ color: isSelected ? colors.primary : colors.text }}>{language.icon}</Text>
                        </View>
                        <Text
                          style={[
                            styles.languageNativeName,
                            { color: colors.text },
                            isSelected && { color: colors.primary, fontWeight: '600' },
                          ]}
                        >
                          {language.nativeName}
                        </Text>
                      </View>
                      <View style={[styles.radioButton, { borderColor: isSelected ? colors.primary : colors.border }]}>
                        {isSelected && (
                          <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleCancel}
                disabled={isLoading}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without changing language"
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.applyButton,
                  { backgroundColor: colors.primary },
                  isLoading && styles.applyButtonDisabled,
                ]}
                onPress={handleApply}
                disabled={isLoading}
                accessibilityLabel="Apply language change"
                accessibilityRole="button"
                accessibilityHint="Saves the selected language and closes the modal"
              >
                <Text style={styles.applyButtonText}>
                  {isLoading ? t('common.loading') : t('common.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  languageList: {
    paddingVertical: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    minHeight: 64,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIconContainer: {
    width: 48,
    height: 48,
    //borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  languageIcon: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '500'
  },
  languageNativeName: {
    fontSize: 18,
    fontWeight: '500',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
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
  applyButton: {
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
