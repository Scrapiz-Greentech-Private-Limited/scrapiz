import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REDIRECT_SECONDS = 5;

export default function OrderCancelledScreen() {
  const router = useRouter();
  const { orderId, orderNumber, cancelledBy } = useLocalSearchParams<{
    orderId: string;
    orderNumber?: string;
    cancelledBy?: string;
  }>();
  const { isDark } = useTheme();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const countdownBarAnim = useRef(new Animated.Value(1)).current;

  const isAdminCancelled = (cancelledBy || '').toLowerCase() === 'admin';

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideUpAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    const launchRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    launchRing(ringAnim1, 0);
    launchRing(ringAnim2, 600);
    launchRing(ringAnim3, 1200);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    Animated.timing(countdownBarAnim, {
      toValue: 0,
      duration: REDIRECT_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => {
      router.replace('/(tabs)/home' as any);
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(redirectTimer);
    };
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 2.2],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.6, 0.4, 0],
    }),
  });

  const cancellerLabel = isAdminCancelled ? 'Administrator' : 'You';
  const subMessage = isAdminCancelled
    ? 'Your order has been reviewed and cancelled by our operations team. If you believe this was in error, please contact support.'
    : 'Your cancellation request has been processed successfully. Any active pickup and booking associated with this order have been terminated.';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0f172a', '#1a0a0a', '#2d0a0a', '#1a0505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.gridOverlay} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: (SCREEN_HEIGHT / 12) * i }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: (SCREEN_WIDTH / 8) * i }]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        <Animated.View
          style={[styles.iconSection, { transform: [{ scale: scaleAnim }] }]}
        >
          <Animated.View style={[styles.ring, ringStyle(ringAnim1)]} />
          <Animated.View style={[styles.ring, ringStyle(ringAnim2)]} />
          <Animated.View style={[styles.ring, ringStyle(ringAnim3)]} />

          <Animated.View style={[styles.iconOuterRing, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['rgba(239,68,68,0.18)', 'rgba(185,28,28,0.1)']}
              style={styles.iconOuterRingGradient}
            />
          </Animated.View>

          <View style={styles.iconInnerCircle}>
            <LinearGradient
              colors={['#dc2626', '#991b1b', '#7f1d1d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradientBg}
            >
              <Text style={styles.iconSymbol}>✕</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.textSection, { transform: [{ translateY: slideUpAnim }], opacity: fadeAnim }]}
        >
          <View style={styles.statusBadgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>ORDER TERMINATED</Text>
            </View>
          </View>

          <Text style={styles.headlineText}>Order Cancelled</Text>
          <Text style={styles.subHeadline}>
            Cancelled by{' '}
            <Text style={styles.subHeadlineAccent}>{cancellerLabel}</Text>
          </Text>

          {orderNumber ? (
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumberLabel}>Order Reference</Text>
              <View style={styles.orderNumberBadge}>
                <Text style={styles.orderNumberText}>#{orderNumber}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.dividerLine} />

          <Text style={styles.subMessageText}>{subMessage}</Text>
        </Animated.View>

        <Animated.View
          style={[styles.infoCards, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
        >
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']}
              style={styles.infoCardGradient}
            >
              <Text style={styles.infoCardIcon}>🚫</Text>
              <Text style={styles.infoCardLabel}>Lead</Text>
              <Text style={styles.infoCardValue}>Cancelled</Text>
            </LinearGradient>
          </View>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']}
              style={styles.infoCardGradient}
            >
              <Text style={styles.infoCardIcon}>📦</Text>
              <Text style={styles.infoCardLabel}>Booking</Text>
              <Text style={styles.infoCardValue}>Cancelled</Text>
            </LinearGradient>
          </View>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']}
              style={styles.infoCardGradient}
            >
              <Text style={styles.infoCardIcon}>🔔</Text>
              <Text style={styles.infoCardLabel}>Vendor</Text>
              <Text style={styles.infoCardValue}>Notified</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View style={[styles.redirectSection, { opacity: fadeAnim }]}>
          <View style={styles.redirectCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
              style={styles.redirectCardGradient}
            >
              <View style={styles.redirectTopRow}>
                <View style={styles.redirectIconWrap}>
                  <Text style={styles.redirectIcon}>🏠</Text>
                </View>
                <View style={styles.redirectTextWrap}>
                  <Text style={styles.redirectLabel}>Redirecting to Homepage</Text>
                  <Text style={styles.redirectSublabel}>
                    You will be redirected in{' '}
                    <Text style={styles.redirectCountNum}>{countdown}</Text>s
                  </Text>
                </View>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownCircleText}>{countdown}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: countdownBarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    zIndex: 1,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    width: 160,
    height: 160,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  iconOuterRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  iconOuterRingGradient: {
    flex: 1,
    borderRadius: 66,
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  iconGradientBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  iconSymbol: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 48,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  statusBadgeRow: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
    letterSpacing: 2,
  },
  headlineText: {
    fontSize: 34,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subHeadline: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 16,
  },
  subHeadlineAccent: {
    color: '#ef4444',
    fontFamily: 'Inter-SemiBold',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  orderNumberLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  orderNumberBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderNumberText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(239,68,68,0.3)',
    marginVertical: 16,
  },
  subMessageText: {
    fontSize: 13.5,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  infoCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  infoCardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  infoCardIcon: {
    fontSize: 22,
  },
  infoCardLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoCardValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fca5a5',
  },
  redirectSection: {
    width: '100%',
  },
  redirectCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  redirectCardGradient: {
    padding: 18,
  },
  redirectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  redirectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redirectIcon: {
    fontSize: 20,
  },
  redirectTextWrap: {
    flex: 1,
  },
  redirectLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 3,
  },
  redirectSublabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.45)',
  },
  redirectCountNum: {
    color: '#ef4444',
    fontFamily: 'Inter-Bold',
  },
  countdownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCircleText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
});
