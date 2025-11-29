import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

interface GenderSelectionModalProps {
  visible: boolean;
  selectedGender: string | null;
  onClose: () => void;
  onSelect: (gender: 'male' | 'female' | 'prefer_not_to_say') => void;
}

const genderOptions: Array<{ value: 'male' | 'female' | 'prefer_not_to_say'; labelKey: string }> = [
  { value: 'male', labelKey: 'profile.genderMale' },
  { value: 'female', labelKey: 'profile.genderFemale' },
  { value: 'prefer_not_to_say', labelKey: 'profile.genderPreferNotToSay' },
];

export default function GenderSelectionModal({
  visible,
  selectedGender,
  onClose,
  onSelect,
}: GenderSelectionModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  const handleSelect = (gender: 'male' | 'female' | 'prefer_not_to_say') => {
    onSelect(gender);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('profile.selectGender')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border },
                  selectedGender === option.value && {
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                  },
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    selectedGender === option.value && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
                {selectedGender === option.value && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});
