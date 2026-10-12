import React, { useRef, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  Image,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WIDGET_SIZE = 52;

interface FloatingMascotWidgetProps {
  /** Optional initial Y position (defaults to right over search bar) */
  initialY?: number;
  /** Optional initial X position (defaults to right edge) */
  initialX?: number;
}

export default function FloatingMascotWidget({
  initialY,
  initialX,
}: FloatingMascotWidgetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Initial position aligned near the search bar on the right side
  const defaultInitialX = SCREEN_WIDTH - WIDGET_SIZE - 16;
  const defaultInitialY = initialY ?? Math.max(insets.top + 74, 94);

  // Position value for dragging
  const pan = useRef(
    new Animated.ValueXY({
      x: initialX ?? defaultInitialX,
      y: defaultInitialY,
    })
  ).current;

  // Hovering levitation animation (native driver)
  const hoverAnim = useRef(new Animated.Value(0)).current;

  // Scale feedback on touch (native driver)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Keep track of current coordinates for pan offsets
  const currentPos = useRef({
    x: initialX ?? defaultInitialX,
    y: defaultInitialY,
  });

  const touchStartTime = useRef(0);

  useEffect(() => {
    // Floating hovering loop (gentle bobbing up & down with native driver)
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -5,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 2,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    return () => {
      hoverLoop.stop();
    };
  }, [hoverAnim]);

  const openAssistant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/scrappy-assistant' as any);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.hypot(gestureState.dx, gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        touchStartTime.current = Date.now();

        Animated.spring(scaleAnim, {
          toValue: 1.06,
          friction: 6,
          useNativeDriver: true,
        }).start();

        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();

        const moveDistance = Math.hypot(gestureState.dx, gestureState.dy);
        const duration = Date.now() - touchStartTime.current;
        const isTap = moveDistance < 6 && duration < 400;

        if (isTap) {
          openAssistant();
          return;
        }

        // Clamp to screen boundaries on drag release
        const minX = 12;
        const maxX = SCREEN_WIDTH - WIDGET_SIZE - 12;
        const minY = Math.max(insets.top + 8, 20);
        const maxY = SCREEN_HEIGHT - insets.bottom - WIDGET_SIZE - 75;

        let targetX = currentPos.current.x + gestureState.dx;
        let targetY = currentPos.current.y + gestureState.dy;

        targetX = Math.max(minX, Math.min(targetX, maxX));
        targetY = Math.max(minY, Math.min(targetY, maxY));

        currentPos.current = { x: targetX, y: targetY };

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.innerHover,
          {
            transform: [{ translateY: hoverAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Clean Mascot Widget without green highlights or AI badge */}
        <View style={styles.widgetCard}>
          <Image
            source={require('../../assets/images/widget_logo.png')}
            style={styles.mascotImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    zIndex: 9999,
    elevation: 12,
  },
  innerHover: {
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
  },
  widgetCard: {
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});
