import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Shuffle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import {
  AVATAR_STYLES,
  generateAvatarUrl,
  generateRandomSeed,
} from '../utils/avatarUtils';

/**
 * Props for the AvatarSelectorModal component
 */
interface AvatarSelectorModalProps {
  visible: boolean;
  currentStyle: string | null;
  currentSeed: string | null;
  onClose: () => void;
  onSave: (style: string, seed: string) => Promise<void>;
}

/**
 * AvatarSelectorModal Component
 * Modal for selecting and customizing DiceBear avatars.
 * Displays a grid of avatar styles with previews and allows randomization.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
export default function AvatarSelectorModal({
  visible,
  currentStyle,
  currentSeed,
  onClose,
  onSave,
}: AvatarSelectorModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  // State for selected style and seed
  const [selectedStyle, setSelectedStyle] = useState<string>(
    currentStyle || AVATAR_STYLES[0].id
  );
  const [seed, setSeed] = useState<string>(currentSeed || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize seed when modal opens
  useEffect(() => {
    const initializeSeed = async () => {
      if (visible) {
        setIsInitializing(true);
        setSelectedStyle(currentStyle || AVATAR_STYLES[0].id);

        if (currentSeed) {
          setSeed(currentSeed);
        } else {
          // Generate a new seed if none exists
          const newSeed = await generateRandomSeed();
          setSeed(newSeed);
        }
        setIsInitializing(false);
      }
    };

    initializeSeed();
  }, [visible, currentStyle, currentSeed]);


  /**
   * Handle style selection
   * Updates the selected style and triggers preview update
   * Requirements: 3.3
   */
  const handleStyleSelect = useCallback((styleId: string) => {
    setSelectedStyle(styleId);
  }, []);

  /**
   * Handle randomize button press
   * Generates a new random seed and updates the preview
   * Requirements: 3.4, 3.5
   */
  const handleRandomize = useCallback(async () => {
    const newSeed = await generateRandomSeed();
    setSeed(newSeed);
  }, []);

  /**
   * Handle cancel button press
   * Closes the modal without saving changes
   * Requirements: 3.8
   */
  const handleCancel = useCallback(() => {
    setIsLoading(false);
    onClose();
  }, [onClose]);

  /**
   * Handle save button press
   * Saves the avatar configuration and closes the modal
   * Requirements: 3.7
   */
  const handleSave = useCallback(async () => {
    if (!selectedStyle || !seed) return;

    try {
      setIsLoading(true);
      await onSave(selectedStyle, seed);
      onClose();
    } catch (error) {
      console.error('[AvatarSelectorModal] Error saving avatar:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  }, [selectedStyle, seed, onSave, onClose]);

  /**
   * Get the preview URL for the large avatar preview
   */
  const previewUrl = seed
    ? generateAvatarUrl(selectedStyle, seed, 200)
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.overlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('avatar.title')}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {t('avatar.subtitle')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
                disabled={isLoading}
                accessibilityLabel="Close avatar selection"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without saving changes"
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Large Preview */}
              <View style={styles.previewSection}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  {t('avatar.preview')}
                </Text>
                <View
                  style={[
                    styles.previewContainer,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {isInitializing || !previewUrl ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                  ) : (
                    <Image
                      source={{ uri: previewUrl }}
                      style={styles.previewImage}
                      contentFit="contain"
                      transition={200}
                    />
                  )}
                </View>

                {/* Randomize Button */}
                <TouchableOpacity
                  style={[
                    styles.randomizeButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={handleRandomize}
                  disabled={isLoading || isInitializing}
                  accessibilityLabel="Randomize avatar"
                  accessibilityRole="button"
                  accessibilityHint="Generates a new random avatar"
                >
                  <Shuffle size={20} color={colors.primary} />
                  <Text
                    style={[styles.randomizeText, { color: colors.primary }]}
                  >
                    {t('avatar.randomize')}
                  </Text>
                </TouchableOpacity>
              </View>


              {/* Style Selection Grid */}
              <View style={styles.styleSection}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  {t('avatar.selectStyle')}
                </Text>
                <View style={styles.styleGrid}>
                  {AVATAR_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const stylePreviewUrl = seed
                      ? generateAvatarUrl(style.id, seed, 80)
                      : null;

                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          styles.styleOption,
                          {
                            backgroundColor: colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                          isSelected && {
                            backgroundColor: isDark
                              ? 'rgba(34, 197, 94, 0.1)'
                              : '#f0fdf4',
                          },
                        ]}
                        onPress={() => handleStyleSelect(style.id)}
                        disabled={isLoading || isInitializing}
                        accessibilityLabel={`Select ${style.name} style`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <View style={styles.styleImageContainer}>
                          {stylePreviewUrl ? (
                            <Image
                              source={{ uri: stylePreviewUrl }}
                              style={styles.styleImage}
                              contentFit="contain"
                              transition={200}
                            />
                          ) : (
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.styleName,
                            { color: colors.text },
                            isSelected && {
                              color: colors.primary,
                              fontWeight: '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {t(style.nameKey) || style.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer with Action Buttons */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleCancel}
                disabled={isLoading}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                accessibilityHint="Closes the modal without saving changes"
              >
                <Text
                  style={[styles.cancelButtonText, { color: colors.textSecondary }]}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  (isLoading || isInitializing) && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={isLoading || isInitializing}
                accessibilityLabel="Save avatar"
                accessibilityRole="button"
                accessibilityHint="Saves the selected avatar and closes the modal"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {t('common.save')}
                  </Text>
                )}
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
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  previewContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: 150,
    height: 150,
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  randomizeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  styleSection: {
    paddingBottom: 20,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  styleOption: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  styleImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  styleImage: {
    width: 64,
    height: 64,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  saveButton: {},
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
