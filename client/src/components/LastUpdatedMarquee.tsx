import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fs, spacing } from '../utils/responsive';

interface LastUpdatedMarqueeProps {
  lastUpdated?: Date;
}

export const LastUpdatedMarquee: React.FC<LastUpdatedMarqueeProps> = ({
  lastUpdated = new Date(),
}) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Continuous scroll animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollAnim, {
          toValue: -300,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.scrollContainer,
              {
                transform: [{ translateX: scrollAnim }],
              },
            ]}
          >
            <View style={styles.item}>
              <Clock size={fs(14)} color="#16a34a" strokeWidth={2.5} />
              <Text style={styles.text}>
                Last Updated: {formattedDate} at {formattedTime}
              </Text>
            </View>
            <View style={styles.item}>
              <Clock size={fs(14)} color="#16a34a" strokeWidth={2.5} />
              <Text style={styles.text}>
                Last Updated: {formattedDate} at {formattedTime}
              </Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(20),
    borderRadius: spacing(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    overflow: 'hidden',
  },
  content: {
    height: spacing(36),
    overflow: 'hidden',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    gap: spacing(8),
    minWidth: 300,
  },
  text: {
    fontSize: fs(13),
    color: '#166534',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
