import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  Smartphone, 
  Key, 
  Trash2, 
  ChevronRight,
  AlertCircle 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface PrivacySettings {
  biometricAuth: boolean;
  dataSharing: boolean;
  locationTracking: boolean;
  analyticsData: boolean;
}
interface HeaderComponentProps {
  onBackPress: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <ArrowLeft size={24} color="#111827" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Privacy & Security</Text>
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

const SavingIndicatorComponent: React.FC = () => (
  <View style={styles.savingOverlay}>
    <ActivityIndicator size="small" color="#16a34a" />
    <Text style={styles.savingText}>Processing...</Text>
  </View>
);

export default function  PrivacySecurityScreen() {
    const router = useRouter()
    const [settings, setSettings] = useState<PrivacySettings>({
    biometricAuth: true,
    dataSharing: false,
    locationTracking: true,
    analyticsData: false,
    });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    loadPrivacySettings();
  },[])

  const loadPrivacySettings = async() =>{
    try{
        setLoading(true);
         const storedSettings = await AsyncStorage.getItem('privacySettings');
         if(storedSettings) setSettings(JSON.parse(storedSettings));

    }catch(err:any){
        console.error('Error loading privacy settings:', err);
        setError('Failed to load settings');
    }finally{
        setLoading(false);
    }
  }
  const updateSetting = useCallback(async (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
    } catch (err: any) {
      console.error('Error saving privacy setting:', err);
      setError('Failed to save setting');
      // Rollback on failure
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }, [settings]);


  const handleChangePassword = () => {
    router.push('/auth/forgot-password' as any);
  };
  const handleTwoFactorAuth = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Two-factor authentication adds an extra layer of security to your account. This feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: confirmDeleteAccount 
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await AuthService.deleteUser();
      
      // Clear all local data
      await AsyncStorage.multiRemove(['authToken', 'privacySettings']);
      
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login' as any)
          }
        ]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete account';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy details how we collect, use, and protect your personal information. Visit our website to read the full policy.',
      [{ text: 'OK' }]
    );
  };

  const securityOptions = [
    {
      icon: Lock,
      title: 'Change Password',
      subtitle: 'Update your account password',
      action: handleChangePassword,
      color: '#3b82f6',
    },
    {
      icon: Key,
      title: 'Two-Factor Authentication',
      subtitle: 'Add an extra layer of security',
      action: handleTwoFactorAuth,
      color: '#16a34a',
    },
  ];

  const privacySettings = [
    {
      key: 'biometricAuth' as keyof PrivacySettings,
      title: 'Biometric Authentication',
      subtitle: 'Use fingerprint or face ID to unlock',
      icon: Smartphone,
      color: '#8b5cf6',
    },
    {
      key: 'locationTracking' as keyof PrivacySettings,
      title: 'Location Services',
      subtitle: 'Allow location access for pickup services',
      icon: Eye,
      color: '#f59e0b',
    },
    {
      key: 'dataSharing' as keyof PrivacySettings,
      title: 'Data Sharing',
      subtitle: 'Share usage data with partners',
      icon: Shield,
      color: '#06b6d4',
    },
    {
      key: 'analyticsData' as keyof PrivacySettings,
      title: 'Analytics Data',
      subtitle: 'Help improve app performance',
      icon: Eye,
      color: '#ec4899',
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderComponent onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderComponent onBackPress={() => router.back()} />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {securityOptions.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.optionItem} 
              onPress={option.action}
              disabled={saving}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                  <option.icon size={20} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          {privacySettings.map((setting) => (
            <View key={setting.key} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${setting.color}20` }]}>
                  <setting.icon size={20} color={setting.color} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={settings[setting.key]}
                onValueChange={(value) => updateSetting(setting.key, value)}
                trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                thumbColor={settings[setting.key] ? '#16a34a' : '#f3f4f6'}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity 
            style={styles.dangerItem} 
            onPress={handleDeleteAccount}
            disabled={saving}
          >
            <View style={styles.dangerLeft}>
              <View style={styles.dangerIcon}>
                <Trash2 size={20} color="#dc2626" />
              </View>
              <View style={styles.dangerContent}>
                <Text style={styles.dangerTitle}>Delete Account</Text>
                <Text style={styles.dangerSubtitle}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoText}>
            We take your privacy seriously. Your personal data is encrypted and stored securely. 
            You have full control over what information you share with us.
          </Text>
          <TouchableOpacity 
            style={styles.privacyPolicyButton}
            onPress={handlePrivacyPolicy}
          >
            <Text style={styles.privacyPolicyText}>Read Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {saving && <SavingIndicatorComponent />}
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 20,
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  optionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  dangerItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerContent: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
    marginBottom: 2,
  },
  dangerSubtitle: {
    fontSize: 12,
    color: '#991b1b',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
    marginBottom: 12,
  },
  privacyPolicyButton: {
    alignSelf: 'flex-start',
  },
  privacyPolicyText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
    textDecorationLine: 'underline',
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