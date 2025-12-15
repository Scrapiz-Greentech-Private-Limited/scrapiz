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
import { User, MapPin, Bell, Sun, Camera, Moon, Shield, CircleHelp as HelpCircle, X, Star, Gift, ChevronRight, Award, LogOut, Phone, Mail, Package, Clock, CheckCircle, Trash2, Globe, WifiOff } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { wp, hp, fs, spacing, responsiveValue, MIN_TOUCH_SIZE } from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AuthService, UserProfile, OrderSummary, ProductSummary, DeletionFeedback } from '../../api/apiService'
import { useEnvironmentalImpact } from '../../hooks/useImpact';
import DeleteAccountFeedbackModal from '../../components/DeleteAccountFeedbackModal';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import LanguageChangeModal from '../../components/LanguageChangeModal';
import { SUPPORTED_LANGUAGES } from '../../localization/languages';
import Toast from 'react-native-toast-message';

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
  const [isOffline, setIsOffline] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  const checkNetworkAndLoad = useCallback(async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setIsOffline(true);
      setLoading(false);
      startRetryCountdown();
      return false;
    }
    setIsOffline(false);
    return true;
  }, []);

  // Start countdown timer for retry
  const startRetryCountdown = useCallback(() => {
    // Clear any existing timers
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setRetryCountdown(5);
    
    // Countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Retry after 5 seconds
    retryTimerRef.current = setTimeout(() => {
      loadUserProfile();
    }, 5000);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const loadUserProfile = useCallback(async () => {
    try {
      // Check network first
      const isConnected = await checkNetworkAndLoad();
      if (!isConnected) return;
      
      setLoading(true);
      setErrors(null);
      const [userData, productsData] = await Promise.all([
        AuthService.getUser(),
        AuthService.getProducts()
      ]);
      setUser(userData);
      setProducts(productsData);
      setIsOffline(false);
      setLoading(false);
    } catch (error: any) {
      // Check if it's a network error
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || error.message?.includes('Network') || error.message?.includes('network')) {
        setIsOffline(true);
        setErrors(null);
        startRetryCountdown();
      } else {
        setErrors("Failed to load user profile");
      }
      setLoading(false);
    }
  }, [checkNetworkAndLoad, startRetryCountdown]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('alerts.titles.permissionRequired'),
          t('alerts.permissions.cameraRollRequired'),
          [{ text: t('alerts.buttons.ok') }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;
        await updateProfileImage(newImageUri);
      }
    } catch (error) {
      Alert.alert(t('alerts.titles.error'), t('toasts.error.imagePickerFailed'));
      console.error('Image picker error:', error);
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

  // Offline state with countdown retry
  if (isOffline) {
    return (
      <View style={[styles.offlineContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.offlineCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.offlineIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
            <WifiOff size={48} color="#ef4444" strokeWidth={2} />
          </View>
          <Text style={[styles.offlineTitle, { color: colors.text }]}>
            {t('profile.noInternet') || 'No Internet Connection'}
          </Text>
          <Text style={[styles.offlineMessage, { color: colors.textSecondary }]}>
            {t('profile.checkConnection') || 'Please check your internet connection'}
          </Text>
          {retryCountdown > 0 && (
            <View style={[styles.countdownContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}>
              <Text style={[styles.countdownText, { color: colors.primary }]}>
                {t('profile.retryingIn') || 'Retrying in'} {retryCountdown}...
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.retryNowButton, { backgroundColor: colors.primary }]} 
            onPress={() => {
              if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setRetryCountdown(0);
              loadUserProfile();
            }}
          >
            <Text style={styles.retryNowButtonText}>{t('profile.retryNow') || 'Retry Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (errors || !user) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Text style={styles.errorText}>{errors || t('profile.failedToLoad')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>{t('profile.retry')}</Text>
        </TouchableOpacity>
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
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {updatingImage ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : user.profile_image && !imageError ? (
                <Image
                  source={{ uri: user.profile_image }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              )}
            </View>
            {user.profile_image && !imageError && !updatingImage && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                disabled={updatingImage}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handlePickImage}
              disabled={updatingImage}
            >
              <Camera size={18} color="white" />
            </TouchableOpacity>
          </View>
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
    position: 'relative',
    marginRight: spacing(14), // Reduced from 16
  },
  avatar: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
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
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16a34a',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Remove Image Button (Top Right of Avatar)
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(5.5), // Reduced from 6.4
    height: wp(5.5), // Reduced from 6.4
    borderRadius: wp(2.75), // Reduced from 3.2
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  avatarText: {
    color: 'white',
    fontSize: fs(22), // Reduced from 24
    fontFamily: 'Inter-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fs(20), // Reduced from 22
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
    borderRadius: wp(5.3),
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