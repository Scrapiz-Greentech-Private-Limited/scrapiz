import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { X, Star, Clock, XCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

interface RateAppBottomSheetProps {
  visible: boolean;
  onRateNow: () => void;
  onRemindLater: () => void;
  onNeverAskAgain: () => void;
  onDismiss: () => void;
}

/**
 * RateAppBottomSheet Component
 * A bottom sheet modal that prompts users to rate the app on the Play Store.
 * Provides three options: Rate Now, Remind Me Later, and Never Ask Again.
 * Dismiss gesture (backdrop tap or swipe) is treated as "Remind Me Later".
 * 
 * Requirements: 1.2, 2.3, 3.3
 */
export default function RateAppBottomSheet({
  visible,
  onRateNow,
  onRemindLater,
  onNeverAskAgain,
  onDismiss,
}: RateAppBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  /**
   * Handle dismiss gesture (backdrop tap or hardware back button)
   * Per requirement 2.3: Treat dismiss as "Remind Me Later"
   */
  const handleDismiss = () => {
    onRemindLater();
    onDismiss();
  };

  /**
   * Handle "Rate Now" button press
   * Per requirement 1.3: Trigger the In-App Review API
   */
  const handleRateNow = () => {
    onRateNow();
    onDismiss();
  };

  /**
   * Handle "Remind Me Later" button press
   * Per requirement 2.1, 2.2: Increment prompt count and update timestamp
   */
  const handleRemindLater = () => {
    onRemindLater();
    onDismiss();
  };

  /**
   * Handle "Never Ask Again" button press
   * Per requirement 3.1, 3.3: Set opted_out to true and dismiss immediately
   */
  const handleNeverAskAgain = () => {
    onNeverAskAgain();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Handle bar for visual affordance */}
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}>
                <Star size={32} color={colors.primary} fill={colors.primary} />
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('appRating.title')}
              </Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {t('appRating.message')}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* Rate Now - Primary action */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleRateNow}
                accessibilityLabel={t('appRating.rateNow')}
                accessibilityRole="button"
              >
                <Star size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  {t('appRating.rateNow')}
                </Text>
              </TouchableOpacity>

              {/* Remind Me Later - Secondary action */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                onPress={handleRemindLater}
                accessibilityLabel={t('appRating.remindLater')}
                accessibilityRole="button"
              >
                <Clock size={18} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {t('appRating.remindLater')}
                </Text>
              </TouchableOpacity>

              {/* Never Ask Again - Tertiary action */}
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleNeverAskAgain}
                accessibilityLabel={t('appRating.neverAskAgain')}
                accessibilityRole="button"
              >
                <Text style={[styles.tertiaryButtonText, { color: colors.textSecondary }]}>
                  {t('appRating.neverAskAgain')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    minHeight: 52,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    minHeight: 48,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tertiaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  tertiaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
