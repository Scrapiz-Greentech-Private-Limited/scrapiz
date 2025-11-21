import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../hooks/useNotifications';
import { LinearGradient } from 'expo-linear-gradient';

const NOTIFICATION_PERMISSION_SHOWN = '@notification_permission_shown';

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { registerForPushNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // Request notification permissions and register token
      await registerForPushNotifications();
      
      // Mark that we've shown this screen
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN, 'true');
      
      // Navigate back to home or previous screen
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      // Even if it fails, mark as shown and continue
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN, 'true');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark that we've shown this screen (user chose to skip)
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN, 'true');
      
      // Navigate back to home or previous screen
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error skipping notifications:', error);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  return (
    <LinearGradient
      colors={['#16a34a', '#15803d']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Notification Icon/Image */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔔</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Stay Updated!</Text>

        {/* Description */}
        <Text style={styles.description}>
          Get instant notifications about your orders, special offers, and important updates.
        </Text>

        {/* Benefits List */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Real-time order status updates</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Exclusive deals and promotions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Important service announcements</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#16a34a" />
            ) : (
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          You can change this anytime in your profile settings
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.9,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 15,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  enableButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enableButtonText: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
