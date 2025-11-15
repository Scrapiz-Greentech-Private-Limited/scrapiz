import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Bell, Package, Megaphone, MessageSquare, Info } from 'lucide-react-native';
import { AuthService, PushNotificationPreferences } from '../api/apiService';

interface NotificationCategoryConfig {
  key: keyof Omit<PushNotificationPreferences, 'push_notification_enabled'>;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}

const notificationCategories: NotificationCategoryConfig[] = [
  {
    key: 'order_updates',
    title: 'Order Updates',
    description: 'Get notified about your order status changes',
    icon: Package,
    color: '#16a34a',
  },
  {
    key: 'promotions',
    title: 'Promotions',
    description: 'Receive special offers and promotional deals',
    icon: Megaphone,
    color: '#8b5cf6',
  },
  {
    key: 'announcements',
    title: 'Announcements',
    description: 'Stay updated with important announcements',
    icon: Bell,
    color: '#3b82f6',
  },
  {
    key: 'general',
    title: 'General Notifications',
    description: 'Receive general updates and information',
    icon: MessageSquare,
    color: '#f59e0b',
  },
];

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<PushNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getPushNotificationPreferences();
      setPreferences(data);
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load notification preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    key: keyof PushNotificationPreferences,
    value: boolean
  ) => {
    if (!preferences) return;

    const previousPreferences = { ...preferences };
    const newPreferences = { ...preferences, [key]: value };

    // Optimistically update UI
    setPreferences(newPreferences);

    try {
      setUpdating(true);
      await AuthService.updatePushNotificationPreferences({ [key]: value });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Notification preferences updated',
      });
    } catch (error: any) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setPreferences(previousPreferences);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update preferences',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleMasterToggle = async (value: boolean) => {
    if (!preferences) return;

    const previousPreferences = { ...preferences };
    
    // If disabling, turn off all categories
    const newPreferences: PushNotificationPreferences = {
      push_notification_enabled: value,
      order_updates: value ? preferences.order_updates : false,
      promotions: value ? preferences.promotions : false,
      announcements: value ? preferences.announcements : false,
      general: value ? preferences.general : false,
    };

    // Optimistically update UI
    setPreferences(newPreferences);

    try {
      setUpdating(true);
      await AuthService.updatePushNotificationPreferences(newPreferences);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Push notifications ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Failed to update master toggle:', error);
      // Revert on error
      setPreferences(previousPreferences);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update preferences',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load preferences</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
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
            value={preferences.push_notification_enabled}
            onValueChange={handleMasterToggle}
            trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
            thumbColor={preferences.push_notification_enabled ? '#16a34a' : '#f3f4f6'}
            disabled={updating}
          />
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which types of notifications you want to receive
          </Text>

          {notificationCategories.map((category) => (
            <View key={category.key} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}20` },
                  ]}
                >
                  <category.icon size={20} color={category.color} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences[category.key]}
                onValueChange={(value) => updatePreference(category.key, value)}
                trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                thumbColor={preferences[category.key] ? '#16a34a' : '#f3f4f6'}
                disabled={!preferences.push_notification_enabled || updating}
              />
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={18} color="#3b82f6" />
            <Text style={styles.infoTitle}>About Push Notifications</Text>
          </View>
          <Text style={styles.infoText}>
            • Push notifications help you stay updated in real-time{'\n'}
            • You can customize which categories you want to receive{'\n'}
            • Disabling the master toggle will turn off all notifications{'\n'}
            • Changes take effect immediately
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Updating Indicator */}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="small" color="#16a34a" />
          <Text style={styles.updatingText}>Updating...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  masterToggleSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 24,
  },
  updatingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
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
  updatingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});
