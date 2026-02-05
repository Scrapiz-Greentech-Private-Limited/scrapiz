import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Trash2, LogOut, X, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { wp, hp, fs, spacing } from '../utils/responsive';

interface ManageAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onEditProfile: () => void;
    onDeleteAccount: () => void;
    onLogout: () => void;
    deletingAccount?: boolean;
}

export default function ManageAccountModal({
    visible,
    onClose,
    onEditProfile,
    onDeleteAccount,
    onLogout,
    deletingAccount = false,
}: ManageAccountModalProps) {
    const { isDark, colors } = useTheme();
    const { t } = useLocalization();

    const handleEditProfile = () => {
        onClose();
        onEditProfile();
    };

    const handleDeleteAccount = () => {
        onClose();
        onDeleteAccount();
    };

    const handleLogout = () => {
        onClose();
        onLogout();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <BlurView
                        intensity={isDark ? 40 : 60}
                        tint={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.modalContainer,
                            { backgroundColor: isDark ? '#1f2937' : '#ffffff' }
                        ]}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={[styles.headerIconContainer, { backgroundColor: isDark ? '#374151' : '#f0fdf4' }]}>
                                    <Settings size={24} color="#16a34a" strokeWidth={2} />
                                </View>
                                <Text style={[styles.headerTitle, { color: colors.text }]}>
                                    {t('profile.sections.manageAccount') || 'Manage Your Account'}
                                </Text>
                                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                    {t('profile.manageAccountSubtitle') || 'Update profile, security & more'}
                                </Text>
                            </View>

                            {/* Close Button */}
                            <TouchableOpacity
                                style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <X size={20} color={colors.textSecondary} strokeWidth={2} />
                            </TouchableOpacity>

                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {/* Edit Profile */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        { backgroundColor: isDark ? '#374151' : '#f8fafc' }
                                    ]}
                                    onPress={handleEditProfile}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                                        <User size={22} color="#3b82f6" strokeWidth={2} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                                            {t('profile.editProfile')}
                                        </Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                                            {t('profile.editProfileSubtitle')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Delete Account */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        { backgroundColor: isDark ? '#374151' : '#f8fafc' },
                                        deletingAccount && { opacity: 0.5 }
                                    ]}
                                    onPress={handleDeleteAccount}
                                    activeOpacity={0.7}
                                    disabled={deletingAccount}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: isDark ? '#374151' : '#f1f5f9' }]}>
                                        {deletingAccount ? (
                                            <ActivityIndicator size="small" color={isDark ? '#9ca3af' : '#64748b'} />
                                        ) : (
                                            <Trash2 size={22} color={isDark ? '#9ca3af' : '#64748b'} strokeWidth={2} />
                                        )}
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                                            {t('profile.deleteAccount')}
                                        </Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                                            {t('profile.deleteAccountSubtitle')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Logout */}
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        { backgroundColor: isDark ? '#374151' : '#f8fafc' }
                                    ]}
                                    onPress={handleLogout}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: isDark ? '#374151' : '#f1f5f9' }]}>
                                        <LogOut size={22} color={isDark ? '#9ca3af' : '#64748b'} strokeWidth={2} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                                            {t('profile.logout') || 'Logout'}
                                        </Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                                            {t('profile.logoutSubtitle') || 'Sign out of your account'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    { backgroundColor: isDark ? '#374151' : '#f3f4f6' }
                                ]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                                    {t('common.cancel') || 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: spacing(20),
    },
    modalContainer: {
        width: '100%',
        maxWidth: wp(90),
        borderRadius: spacing(20),
        paddingTop: spacing(28),
        paddingHorizontal: spacing(20),
        paddingBottom: spacing(20),
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
            },
            android: {
                elevation: 15,
            },
        }),
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing(24),
    },
    headerIconContainer: {
        width: spacing(56),
        height: spacing(56),
        borderRadius: spacing(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing(12),
    },
    headerTitle: {
        fontSize: fs(20),
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
        marginBottom: spacing(4),
    },
    headerSubtitle: {
        fontSize: fs(14),
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: spacing(16),
        right: spacing(16),
        width: spacing(36),
        height: spacing(36),
        borderRadius: spacing(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        gap: spacing(12),
        marginBottom: spacing(16),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing(16),
        borderRadius: spacing(14),
    },
    optionIcon: {
        width: spacing(48),
        height: spacing(48),
        borderRadius: spacing(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing(14),
    },
    optionText: {
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
    cancelButton: {
        paddingVertical: spacing(14),
        borderRadius: spacing(12),
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: fs(15),
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
});
