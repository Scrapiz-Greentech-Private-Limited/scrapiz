import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Rocket, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { WaitlistService, ServiceabilityAPI, ServiceableCity } from '../api/apiService';

interface SellServiceUnavailableProps {
  onGoHome: () => void;
  onRetryPincode?: () => void;
}

export default function SellServiceUnavailable({ onGoHome, onRetryPincode }: SellServiceUnavailableProps) {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comingSoonCities, setComingSoonCities] = useState<ServiceableCity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  const cityName = currentLocation?.city || 'your city';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchComingSoonCities = async () => {
      try {
        setIsLoadingCities(true);
        const cities = await ServiceabilityAPI.getCities();
        const comingSoon = cities.filter(city => city.status === 'coming_soon');
        setComingSoonCities(comingSoon);
      } catch (error) {
        console.error('Failed to fetch coming soon cities:', error);
        setComingSoonCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchComingSoonCities();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNotifyMe = async () => {
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Required', 'Please enter your email or phone number');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.replace(/[\s\-()]/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await WaitlistService.submitWaitlist({
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
        city: cityName,
      });

      setEmail('');
      setPhone('');

      Alert.alert(
        '🎉 Success!',
        response.message || `Thank you for your interest! We'll notify you as soon as Scrapiz launches in ${cityName}.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const errorDetails = error.response?.data?.details;
      let errorMessage = 'Failed to save your details. Please try again.';

      if (errorDetails) {
        const errors = Object.entries(errorDetails)
          .map(([field, messages]) => {
            const fieldName = field === 'phone_number' ? 'Phone' : field.charAt(0).toUpperCase() + field.slice(1);
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        errorMessage = errors;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.illustrationContainer,
              { transform: [{ translateY: bounceAnim }] }
            ]}
          >
            <View style={[styles.rocketContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7' }]}>
              <Rocket size={80} color={colors.primary} strokeWidth={1.5} />
            </View>
          </Animated.View>

          <Text style={[styles.title, { color: colors.text }]}>Coming Soon to {cityName}!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We're not in {cityName} yet, but we're expanding fast across India! 🚀
          </Text>

          {/* Notify Me Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Get Notified When We Launch</Text>
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '');
                    if (cleaned.length <= 10) {
                      setPhone(cleaned);
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.notifyButton}
              onPress={handleNotifyMe}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Bell size={20} color="white" strokeWidth={2.5} />
                    <Text style={styles.buttonText}>Notify Me</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Expanding Cities */}
          {!isLoadingCities && comingSoonCities.length > 0 && (
            <View style={[styles.citiesContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.citiesTitle, { color: colors.text }]}>Expanding to:</Text>
              <View style={styles.citiesGrid}>
                {comingSoonCities.slice(0, 6).map((city) => (
                  <View key={city.id} style={[styles.cityChip, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4', borderColor: isDark ? colors.primary : '#bbf7d0' }]}>
                    <MapPin size={14} color={colors.primary} />
                    <Text style={[styles.cityName, { color: isDark ? '#86efac' : '#166534' }]}>{city.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isLoadingCities && (
            <View style={[styles.citiesContainer, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading cities...</Text>
            </View>
          )}

          {/* Retry Pincode Button */}
          {onRetryPincode && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef9f0', borderColor: '#f59e0b' }]}
              onPress={onRetryPincode}
              activeOpacity={0.8}
            >
              <MapPin size={20} color="#f59e0b" />
              <Text style={[styles.retryButtonText, { color: '#f59e0b' }]}>Entered Wrong Pincode?</Text>
            </TouchableOpacity>
          )}

          {/* Go to Home Button */}
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onGoHome}
            activeOpacity={0.8}
          >
            <Home size={20} color={colors.primary} />
            <Text style={[styles.homeButtonText, { color: colors.primary }]}>Go to Home</Text>
          </TouchableOpacity>

          {/* Footer Note */}
          <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
            🌱 As a bootstrapped startup, we're building Scrapiz sustainably. Every city we expand to is carefully planned for quality service!
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  rocketContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  notifyButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  citiesContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  citiesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  cityName: {
    fontSize: 13,
    fontWeight: '600',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 24,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 12,
    width: '100%',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
