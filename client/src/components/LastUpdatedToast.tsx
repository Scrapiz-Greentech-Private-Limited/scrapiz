import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Clock, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fs, spacing } from '../utils/responsive';

interface LastUpdatedToastProps {
  lastUpdated?: Date;
  autoShow?: boolean;
  duration?: number; // How long to show the toast (ms)
  countdownFrom?: number; // Countdown seconds before showing date
}

const { width } = Dimensions.get('window');

export const LastUpdatedToast: React.FC<LastUpdatedToastProps> = ({
  lastUpdated = new Date(),
  autoShow = true,
  duration = 4000,
  countdownFrom = 5,
}) => {
  const [countdown, setCountdown] = useState(countdownFrom);
  const [showDate, setShowDate] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!autoShow) return;

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowDate(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show toast with animation
    setIsVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration + (countdownFrom * 1000),
      useNativeDriver: false, // width animation requires false
    }).start();

    // Hide toast after duration
    const hideTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }, duration + (countdownFrom * 1000));

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(hideTimeout);
    };
  }, [autoShow, duration, countdownFrom]);

  if (!isVisible) return null;

  const formattedDate = lastUpdated.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = lastUpdated.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing(8), // Add safe area top inset
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={['#16a34a', '#15803d', '#14532d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {!showDate ? (
            // Countdown phase
            <>
              <View style={styles.iconContainer}>
                <Clock size={fs(18)} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.countdownLabel}>Updating rates in</Text>
                <Animated.View
                  style={[
                    styles.countdownBadge,
                    {
                      transform: [
                        {
                          scale: scaleAnim.interpolate({
                            inputRange: [0.8, 1],
                            outputRange: [0.9, 1.1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                </Animated.View>
              </View>
            </>
          ) : (
            // Date display phase
            <>
              <View style={styles.iconContainer}>
                <TrendingUp size={fs(18)} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Last Updated</Text>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.date}>{formattedDate}</Text>
                  <View style={styles.timeBadge}>
                    <Text style={styles.time}>{formattedTime}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Animated progress bar - using scaleX instead of width */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                transform: [
                  {
                    scaleX: progressAnim,
                  },
                ],
              },
            ]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing(20),
    right: spacing(20),
    zIndex: 1000,
    borderRadius: spacing(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    borderRadius: spacing(16),
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(14),
    gap: spacing(12),
  },
  iconContainer: {
    width: spacing(36),
    height: spacing(36),
    borderRadius: spacing(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  countdownLabel: {
    fontSize: fs(13),
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  countdownBadge: {
    width: spacing(28),
    height: spacing(28),
    borderRadius: spacing(14),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  countdownNumber: {
    fontSize: fs(16),
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  label: {
    fontSize: fs(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    flex: 1,
  },
  date: {
    fontSize: fs(14),
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  timeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(4),
    borderRadius: spacing(8),
  },
  time: {
    fontSize: fs(11),
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: '100%',
    transformOrigin: 'left',
  },
});
