import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { User, MapPin, Bell, Sun, Moon, CircleHelp as HelpCircle, Gift, ChevronRight, LogOut, Package, Trash2, Globe, WifiOff } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { wp, hp, fs, spacing, responsiveValue, MIN_TOUCH_SIZE } from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AuthService, UserProfile, OrderSummary, ProductSummary, DeletionFeedback } from '../../api/apiService'
import { useEnvironmentalImpact } from '../../hooks/useImpact';
import DeleteAccountFeedbackModal from '../../components/DeleteAccountFeedbackModal';
import AvatarSelectorModal from '../../components/AvatarSelectorModal';
import AvatarOptionsBottomSheet from '../../components/AvatarOptionsBottomSheet';
import NetworkRetryOverlay from '../../components/NetworkRetryOverlay';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import LanguageChangeModal from '../../components/LanguageChangeModal';
import { SUPPORTED_LANGUAGES } from '../../localization/languages';
import Toast from 'react-native-toast-message';
import { getAvatarSource } from '../../utils/avatarUtils';
import { useNetworkRetry } from '../../hooks/useNetworkRetry';

type MenuItem = {
  icon: any;
  title: string;
  subtitle: string;
  action: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

export default function Profile() {
  const router = useRouter();
  const { clearAuthState } = useAuth();
  const { currentLanguage, changeLanguage, t } = useLocalization();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [updatingImage, setUpdatingImage] = useState(false);
  const { theme, setThemeMode, isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarOptionsVisible, setAvatarOptionsVisible] = useState(false);

  // Data loading function
  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    setErrors(null);
    const [userData, productsData] = await Promise.all([
      AuthService.getUser(),
      AuthService.getProducts()
    ]);
    setUser(userData);
    setProducts(productsData);
    setLoading(false);
  }, []);

  // Network retry hook
  const {
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
    startRetryFlow,
    resetRetryState,
    checkNetworkAndLoad,
  } = useNetworkRetry({
    fetchFn: loadUserProfile,
    countdownSeconds: 5,
    maxRetries: 3,
  });

  useFocusEffect(
    useCallback(() => {
      // Reset image error state when screen gains focus (e.g., after profile edit)
      setImageError(false);
      
      const initLoad = async () => {
        const isConnected = await checkNetworkAndLoad();
        if (isConnected) {
          try {
            await loadUserProfile();
          } catch (error: any) {
            const errorMsg = error.message || 'Failed to load profile';
            const isNetworkError = 
              errorMsg.toLowerCase().includes('network') ||
              errorMsg.toLowerCase().includes('internet') ||
              errorMsg.toLowerCase().includes('connection');
            
            if (isNetworkError) {
              startRetryFlow(errorMsg);
            } else {
              setErrors(errorMsg);
              setLoading(false);
            }
          }
        }
      };
      
      initLoad();
    }, [loadUserProfile, checkNetworkAndLoad, startRetryFlow])
  );

  const environmentalImpact = useEnvironmentalImpact(user?.orders || []);
  
  const totalEarnings = useMemo(() => {
    if (!user?.orders || !products.length) return 0;
    return user.orders.reduce((total, order) => {
      const totalOrder = order.orders.reduce((orderTotal, item) => {
        const product = products.find(p => p.id === item.product.id);
        const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
        const quantity = parseFloat(item.quantity) || 0;
        return orderTotal + (rate * quantity);
      }, 0)
      return total + totalOrder;
    }, 0)
  }, [user?.orders, products])



  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      await updateProfileImage(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert(
      t('alerts.titles.error'),
      t('toasts.error.imagePickerFailed')
    );
    console.error(error);
  }
};
  const updateProfileImage = async (imageUri: string) => {
    try {
      setUpdatingImage(true);
      
      const updateData = {
        profile_image: imageUri
      };
      
      const updatedUser = await AuthService.updateUserProfile(updateData);
      
      setUser(prevUser => ({
        ...prevUser!,
        profile_image: updatedUser.profile_image || ''
      }));
      
      setImageError(false);
      
      Toast.show({
        type: 'success',
        text1: t('toasts.success.profileImageUpdated') || 'Profile image updated successfully',
        text2: '',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('alerts.titles.error'),
        text2: error.message || t('toasts.error.updateProfileImage'),
      });
      console.error('Update image error:', error);
    } finally {
      setUpdatingImage(false);
    }
  };
  
  const handleRemoveImage = () => {
    Alert.alert(
      t('alerts.titles.removeProfilePicture'),
      t('alerts.confirmations.removeProfilePicture'),
      [
        { text: t('alerts.buttons.cancel'), style: 'cancel' },
        {
          text: t('alerts.buttons.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingImage(true);
              
              const updateData = {
                profile_image: null
              };
              
              const updatedUser = await AuthService.updateUserProfile(updateData);
              
              setUser(prevUser => ({
                ...prevUser!,
                profile_image: ''
              }));
              
              setImageError(false);
              
              Toast.show({
                type: 'success',
                text1: t('toasts.success.profileImageRemoved') || 'Profile image removed successfully',
                text2: '',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: t('alerts.titles.error'),
                text2: error.message || t('toasts.error.removeProfileImage'),
              });
              console.error('Remove image error:', error);
            } finally {
              setUpdatingImage(false);
            }
          },
        },
      ]
    );
  };

  const formatJoinDate = (orders: OrderSummary[]): string => {
    if (!orders.length) return 'Recently joined';
    
    const oldestOrder = orders.reduce((oldest, order) => {
      const orderDate = new Date(order.created_at);
      return orderDate < oldest ? orderDate : oldest;
    }, new Date(orders[0].created_at));
    
    return oldestOrder.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleNavigation = (screen: string) => {
    router.push(screen as any);
  }

  const handleAddresses = () => {
    router.push('/profile/addresses');
  };

  const handleNotifications = () => {
    router.push('/profile/notification-settings');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit-profile');
  };

  const handlePrivacySettings = () => {
    router.push('/profile/privacy-security');
  }

  const handleHelpSupport = () => {
    router.push('/profile/help-support');
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Scrapiz',
      'Would you like to rate our app on the App Store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            Alert.alert('Thank you!', 'This would open the app store in a real app.');
          }
        }
      ]
    );
  };

  const handleReferFriends = () => {
    router.push('/profile/refer-friends');
  };

  const handleLanguageSettings = () => {
    setLanguageModalVisible(true);
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await changeLanguage(language as any);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  /**
   * Opens the avatar selector modal
   * Requirements: 4.3
   */
  const handleOpenAvatarSelector = () => {
    setAvatarModalVisible(true);
  };

  /**
   * Handles saving the avatar configuration
   * Updates local user state and shows success toast
   * Requirements: 3.7, 4.4, 4.5
   */
  const handleAvatarSave = async (style: string, seed: string) => {
    try {
      const updateData = {
        avatar_provider: 'dicebear',
        avatar_style: style,
        avatar_seed: seed,
      };

      const updatedUser = await AuthService.updateUserProfile(updateData);

      // Update local user state with new avatar configuration
      setUser(prevUser => ({
        ...prevUser!,
        avatar_provider: updatedUser.avatar_provider || 'dicebear',
        avatar_style: updatedUser.avatar_style || style,
        avatar_seed: updatedUser.avatar_seed || seed,
      }));

      // Reset image error state in case it was set
      setImageError(false);

      Toast.show({
        type: 'success',
        text1: t('toasts.success.avatarUpdated') || 'Avatar updated successfully',
        text2: '',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('alerts.titles.error'),
        text2: error.message || t('toasts.error.updateAvatar') || 'Failed to update avatar',
      });
      throw error; // Re-throw to keep modal open
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              router.replace('/(auth)/login');
            } catch (err: any) {
              console.error('Logout error:', err);
              router.replace('/(auth)/login');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setFeedbackModalVisible(true);
  };

  const handleFeedbackSubmit = (feedback: DeletionFeedback) => {
    setFeedbackModalVisible(false);

    Alert.alert(
      t('profile.deleteAccountConfirmTitle'),
      t('profile.deleteAccountConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            setFeedbackModalVisible(true);
          }
        },
        {
          text: t('profile.deleteAccount'),
          style: 'destructive',
          onPress: () => confirmDeletion(feedback)
        }
      ]
    );
  };

  const confirmDeletion = async (feedback: DeletionFeedback) => {
    try {
      setDeletingAccount(true);
      
      // Delete account
      await AuthService.deleteUserWithFeedback(feedback);
      
      // Clear auth state (ignore any errors since account is already deleted)
      try {
        await clearAuthState();
      } catch (clearError) {
        console.log('Auth state cleared (with non-critical errors)');
      }

      Alert.alert(
        t('profile.accountDeleted'),
        t('profile.accountDeletedMessage'),
        [{ text: 'OK' }]
      );

      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);

    } catch (err: any) {
      setDeletingAccount(false);

      Alert.alert(
        t('profile.deletionFailed'),
        err.message || t('profile.deletionFailedMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('profile.retry'),
            onPress: () => confirmDeletion(feedback)
          }
        ]
      );
    }
  };

  const handleViewOrders = () => {
    router.push('/profile/orders');
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    await setThemeMode(newTheme);
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/profile/orders/${orderId}`);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  if (errors || !user) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Text style={styles.errorText}>{errors || t('profile.failedToLoad')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryNow}>
          <Text style={styles.retryButtonText}>{t('profile.retry')}</Text>
        </TouchableOpacity>
        
        {/* Network Retry Overlay */}
        <NetworkRetryOverlay
          visible={showRetryOverlay}
          countdown={countdown}
          isRetrying={isRetrying}
          hasFailedPermanently={hasFailedPermanently}
          errorMessage={errorMessage || undefined}
          onRetryNow={retryNow}
        />
      </View>
    );
  }

  const currentLanguageDisplay = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)?.nativeName || 'English';

  const handleNotificationPermission = () => {
    router.push('/notification-permission');
  };

  const menuItems: MenuSection[] = [
    {
      section: t('profile.sections.account'),
      items: [
        { icon: User, title: t('profile.editProfile'), subtitle: t('profile.editProfileSubtitle'), action: handleEditProfile },
        { icon: MapPin, title: t('profile.addresses'), subtitle: `${user.addresses.length} ${t('profile.addressesSubtitle')}`, action: handleAddresses },
        { icon: Trash2, title: t('profile.deleteAccount'), subtitle: t('profile.deleteAccountSubtitle'), action: handleDeleteAccount },
      ]
    },
    {
      section: t('profile.sections.preferences'),
      items: [
        { icon: Bell, title: t('profile.notifications'), subtitle: t('profile.notificationsSubtitle'), action: handleNotificationPermission },
        { icon: Globe, title: t('profile.languageSupport'), subtitle: currentLanguageDisplay, action: handleLanguageSettings },
      ]
    },
    {
      section: t('profile.sections.ordersServices'),
      items: [
        { icon: Package, title: t('profile.myOrders'), subtitle: `${user.orders.length} ${t('profile.myOrdersSubtitle')}`, action: handleViewOrders },
      ]
    },
    {
      section: t('profile.sections.supportFeedback'),
      items: [
        { icon: HelpCircle, title: t('profile.helpSupport'), subtitle: t('profile.helpSupportSubtitle'), action: handleHelpSupport },
        { icon: Gift, title: t('profile.referFriends'), subtitle: t('profile.referFriendsSubtitle'), action: handleReferFriends },
      ]
    }
  ]

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.themeToggleButton}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.themeToggleIcon}>
              {isDark ? (
                <Sun size={fs(20)} color="#ffffff" strokeWidth={2.5} />
              ) : (
                <Moon size={fs(20)} color="#ffffff" strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileContainer}>
          {/* Clean Avatar - Tap to open options */}
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={() => !updatingImage && setAvatarOptionsVisible(true)}
            activeOpacity={0.8}
            disabled={updatingImage}
            accessibilityLabel={t('profile.changeProfilePhoto') || 'Change profile photo'}
            accessibilityRole="button"
          >
            <View style={styles.avatar}>
              {updatingImage ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (() => {
                // Use getAvatarSource to determine avatar display
                // Priority: profile_image > DiceBear avatar > initials
                const avatarSource = getAvatarSource({
                  profile_image: imageError ? null : user.profile_image,
                  avatar_provider: user.avatar_provider,
                  avatar_style: user.avatar_style,
                  avatar_seed: user.avatar_seed,
                }, 200);

                if (avatarSource) {
                  // Check if it's a DiceBear URL (for using ExpoImage with better caching)
                  const isDiceBearUrl = avatarSource.uri.includes('api.dicebear.com');
                  
                  if (isDiceBearUrl) {
                    return (
                      <ExpoImage
                        source={{ uri: avatarSource.uri }}
                        style={styles.avatarImage}
                        contentFit="cover"
                        transition={200}
                        onError={() => setImageError(true)}
                      />
                    );
                  }
                  
                  return (
                    <Image
                      source={{ uri: avatarSource.uri }}
                      style={styles.avatarImage}
                      onError={() => setImageError(true)}
                    />
                  );
                }
                
                // Fallback to initials
                return <Text style={styles.avatarText}>{getInitials(user.name)}</Text>;
              })()}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>
      </LinearGradient>

      {menuItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.section}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={[
                styles.menuItem,
                { backgroundColor: colors.surface },
                item.title === t('profile.deleteAccount') && styles.deleteAccountMenuItem
              ]}
              onPress={item.action}
              disabled={item.title === t('profile.deleteAccount') && deletingAccount}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuItemIcon,
                  item.title === t('profile.deleteAccount') && styles.deleteAccountIcon
                ]}>
                  <item.icon size={20} color={item.title === t('profile.deleteAccount') ? '#dc2626' : '#6b7280'} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={[
                    styles.menuItemTitle,
                    { color: colors.text },
                    item.title === t('profile.deleteAccount') && styles.deleteAccountTitle
                  ]}>{item.title}</Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.hasSwitch ? (
                  <Switch
                    value={item.switchValue}
                    onValueChange={item.onSwitchChange}
                    trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                    thumbColor={item.switchValue ? '#16a34a' : '#f3f4f6'}
                  />
                ) : item.title === t('profile.deleteAccount') && deletingAccount ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <ChevronRight size={16} color="#d1d5db" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.sections.environmentalImpact')}</Text>
        <View style={[styles.impactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.impactEmoji}>🌱</Text>
          <View style={styles.impactContent}>
            <Text style={[styles.impactTitle, { color: colors.text }]}>{t('profile.impactGreatJob')}</Text>
            <Text style={[styles.impactDescription, { color: colors.textSecondary }]}>
              {t('profile.impactDescription', { weight: Math.round(environmentalImpact.totalWeight) })}
            </Text>
            <View style={styles.impactStats}>
              <Text style={[styles.impactStat, { color: colors.text }]}>{t('profile.impactTreesSaved', { count: environmentalImpact.treesSaved })}</Text>
              <Text style={[styles.impactStat, { color: colors.text }]}>{t('profile.impactCO2Reduced', { amount: environmentalImpact.co2Reduced })}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={fs(20)} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('profile.version')}</Text>
      </View>

      <DeleteAccountFeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmit={handleFeedbackSubmit}
        loading={deletingAccount}
      />

      <LanguageChangeModal
        visible={languageModalVisible}
        currentLanguage={currentLanguage}
        onClose={() => setLanguageModalVisible(false)}
        onLanguageChange={handleLanguageChange}
      />

      <AvatarSelectorModal
        visible={avatarModalVisible}
        currentStyle={user?.avatar_style || null}
        currentSeed={user?.avatar_seed || null}
        onClose={() => setAvatarModalVisible(false)}
        onSave={handleAvatarSave}
      />

      <AvatarOptionsBottomSheet
        visible={avatarOptionsVisible}
        hasExistingImage={!!(user?.profile_image && !imageError)}
        onClose={() => setAvatarOptionsVisible(false)}
        onChooseFromGallery={handlePickImage}
        onPickCustomAvatar={handleOpenAvatarSelector}
        onRemovePhoto={handleRemoveImage}
      />

      {/* Network Retry Overlay - Shows when network issues occur */}
      <NetworkRetryOverlay
        visible={showRetryOverlay}
        countdown={countdown}
        isRetrying={isRetrying}
        hasFailedPermanently={hasFailedPermanently}
        errorMessage={errorMessage || undefined}
        onRetryNow={retryNow}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: Platform.select({ ios: hp(8.5), android: hp(7.5) }), // Reduced from 9.8/8.6
    paddingHorizontal: spacing(18), // Reduced from 20
    paddingBottom: spacing(16), // Reduced from 20
    borderBottomLeftRadius: spacing(24),
    borderBottomRightRadius: spacing(24),
  },
  loadingText: {
    marginTop: spacing(2),
    fontSize: fs(15),
    color: '#6b7280',
    fontWeight: '500',
  },
  themeToggleButton: {
    position: 'absolute',
    top: Platform.select({ ios: hp(6.5), android: hp(5.2) }), // Moved down from 7/5.5
    right: spacing(18), // Adjusted from 20
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing(4),
  },
  errorText: {
    fontSize: fs(16),
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: spacing(3),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(24),
  },
  offlineCard: {
    width: '100%',
    borderRadius: spacing(20),
    padding: spacing(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  offlineIconContainer: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(20),
  },
  offlineTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: spacing(8),
  },
  offlineMessage: {
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: spacing(20),
    lineHeight: fs(20),
  },
  countdownContainer: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(12),
    borderRadius: spacing(12),
    marginBottom: spacing(20),
  },
  countdownText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  retryNowButton: {
    paddingHorizontal: spacing(32),
    paddingVertical: spacing(14),
    borderRadius: spacing(12),
    minWidth: wp(50),
    alignItems: 'center',
  },
  retryNowButtonText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: spacing(24),
    paddingVertical: spacing(12),
    borderRadius: spacing(10),
    marginTop: spacing(8),
  },
  retryButtonText: {
    fontSize: fs(14),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  themeToggleIcon: {
    width: spacing(38), // Reduced from 42
    height: spacing(38), // Reduced from 42
    borderRadius: spacing(19), // Reduced from 21
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: spacing(14),
  },
  avatar: {
    width: wp(24), // ~90px on standard screens (88-96px per design guidelines)
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: fs(32),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    textAlign: 'center',
  },
  // Removed floating button styles - now using bottom sheet
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fs(20),
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: fs(13), // Reduced from 14
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing(2),
  },
  section: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(16),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(12),
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: spacing(12),
    padding: spacing(16),
    marginBottom: spacing(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: wp(10.6),
    height: wp(10.6),
    borderRadius: wp(2.5),  // Changed from wp(5.3) to rounded square instead of circle/hexagon
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(12),
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fs(16),
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: spacing(2),
  },
  menuItemSubtitle: {
    fontSize: fs(12),
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  menuItemRight: {
    marginLeft: spacing(12),
  },
  impactCard: {
    backgroundColor: 'white',
    borderRadius: spacing(16),
    padding: spacing(20),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  impactEmoji: {
    fontSize: fs(48),
    marginRight: spacing(16),
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(4),
  },
  impactDescription: {
    fontSize: fs(14),
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: spacing(8),
  },
  impactStats: {
    flexDirection: 'row',
    gap: spacing(16),
    flexWrap: 'wrap',
  },
  impactStat: {
    fontSize: fs(12),
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: spacing(12),
    padding: spacing(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: {
    fontSize: fs(16),
    fontWeight: '500',
    color: '#dc2626',
    fontFamily: 'Inter-Medium',
    marginLeft: spacing(8),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing(20),
  },
  footerText: {
    fontSize: fs(12),
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
});