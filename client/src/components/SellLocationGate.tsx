import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, ArrowRight, CheckCircle2, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { setSellServiceability } from '../utils/sellServiceability';

const { width } = Dimensions.get('window');
const mapAsset = require('../../assets/images/asset.png');

interface SellLocationGateProps {
  onServiceable: () => void;
  onNotServiceable: () => void;
}

export default function SellLocationGate({ onServiceable, onNotServiceable }: SellLocationGateProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { 
    setLocationFromPincode, 
    serviceAvailable, 
    getCurrentLocation, 
    currentLocation, 
    isLoading: locationLoading, 
    error: locationError 
  } = useLocation();
  
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  useEffect(() => {
    if (isUsingGPS && currentLocation && !locationLoading) {
      handleServiceabilityResult(serviceAvailable);
      setIsUsingGPS(false);
    }
  }, [currentLocation, serviceAvailable, locationLoading, isUsingGPS]);

  useEffect(() => {
    if (locationError && isUsingGPS) {
      setError(locationError);
      setIsUsingGPS(false);
    }
  }, [locationError, isUsingGPS]);

  const handleServiceabilityResult = async (isServiceable: boolean) => {
    await setSellServiceability(isServiceable);
    if (isServiceable) {
      onServiceable();
    } else {
      onNotServiceable();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSubmit = async () => {
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setError('');

    try {
      const success = await setLocationFromPincode(pincode);
      await handleServiceabilityResult(success);
    } catch (error) {
      setError('Connection issue. Please check internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsUsingGPS(true);
    setError('');
    Keyboard.dismiss();

    try {
      await getCurrentLocation();
      
      setTimeout(() => {
        if (locationError) {
          setError(locationError);
          setIsUsingGPS(false);
          return;
        }

        if (currentLocation) {
          handleServiceabilityResult(serviceAvailable);
        }
        setIsUsingGPS(false);
      }, 1000);
    } catch (err) {
      setError('Failed to get your location. Please try again or enter PIN code manually.');
      setIsUsingGPS(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#064e3b', colors.background] : ['#f0fdf4', '#ffffff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={styles.gradient}
        />

        <View style={[styles.decorativeCircle1, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.3)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.2)' }]} />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View 
            style={[styles.content, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.heroSection}>
              <Animated.View 
                style={{ 
                  transform: [
                    { scale: scaleAnim },
                    { scale: pulseAnim }
                  ] 
                }}
              >
                <Image 
                  source={mapAsset}
                  resizeMode="contain"
                  style={{
                    width: width * 0.85,
                    height: undefined,
                    aspectRatio: 1.8,
                  }}
                />
              </Animated.View>

              <Text style={[styles.title, { color: colors.text }]}>
                Set Your <Text style={{ color: colors.primary }}>Location</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your area PIN code to check if we service your location.
              </Text>
            </View>

            <Animated.View 
              style={[
                styles.inputCard,
                { 
                  transform: [{ scale: inputScale }],
                  backgroundColor: colors.surface,
                  borderColor: isFocused ? colors.primary : error ? '#ef4444' : colors.border,
                  borderWidth: isFocused || error ? 2 : 1,
                }
              ]}
            >
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Postal Code
                </Text>
                
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="000 000"
                  placeholderTextColor={colors.textTertiary}
                  value={pincode}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                    setPincode(cleaned);
                    if (error) setError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  selectionColor={colors.primary}
                />
              </View>
            </Animated.View>

            {error ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <View style={styles.benefitsRow}>
                <View style={styles.benefitItem}>
                  <CheckCircle2 size={14} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Best Rates</Text>
                </View>
                <View style={[styles.benefitDivider, { backgroundColor: colors.border }]} />
                <View style={styles.benefitItem}>
                  <CheckCircle2 size={14} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Instant Cash</Text>
                </View>
              </View>
            )}

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || pincode.length !== 6}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={pincode.length === 6 
                    ? (isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']) 
                    : ['#cbd5e1', '#94a3b8']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Check Availability</Text>
                      <ArrowRight size={24} color="white" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.gpsButton, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}
                onPress={handleUseCurrentLocation}
                disabled={isUsingGPS || locationLoading}
                activeOpacity={0.7}
              >
                {isUsingGPS || locationLoading ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.gpsButtonText, { color: colors.primary }]}>Getting location...</Text>
                  </>
                ) : (
                  <>
                    <Navigation size={16} color={colors.primary} fill={colors.primary} />
                    <Text style={[styles.gpsButtonText, { color: colors.primary }]}>Use my current location</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    width: 192,
    height: 192,
    borderRadius: 96,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  inputCard: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  input: {
    fontSize: 36,
    fontWeight: '900',
    width: '100%',
    textAlign: 'center',
    letterSpacing: 8,
  },
  errorContainer: {
    marginTop: 16,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  benefitsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    opacity: 0.6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  benefitDivider: {
    width: 1,
    height: 16,
  },
  actionsContainer: {
    marginTop: 40,
  },
  submitButton: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
  },
  gpsButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  gpsButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
