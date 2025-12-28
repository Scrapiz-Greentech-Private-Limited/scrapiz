import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { wp, hp, fs, spacing } from '../utils/responsive';

interface NetworkRetryOverlayProps {
  visible: boolean;
  countdown: number;
  isRetrying: boolean;
  hasFailedPermanently: boolean;
  errorMessage?: string;
  onRetryNow: () => void;
  onDismiss?: () => void;
}

/**
 * NetworkRetryOverlay - A professional retry dialog with blur background
 * Features:
 * - Animated WiFi icon with pulse effect
 * - Countdown timer (5, 4, 3, 2, 1)
 * - Blur background for modern look
 * - "Try Again" button after permanent failure
 * - Dark/Light theme support
 * - Localization support
 */
export default function NetworkRetryOverlay({
  visible,
  countdown,
  isRetrying,
  hasFailedPermanently,
  errorMessage,
  onRetryNow,
  onDismiss,
}: NetworkRetryOverlayProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pulse animation for WiFi icon
  useEffect(() => {
    if (visible && !hasFailedPermanently) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, hasFailedPermanently]);

  // Rotation animation for retry spinner
  useEffect(() => {
    if (isRetrying) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isRetrying]);

  // Entry animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon Container */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: hasFailedPermanently
                  ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                  : (isDark ? 'rgba(251, 191, 36, 0.15)' : '#fffbeb'),
                transform: [{ scale: isRetrying ? 1 : pulseAnim }],
              },
            ]}
          >
            {isRetrying ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw
                  size={48}
                  color={isDark ? '#fbbf24' : '#f59e0b'}
                  strokeWidth={2}
                />
              </Animated.View>
            ) : hasFailedPermanently ? (
              <AlertCircle size={48} color="#ef4444" strokeWidth={2} />
            ) : (
              <WifiOff
                size={48}
                color={isDark ? '#fbbf24' : '#f59e0b'}
                strokeWidth={2}
              />
            )}
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {isRetrying
              ? (t('networkRetry.connecting') || 'Connecting...')
              : hasFailedPermanently
              ? (t('networkRetry.connectionFailed') || 'Connection Failed')
              : (t('networkRetry.noConnection') || 'No Internet Connection')}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {isRetrying
              ? (t('networkRetry.pleaseWait') || 'Please wait while we reconnect...')
              : hasFailedPermanently
              ? (errorMessage || t('networkRetry.unableToConnect') || 'Unable to connect to the server')
              : (t('networkRetry.checkConnection') || 'Please check your internet connection')}
          </Text>

          {/* Countdown or Retry Button */}
          {!hasFailedPermanently && !isRetrying && countdown > 0 && (
            <View
              style={[
                styles.countdownContainer,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' },
              ]}
            >
              <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
                {t('networkRetry.retryingIn') || 'Retrying in'}
              </Text>
              <Text style={[styles.countdownNumber, { color: colors.primary }]}>
                {countdown}
              </Text>
              <Text style={[styles.countdownUnit, { color: colors.textSecondary }]}>
                {countdown === 1 ? (t('networkRetry.second') || 'second') : (t('networkRetry.seconds') || 'seconds')}
              </Text>
            </View>
          )}

          {/* Retry Now Button */}
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: hasFailedPermanently ? '#ef4444' : colors.primary,
                opacity: isRetrying ? 0.7 : 1,
              },
            ]}
            onPress={onRetryNow}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw size={20} color="#ffffff" strokeWidth={2.5} />
              </Animated.View>
            ) : (
              <RefreshCw size={20} color="#ffffff" strokeWidth={2.5} />
            )}
            <Text style={styles.retryButtonText}>
              {isRetrying
                ? (t('networkRetry.retrying') || 'Retrying...')
                : hasFailedPermanently
                ? (t('networkRetry.tryAgain') || 'Try Again')
                : (t('networkRetry.retryNow') || 'Retry Now')}
            </Text>
          </TouchableOpacity>

          {/* Progress dots for countdown */}
          {!hasFailedPermanently && !isRetrying && countdown > 0 && (
            <View style={styles.dotsContainer}>
              {[5, 4, 3, 2, 1].map((num) => (
                <View
                  key={num}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        countdown >= num
                          ? colors.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: spacing(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(20),
  },
  title: {
    fontSize: fs(20),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(8),
  },
  message: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: spacing(20),
    paddingHorizontal: spacing(8),
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(20),
    borderRadius: 16,
    marginBottom: spacing(16),
    gap: spacing(6),
  },
  countdownLabel: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  countdownNumber: {
    fontSize: fs(32),
    fontWeight: '800',
  },
  countdownUnit: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(28),
    borderRadius: 14,
    gap: spacing(8),
    width: '100%',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: fs(16),
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(8),
    marginTop: spacing(16),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
