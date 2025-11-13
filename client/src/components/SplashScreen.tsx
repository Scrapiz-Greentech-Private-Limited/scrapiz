import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Platform } from 'react-native';
import { wp, hp, fs } from '../utils/responsive';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    console.log('SplashScreen mounted, Platform:', Platform.OS);
    
    // Ensure splash displays for minimum duration on both platforms
    const startDelay = Platform.OS === 'android' ? 400 : 200;
    
    const timer = setTimeout(() => {
      console.log('Starting splash animations...');
      
      // Start both animations together
      Animated.parallel([
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Progress bar animation
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 4000, // Reduced from 6s to 4s for better UX while ensuring visibility
          useNativeDriver: false,
        }),
      ]).start(() => {
        console.log('Animations complete, finishing splash...');
        if (!hasFinished.current) {
          hasFinished.current = true;
          onFinish();
        }
      });
    }, startDelay);

    // Fallback timeout to ensure splash finishes even if animations fail
    const fallbackTimer = setTimeout(() => {
      if (!hasFinished.current) {
        console.warn('Splash animation timeout, forcing finish');
        hasFinished.current = true;
        onFinish();
      }
    }, 5500); // 5.5s fallback (4s animation + 1.5s buffer)
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* S Icon */}
        <Image 
          source={require('../../assets/images/s.png')}
          style={styles.icon}
          resizeMode="contain"
          fadeDuration={0}
        />
        
        {/* Text below icon */}
        <Text style={styles.subtext}>Sell Scrap, Get Cash</Text>
      </Animated.View>

      {/* Animated Progress Line at Bottom */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View 
            style={[
              styles.progressBar,
              { width: progressWidth }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: wp(10),
    marginBottom: hp(10), // Push content up to avoid overlap with progress bar
  },
  icon: {
    width: wp(40),
    height: wp(40),
    marginBottom: hp(1.5), // Increased from hp(1) for better spacing
    ...Platform.select({
      android: {
        // Force proper rendering on Android
        backgroundColor: 'transparent',
      },
    }),
  },
  text: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#16a34a',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: hp(0.5),
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  subtext: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: hp(2), // Reduced from hp(4) to prevent overlap
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  progressContainer: {
    position: 'absolute',
    bottom: hp(20), // Lowered from hp(38) to prevent overlap on smaller iPhones
    left: wp(10),
    right: wp(10),
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 10,
  },
});
