import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, LogIn, UserPlus, ShoppingBag, Gift, HelpCircle, Globe, ChevronRight, Heart, Leaf, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import LanguageChangeModal from './LanguageChangeModal';
import { SUPPORTED_LANGUAGES } from '../localization/languages';

const { width } = Dimensions.get('window');

/**
 * GuestProfileView component
 * 
 * Displays a welcome view for unauthenticated (guest) users with:
 * - Clear call-to-action for sign-in/sign-up
 * - Preview of benefits for creating an account
 * - Limited menu options for guests
 * 
 * Part of the guest authentication flow redesign (Phase 4)
 * 
 * @component
 */
export default function GuestProfileView() {
    const router = useRouter();
    const { colors, isDark, setThemeMode } = useTheme();
    const { t, currentLanguage, changeLanguage } = useLocalization();
    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    const handleSignUp = () => {
        router.push('/(auth)/register');
    };

    const handleLanguageSettings = () => {
        // Open modal instead of navigating to non-existent route
        setLanguageModalVisible(true);
    };

    const handleLanguageChange = async (language: string) => {
        try {
            // This persists to AsyncStorage via LocalizationContext
            await changeLanguage(language as any);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    };

    const handleHelpSupport = () => {
        // Navigate to the correct help-support route
        router.push('/profile/help-support');
    };

    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        await setThemeMode(newTheme);
    };

    // Get current language display name
    const currentLanguageDisplay = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)?.nativeName || 'English';

    const benefits = [
        {
            icon: ShoppingBag,
            title: t('guestProfile.benefits.trackOrders'),
            description: t('guestProfile.benefits.trackOrdersDesc'),
        },
        {
            icon: Gift,
            title: t('guestProfile.benefits.earnRewards'),
            description: t('guestProfile.benefits.earnRewardsDesc'),
        },
        {
            icon: Heart,
            title: t('guestProfile.benefits.saveAddresses'),
            description: t('guestProfile.benefits.saveAddressesDesc'),
        },
        {
            icon: Leaf,
            title: t('guestProfile.benefits.trackImpact'),
            description: t('guestProfile.benefits.trackImpactDesc'),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Section */}
                <LinearGradient
                    colors={isDark ? ['#1a472a', '#0d2818'] : ['#16a34a', '#15803d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroSection}
                >
                    {/* Theme Toggle */}
                    <TouchableOpacity
                        style={styles.themeToggleButton}
                        onPress={toggleTheme}
                        activeOpacity={0.7}
                    >
                        {isDark ? (
                            <Sun size={20} color="#ffffff" strokeWidth={2.5} />
                        ) : (
                            <Moon size={20} color="#ffffff" strokeWidth={2.5} />
                        )}
                    </TouchableOpacity>

                    {/* Guest Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <User color="white" size={48} strokeWidth={1.5} />
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>{t('guestProfile.welcome')}</Text>
                    <Text style={styles.heroSubtitle}>{t('guestProfile.subtitle')}</Text>

                    {/* Auth Buttons */}
                    <View style={styles.authButtonsContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleSignUp}
                            activeOpacity={0.8}
                        >
                            <UserPlus color="#16a34a" size={20} strokeWidth={2} />
                            <Text style={styles.primaryButtonText}>{t('guestProfile.createAccount')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <LogIn color="white" size={20} strokeWidth={2} />
                            <Text style={styles.secondaryButtonText}>{t('guestProfile.signIn')}</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Benefits Section */}
                <View style={styles.benefitsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('guestProfile.whyJoin')}
                    </Text>

                    <View style={styles.benefitsGrid}>
                        {benefits.map((benefit, index) => {
                            const IconComponent = benefit.icon;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.benefitCard,
                                        { backgroundColor: isDark ? colors.card : '#f8fafc' }
                                    ]}
                                >
                                    <View style={[styles.benefitIconContainer, { backgroundColor: isDark ? '#1a472a' : '#dcfce7' }]}>
                                        <IconComponent color="#16a34a" size={24} strokeWidth={2} />
                                    </View>
                                    <Text style={[styles.benefitTitle, { color: colors.text }]}>
                                        {benefit.title}
                                    </Text>
                                    <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                                        {benefit.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Guest Menu Options */}
                <View style={styles.menuSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('guestProfile.settings')}
                    </Text>

                    <View style={[styles.menuCard, { backgroundColor: isDark ? colors.card : 'white' }]}>
                        {/* Language Settings */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLanguageSettings}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                <Globe color={colors.text} size={20} strokeWidth={2} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                                    {t('profile.languageSupport')}
                                </Text>
                                <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                                    {currentLanguageDisplay}
                                </Text>
                            </View>
                            <ChevronRight color={colors.textSecondary} size={20} />
                        </TouchableOpacity>

                        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                        {/* Help & Support */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleHelpSupport}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                <HelpCircle color={colors.text} size={20} strokeWidth={2} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                                    {t('profile.helpSupport')}
                                </Text>
                                <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                                    {t('profile.helpSupportSubtitle')}
                                </Text>
                            </View>
                            <ChevronRight color={colors.textSecondary} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Already have an account reminder */}
                <View style={styles.reminderSection}>
                    <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                        {t('guestProfile.alreadyHaveAccount')}
                    </Text>
                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                        <Text style={styles.reminderLink}>{t('guestProfile.signInLink')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Language Change Modal */}
            <LanguageChangeModal
                visible={languageModalVisible}
                currentLanguage={currentLanguage}
                onClose={() => setLanguageModalVisible(false)}
                onLanguageChange={handleLanguageChange}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100, // Account for tab bar
    },
    heroSection: {
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    themeToggleButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    authButtonsContainer: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#16a34a',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: 'white',
    },
    benefitsSection: {
        paddingHorizontal: 16,
        paddingTop: 28,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    benefitCard: {
        width: (width - 44) / 2,
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    benefitIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    benefitTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    benefitDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    menuSection: {
        paddingHorizontal: 16,
        paddingTop: 28,
    },
    menuCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 13,
    },
    menuDivider: {
        height: 1,
        marginLeft: 70,
    },
    reminderSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 16,
        gap: 4,
    },
    reminderText: {
        fontSize: 14,
    },
    reminderLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
    },
});
