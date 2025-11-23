import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Bell, Truck, IndianRupee, MessageCircle, Zap, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService, NotificationSettings } from '../../api/apiService';
import { useLocalization } from '../../context/LocalizationContext';


interface NotificationItemConfig {
  key: keyof NotificationSettings;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}

interface NotificationGroup {
  title: string;
  items: NotificationItemConfig[];
}

interface HeaderComponentProps {
  onBackPress: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <ArrowLeft size={24} color="#111827" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Notifications</Text>
    <View style={styles.headerRight} />
  </View>
);


interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => (
  <View style={styles.errorBanner}>
    <AlertCircle size={18} color="#dc2626" />
    <Text style={styles.errorBannerText}>{message}</Text>
    <TouchableOpacity onPress={onDismiss}>
      <Text style={styles.dismissText}>✕</Text>
    </TouchableOpacity>
  </View>
);

interface SuccessBannerProps {
  message: string;
}

const SuccessBanner: React.FC<SuccessBannerProps> = ({ message }) => (
  <View style={styles.successBanner}>
    <Bell size={18} color="#16a34a" />
    <Text style={styles.successBannerText}>{message}</Text>
  </View>
);

interface MasterToggleComponentProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  saving: boolean;
}

const MasterToggleComponent: React.FC<MasterToggleComponentProps> = ({
  enabled,
  onToggle,
  saving,
}) => (
  <View style={styles.masterToggle}>
    <View style={styles.masterToggleContent}>
      <Bell size={24} color="#16a34a" />
      <View style={styles.masterToggleText}>
        <Text style={styles.masterToggleTitle}>Push Notifications</Text>
        <Text style={styles.masterToggleSubtitle}>
          Enable or disable all push notifications
        </Text>
      </View>
    </View>
    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
      thumbColor={enabled ? '#16a34a' : '#f3f4f6'}
      disabled={saving}
    />
  </View>
);

interface NotificationGroupComponentProps {
  group: NotificationGroup;
  settings: NotificationSettings;
  onUpdateSetting: (key: keyof NotificationSettings, value: boolean) => void;
  masterEnabled: boolean;
  saving: boolean;
}

const NotificationGroupComponent: React.FC<NotificationGroupComponentProps> = ({
  group,
  settings,
  onUpdateSetting,
  masterEnabled,
  saving,
}) => (
  <View style={styles.notificationGroup}>
    <Text style={styles.groupTitle}>{group.title}</Text>
    {group.items.map((item) => (
      <View key={item.key} style={styles.notificationItem}>
        <View style={styles.notificationLeft}>
          <View style={[styles.notificationIcon, { backgroundColor: `${item.color}20` }]}>
            <item.icon size={20} color={item.color} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        <Switch
          value={settings[item.key]}
          onValueChange={(value) => onUpdateSetting(item.key, value)}
          trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
          thumbColor={settings[item.key] ? '#16a34a' : '#f3f4f6'}
          disabled={!masterEnabled || saving}
        />
      </View>
    ))}
  </View>
);

const InfoCardComponent: React.FC = () => (
  <View style={styles.infoCard}>
    <Text style={styles.infoTitle}>About Notifications</Text>
    <Text style={styles.infoText}>
      • Notifications help you stay updated on your orders{'\n'}
      • You can customize which notifications you receive{'\n'}
      • Turn off promotional offers to reduce marketing messages{'\n'}
      • Some critical notifications cannot be disabled
    </Text>
  </View>
);

const SavingIndicatorComponent: React.FC = () => (
  <View style={styles.savingOverlay}>
    <ActivityIndicator size="small" color="#16a34a" />
    <Text style={styles.savingText}>Saving...</Text>
  </View>
);

export default function NotificationSystem(){
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useLocalization();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving , setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(()=>{
       if(successMessage){
        const timer = setTimeout(() => setSuccessMessage(null), 3000);
        return () => clearTimeout(timer);
       }
    },[successMessage])

    const loadData = useCallback(async()=>{
        try {
            setLoading(true);
            setError(null);
            const data = await AuthService.getNotificationSettings();
            setSettings(data);
        } catch (error) {
            setError(t('toasts.error.loadSettings'));
            Toast.show({
                type: 'error',
                text1: t('alerts.titles.error'),
                text2: t('toasts.error.loadSettings'),
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    const updateSetting = useCallback(async(key: keyof NotificationSettings, value: boolean) => {
      if(!settings) return;
      const previousSettings = {...settings};
      const newSettings = {...settings, [key]: value};
      setSettings(newSettings);
      try {
        setSaving(true);
        setError(null);
        await AuthService.updateNotificationSettings(newSettings);
        setSuccessMessage(t('toasts.success.settingsUpdated'));
        Toast.show({
          type: 'success',
          text1: t('alerts.titles.success'),
          text2: t('toasts.success.settingsUpdated'),
        });
      } catch (error) {
        console.error("Update failed", error);
        setSettings(previousSettings);
        setError(t('toasts.error.updateSettings'));
        Toast.show({
          type: 'error',
          text1: t('alerts.titles.error'),
          text2: t('toasts.error.updateSettings'),
        });
      }finally{
        setSaving(false);
      }
    },[settings, t])
    const handleToggle = useCallback(async(value: boolean)=>{
      if(!settings) return;
      const newSettings: Partial<NotificationSettings> = {
        pushNotifications: value,
      };
      if(!value){
        Object.keys(settings).forEach(key=>{
          if(key !== 'pushNotifications'){
            newSettings[key as keyof NotificationSettings] = false;
          }
        });
      }
      await updateSetting('pushNotifications', value);
      if(!value){
        setSettings(prev => prev ? {...prev, ...newSettings} : prev);

      }
    }, [settings, updateSetting]);
   const notificationGroups: NotificationGroup[] = [
     {
      title: 'Order Notifications',
      items: [
        {
          key: 'pickupReminders',
          title: 'Pickup Reminders',
          subtitle: 'Get notified before scheduled pickups',
          icon: Truck,
          color: '#3b82f6',
        },
        {
          key: 'orderUpdates',
          title: 'Order Updates',
          subtitle: 'Status updates for your orders',
          icon: Bell,
          color: '#16a34a',
        },
        {
          key: 'paymentAlerts',
          title: 'Payment Alerts',
          subtitle: 'Payment confirmations and receipts',
          icon: IndianRupee,
          color: '#f59e0b',
        },
      ],
    },
    {
      title: 'Marketing & Updates',
      items: [
        {
          key: 'promotionalOffers',
          title: 'Promotional Offers',
          subtitle: 'Special deals and discounts',
          icon: Zap,
          color: '#8b5cf6',
        },
        {
          key: 'weeklyReports',
          title: 'Weekly Reports',
          subtitle: 'Your recycling impact summary',
          icon: MessageCircle,
          color: '#06b6d4',
        },
      ],
    },
    {
      title: 'Communication Preferences',
      items: [
        {
          key: 'emailNotifications',
          title: 'Email Notifications',
          subtitle: 'Receive notifications via email',
          icon: MessageCircle,
          color: '#dc2626',
        },
        {
          key: 'smsNotifications',
          title: 'SMS Notifications',
          subtitle: 'Receive notifications via SMS',
          icon: MessageCircle,
          color: '#059669',
        },
      ],
    },
   ]
   if(loading){
     return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HeaderComponent onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading your notification settings...</Text>
        </View>
      </View>
    );
   }
   return(
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderComponent onBackPress={() => router.back()} />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Success Banner */}
      {successMessage && <SuccessBanner message={successMessage} />}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Manage Push Notifications Button */}
        <TouchableOpacity
          style={styles.managePushButton}
          onPress={() => router.push('/profile/notification-permission')}
        >
          <View style={styles.managePushContent}>
            <Bell size={20} color="#16a34a" />
            <View style={styles.managePushText}>
              <Text style={styles.managePushTitle}>Manage Push Notifications</Text>
              <Text style={styles.managePushSubtitle}>
                Enable or configure push notification permissions
              </Text>
            </View>
          </View>
          <ArrowLeft size={20} color="#9ca3af" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {/* Master Toggle */}
        <MasterToggleComponent
          enabled={settings.pushNotifications}
          onToggle={handleToggle}
          saving={saving}
        />

        {/* Notification Groups */}
        {notificationGroups.map((group, groupIndex) => (
          <NotificationGroupComponent
            key={groupIndex}
            group={group}
            settings={settings}
            onUpdateSetting={updateSetting}
            masterEnabled={settings.pushNotifications}
            saving={saving}
          />
        ))}

        {/* Info Card */}
        <InfoCardComponent />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Saving Indicator */}
      {saving && <SavingIndicatorComponent />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  dismissText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  managePushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  managePushContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  managePushText: {
    flex: 1,
  },
  managePushTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  managePushSubtitle: {
    fontSize: 12,
    color: '#15803d',
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  masterToggleText: {
    flex: 1,
  },
  masterToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  masterToggleSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  notificationGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});