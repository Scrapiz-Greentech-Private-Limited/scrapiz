import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { User, MapPin, Bell, Shield, CircleHelp as HelpCircle, Star, Gift, ChevronRight, Award, LogOut, Phone, Mail, Package, Clock, CheckCircle, Trash2, Globe } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import {AuthService, UserProfile, OrderSummary, ProductSummary, DeletionFeedback} from '../../api/apiService'
import { useEnvironmentalImpact } from '../../hooks/useImpact';
import DeleteAccountFeedbackModal from '../../components/DeleteAccountFeedbackModal';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import LanguageChangeModal from '../../components/LanguageChangeModal';
import { SUPPORTED_LANGUAGES } from '../../localization/languages';


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
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const loadUserProfile = useCallback(async () => {
    try {
        setLoading(true);
        setErrors(null);
        const [userData , productsData] = await Promise.all([
            AuthService.getUser(),
            AuthService.getProducts()
        ]);
        setUser(userData);
        setProducts(productsData);
        setLoading(false);
    } catch (error) {
        setErrors("Failed to load user profile");
        setLoading(false);
    }finally{
        setLoading(false);
    }
  }, []);

  // Reload data when screen comes into focus
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
    },0)
  },[user?.orders, products])

    const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
  const handlePrivacySettings = () =>{
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
              // Even if logout API fails, navigate to login
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
    // Close the feedback modal
    setFeedbackModalVisible(false);

    // Show confirmation dialog
    Alert.alert(
      t('profile.deleteAccountConfirmTitle'),
      t('profile.deleteAccountConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            // Reopen feedback modal if user cancels
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

      // Call API to delete account with feedback
      await AuthService.deleteUserWithFeedback(feedback);

      // Clear authentication state using AuthContext
      await clearAuthState();

      // Show success message
      Alert.alert(
        t('profile.accountDeleted'),
        t('profile.accountDeletedMessage'),
        [{ text: 'OK' }]
      );

      // Redirect to login screen after 3 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);

    } catch (err: any) {
      setDeletingAccount(false);
      
      // Show error message
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

  const handleOrderPress = (orderId: string) => {
    router.push(`/profile/orders/${orderId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  if (errors || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errors || t('profile.failedToLoad')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
          <Text style={styles.retryButtonText}>{t('profile.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get current language display name
  const currentLanguageDisplay = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)?.nativeName || 'English';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#16a34a', '#15803d']}
        style={styles.header}
      >
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            {user.profile_image && !imageError ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.section}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity 
              key={itemIndex} 
              style={[
                styles.menuItem,
                item.title === 'Delete Account' && styles.deleteAccountMenuItem
              ]}
              onPress={item.action}
              disabled={item.title === 'Delete Account' && deletingAccount}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuItemIcon,
                  item.title === 'Delete Account' && styles.deleteAccountIcon
                ]}>
                  <item.icon size={20} color={item.title === 'Delete Account' ? '#dc2626' : '#6b7280'} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={[
                    styles.menuItemTitle,
                    item.title === 'Delete Account' && styles.deleteAccountTitle
                  ]}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
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
                ) : item.title === 'Delete Account' && deletingAccount ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <ChevronRight size={16} color="#d1d5db" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Environmental Impact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.sections.environmentalImpact')}</Text>
        <View style={styles.impactCard}>
          <Text style={styles.impactEmoji}>🌱</Text>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>{t('profile.impactGreatJob')}</Text>
            <Text style={styles.impactDescription}>
              {t('profile.impactDescription', { weight: Math.round(environmentalImpact.totalWeight) })}
            </Text>
            <View style={styles.impactStats}>
              <Text style={styles.impactStat}>{t('profile.impactTreesSaved', { count: environmentalImpact.treesSaved })}</Text>
              <Text style={styles.impactStat}>{t('profile.impactCO2Reduced', { amount: environmentalImpact.co2Reduced })}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('profile.version')}</Text>
      </View>

      {/* Delete Account Feedback Modal */}
      <DeleteAccountFeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmit={handleFeedbackSubmit}
        loading={deletingAccount}
      />

      {/* Language Change Modal */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  menuItemRight: {
    marginLeft: 12,
  },
  impactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  impactEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  impactDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  impactStats: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  impactStat: {
    fontSize: 12,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  deleteAccountButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  deleteAccountMenuItem: {
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteAccountIcon: {
    backgroundColor: '#fee2e2',
  },
  deleteAccountTitle: {
    color: '#dc2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
})


