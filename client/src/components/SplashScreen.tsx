import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const BRAND_GREEN = '#1E8E3E';

// Timing constants
const INITIAL_DELAY_MS = 200;
const INTRO_DURATION_MS = 450;
const HOLD_DURATION_MS = 350;
const ZOOM_DURATION_MS = 700;
const FADE_DURATION_MS = 600;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.8)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    // Phase 1 – Intro: text fades in and scales up gently
    const introAnimation = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(brandScale, {
        toValue: 1,
        duration: INTRO_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Phase 2 – Hold: brief pause at full display
    const holdAnimation = Animated.delay(HOLD_DURATION_MS);

    // Phase 3 – Exit: text blasts outward WHILE green screen fades simultaneously
    const exitAnimation = Animated.parallel([
      // Text rockets toward the viewer
      Animated.timing(brandScale, {
        toValue: 10,
        duration: ZOOM_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Text fades out as it zooms (slight delay so it's visible mid-zoom)
      Animated.timing(brandOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        delay: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      // Green screen dissolves away at the same time
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS + 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.sequence([
      Animated.delay(INITIAL_DELAY_MS),
      introAnimation,
      holdAnimation,
      exitAnimation,
    ]);

    sequence.start(({ finished }) => {
      if (finished && !hasFinished.current) {
        hasFinished.current = true;
        onFinish();
      }
    });

    // Also fire onFinish slightly before animation fully ends so home
    // screen can begin loading in the background behind the dissolve
    const earlyCallTimer = setTimeout(() => {
      if (!hasFinished.current) {
        hasFinished.current = true;
        onFinish();
      }
    }, INITIAL_DELAY_MS + INTRO_DURATION_MS + HOLD_DURATION_MS + ZOOM_DURATION_MS - 80);

    return () => {
      sequence.stop();
      clearTimeout(earlyCallTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <View style={styles.brandLockup}>
          <Animated.View
            style={[
              styles.brandStage,
              {
                opacity: brandOpacity,
                transform: [{ scale: brandScale }],
              },
            ]}
          >
            <Text style={styles.brandText}>Scrapiz</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_GREEN,
    zIndex: 10,
  },
  brandLockup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2.2,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'LeagueSpartan-Bold',
  },
});
