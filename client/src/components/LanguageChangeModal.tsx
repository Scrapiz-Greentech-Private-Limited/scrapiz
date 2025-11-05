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
  onClose,
  onLanguageChange,
}: LanguageChangeModalProps) {
  const { t } = useLocalization();
  
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
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>{t('languageSelection.title')}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
                disabled={isLoading}
                accessibilityLabel="Close language selection"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without saving changes"
              >
                <X size={24} color="#6b7280" />
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
                        isSelected && styles.languageOptionSelected,
                      ]}
                      onPress={() => handleLanguageSelect(language.code)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Select ${language.name}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageIcon}>{language.icon}</Text>
                        <Text
                          style={[
                            styles.languageNativeName,
                            isSelected && styles.languageNativeNameSelected,
                          ]}
                        >
                          {language.nativeName}
                        </Text>
                      </View>
                      <View style={styles.radioButton}>
                        {isSelected && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without changing language"
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.applyButton,
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    minHeight: 64,
  },
  languageOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  languageNativeName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
  },
  languageNativeNameSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
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
  applyButton: {
    backgroundColor: '#16a34a',
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
