import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Image, Sparkles, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { wp, hp, fs, spacing } from '../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface AvatarOptionsBottomSheetProps {
  visible: boolean;
  hasExistingImage: boolean;
  onClose: () => void;
  onChooseFromGallery: () => void;
  onPickCustomAvatar: () => void;
  onRemovePhoto: () => void;
}

export default function AvatarOptionsBottomSheet({
  visible,
  hasExistingImage,
  onClose,
  onChooseFromGallery,
  onPickCustomAvatar,
  onRemovePhoto,
}: AvatarOptionsBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(300, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(300, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: colors.surface,
              shadowColor: isDark ? '#000' : '#1a1a1a',
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#4b5563' : '#d1d5db' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('profile.changeProfilePhoto') || 'Change Profile Photo'}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#374151' : '#f3f4f6' },
              ]}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Primary Options */}
          <View style={styles.optionsContainer}>
            {/* Choose from Gallery */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                { backgroundColor: isDark ? '#1f2937' : '#f9fafb' },
              ]}
              onPress={() => {
                handleClose();
                setTimeout(onChooseFromGallery, 300);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: isDark ? '#065f46' : '#dcfce7' },
                ]}
              >
                <Image size={22} color={isDark ? '#6ee7b7' : '#16a34a'} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t('profile.chooseFromGallery') || 'Choose from Gallery'}
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: colors.textSecondary }]}
                >
                  {t('profile.uploadFromDevice') || 'Upload a photo from your device'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Pick Custom Avatar */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                { backgroundColor: isDark ? '#1f2937' : '#f9fafb' },
              ]}
              onPress={() => {
                handleClose();
                setTimeout(onPickCustomAvatar, 300);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: isDark ? '#4c1d95' : '#ede9fe' },
                ]}
              >
                <Sparkles size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t('profile.pickCustomAvatar') || 'Pick a Custom Avatar'}
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: colors.textSecondary }]}
                >
                  {t('profile.createUniqueAvatar') || 'Create a unique avatar style'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Destructive Option - Only show if image exists */}
          {hasExistingImage && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDark ? '#374151' : '#e5e7eb' },
                ]}
              />
              <TouchableOpacity
                style={[styles.destructiveRow]}
                onPress={() => {
                  handleClose();
                  setTimeout(onRemovePhoto, 300);
                }}
                activeOpacity={0.7}
              >
                <Trash2 size={20} color="#dc2626" />
                <Text style={styles.destructiveText}>
                  {t('profile.removePhoto') || 'Remove Photo'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Bottom Safe Area */}
          <View style={{ height: Platform.OS === 'ios' ? hp(3) : hp(2) }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing(20),
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
  },
  handle: {
    width: wp(10),
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing(16),
  },
  title: {
    fontSize: fs(18),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    gap: spacing(12),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(16),
    borderRadius: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(14),
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(2),
  },
  optionSubtitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Regular',
  },
  divider: {
    height: 1,
    marginVertical: spacing(16),
  },
  destructiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(14),
    gap: spacing(8),
  },
  destructiveText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#dc2626',
  },
});
