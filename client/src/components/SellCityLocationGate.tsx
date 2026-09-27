import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Easing,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { CheckCircle2, ChevronRight, MapPin } from 'lucide-react-native';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { ServiceabilityAPI } from '../api/apiService';
import { setSellServiceability } from '../utils/sellServiceability';

const { width } = Dimensions.get('window');
const mapAsset = require('../../assets/images/asset.png');
const THUMB_SIZE = 58;
const TRACK_PADDING = 6;
const COMPLETE_THRESHOLD = 0.82;

interface SellCityLocationGateProps {
  onServiceable: () => void;
  onNotServiceable: () => void;
  onPincodeFallback: () => void;
}

export default function SellCityLocationGate({
  onServiceable,
  onNotServiceable,
  onPincodeFallback,
}: SellCityLocationGateProps) {
  const { colors, isDark } = useTheme();
  const {
    getCurrentLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useLocation();

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isAwaitingResult, setIsAwaitingResult] = useState(false);
  const [showPincodeFallback, setShowPincodeFallback] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragValueRef = useRef(0);
  const dragStartRef = useRef(0);
  const requestAttemptRef = useRef(0);
  const requestStartedRef = useRef(false);
  const requestFinishedRef = useRef(false);
  const committedReleaseRef = useRef(false);
  const pendingResultRef = useRef<boolean | null>(null);
  const requestErrorRef = useRef<string | null>(null);
  const loadingHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxDrag = Math.max(trackWidth - THUMB_SIZE - TRACK_PADDING * 2, 0);
  const fillBaseWidth = useMemo(() => new Animated.Value(THUMB_SIZE), []);

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
  }, [pulseAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    if (locationError && isChecking) {
      setError(locationError);
      setIsChecking(false);
      resetSlider();
    }
  }, [isChecking, locationError]);

  useEffect(() => {
    return () => {
      if (loadingHintTimerRef.current) {
        clearTimeout(loadingHintTimerRef.current);
      }
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []);

  const updateDragPosition = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(maxDrag, value));
    dragValueRef.current = clampedValue;
    dragX.setValue(clampedValue);

    if (maxDrag <= 0) {
      setProgressPercent(0);
      return;
    }

    const nextPercent = Math.max(0, Math.min(100, Math.round((clampedValue / maxDrag) * 100)));
    setProgressPercent(nextPercent);
  }, [dragX, maxDrag]);

  const animateDragTo = useCallback((value: number, callback?: () => void) => {
    const clampedValue = Math.max(0, Math.min(maxDrag, value));
    const startValue = dragValueRef.current;
    const startedAt = Date.now();
    const duration = 220;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / duration, 1);
      const easedRatio = Easing.out(Easing.ease)(ratio);
      const nextValue = startValue + (clampedValue - startValue) * easedRatio;
      updateDragPosition(nextValue);

      if (ratio < 1) {
        requestAnimationFrame(tick);
        return;
      }

      callback?.();
    };

    requestAnimationFrame(tick);
  }, [dragX, maxDrag, updateDragPosition]);

  const clearDelayHintTimer = useCallback(() => {
    if (loadingHintTimerRef.current) {
      clearTimeout(loadingHintTimerRef.current);
      loadingHintTimerRef.current = null;
    }
  }, []);

  const resetRequestState = useCallback(() => {
    requestStartedRef.current = false;
    requestFinishedRef.current = false;
    committedReleaseRef.current = false;
    pendingResultRef.current = null;
    requestErrorRef.current = null;
    setIsAwaitingResult(false);
    setShowPincodeFallback(false);
    clearDelayHintTimer();
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
  }, [clearDelayHintTimer]);

  const resetSlider = useCallback(() => {
    dragStartRef.current = 0;
    resetRequestState();
    updateDragPosition(0);
  }, [resetRequestState, updateDragPosition]);

  const finalizeVerification = useCallback(async (serviceable: boolean) => {
    setIsAwaitingResult(false);
    setShowPincodeFallback(false);
    clearDelayHintTimer();
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
    await setSellServiceability(serviceable);
    if (serviceable) {
      onServiceable();
      return;
    }
    onNotServiceable();
  }, [clearDelayHintTimer, onNotServiceable, onServiceable]);

  const startLongWaitHint = useCallback(() => {
    clearDelayHintTimer();
    verificationTimeoutRef.current = setTimeout(() => {
      if (committedReleaseRef.current && !requestFinishedRef.current) {
        requestAttemptRef.current += 1;
        requestStartedRef.current = false;
        setIsChecking(false);
        setIsAwaitingResult(false);
        setShowPincodeFallback(true);
        Toast.show({
          type: 'error',
          text1: 'We are having trouble checking your city',
          text2: 'Please enter your pincode to continue.',
          visibilityTime: 4500,
        });
      }
    }, 30000);
  }, [clearDelayHintTimer]);

  const beginVerificationRequest = useCallback(async (attemptId: number) => {
    if (requestStartedRef.current) {
      return;
    }

    requestStartedRef.current = true;
    requestFinishedRef.current = false;
    pendingResultRef.current = null;
    requestErrorRef.current = null;
    setError('');
    try {
      const nextLocation = await getCurrentLocation();
      if (!nextLocation) {
        throw new Error('Unable to determine your current location.');
      }

      const result = await ServiceabilityAPI.checkCityGateCoordinates(
        nextLocation.latitude,
        nextLocation.longitude
      );

      if (requestAttemptRef.current !== attemptId) {
        return;
      }

      requestFinishedRef.current = true;
      pendingResultRef.current = result.serviceable;

      if (committedReleaseRef.current) {
        setIsChecking(false);
        void finalizeVerification(result.serviceable);
        return;
      }
    } catch (err: any) {
      if (requestAttemptRef.current !== attemptId) {
        return;
      }

      requestFinishedRef.current = true;
      requestErrorRef.current = err?.message || 'Unable to verify your city right now. Please try again.';
      if (committedReleaseRef.current) {
        setError(requestErrorRef.current || 'Unable to verify your city right now. Please try again.');
        resetSlider();
      }
    }
  }, [finalizeVerification, getCurrentLocation, resetSlider]);

  const commitVerification = useCallback(() => {
    committedReleaseRef.current = true;
    updateDragPosition(maxDrag);
    setProgressPercent(100);
    setIsAwaitingResult(true);
    startLongWaitHint();

    if (requestFinishedRef.current) {
      setIsChecking(false);
      if (requestErrorRef.current) {
        setError(requestErrorRef.current);
        resetSlider();
        return;
      }
      if (pendingResultRef.current !== null) {
        void finalizeVerification(pendingResultRef.current);
      }
    }
  }, [finalizeVerification, maxDrag, resetSlider, startLongWaitHint, updateDragPosition]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isAwaitingResult && !locationLoading && maxDrag > 0,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !isAwaitingResult && !locationLoading && maxDrag > 0 && Math.abs(gestureState.dx) > 4,
        onPanResponderGrant: () => {
          requestAttemptRef.current += 1;
          dragStartRef.current = dragValueRef.current;
          setError('');
          setShowPincodeFallback(false);
          setIsChecking(true);
          beginVerificationRequest(requestAttemptRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          const nextValue = Math.max(0, Math.min(maxDrag, dragStartRef.current + gestureState.dx));
          updateDragPosition(nextValue);
        },
        onPanResponderRelease: () => {
          const shouldComplete = maxDrag > 0 && dragValueRef.current >= maxDrag * COMPLETE_THRESHOLD;
          if (shouldComplete) {
            animateDragTo(maxDrag, commitVerification);
            return;
          }
          requestAttemptRef.current += 1;
          setIsChecking(false);
          resetSlider();
        },
        onPanResponderTerminate: () => {
          requestAttemptRef.current += 1;
          setIsChecking(false);
          resetSlider();
        },
      }),
    [
      animateDragTo,
      beginVerificationRequest,
      commitVerification,
      isAwaitingResult,
      locationLoading,
      maxDrag,
      resetSlider,
      updateDragPosition,
    ]
  );

  const sliderLabel = isAwaitingResult
    ? 'Finishing verification'
    : isChecking || locationLoading
    ? 'Preparing your location check'
    : progressPercent >= 100
      ? 'Release to verify'
      : 'Slide to verify your city';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#064e3b', colors.background] : ['#f0fdf4', '#ffffff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={styles.gradient}
        />

        <View
          style={[
            styles.decorativeCircle1,
            { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.3)' },
          ]}
        />
        <View
          style={[
            styles.decorativeCircle2,
            { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.2)' },
          ]}
        />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.heroSection}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }, { scale: pulseAnim }] }}>
                <Image
                  source={mapAsset}
                  resizeMode="contain"
                  style={{ width: width * 0.85, height: undefined, aspectRatio: 1.8 }}
                />
              </Animated.View>

              <Text style={[styles.title, { color: colors.text }]}>
                Verify Your <Text style={{ color: colors.primary }}>City</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Share your live location and we&apos;ll confirm whether your pickup request can start
                right now.
              </Text>
            </View>

            <View style={[styles.messageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.messageIconWrap, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#f0fdf4' }]}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.messageBody}>
                <Text style={[styles.messageTitle, { color: colors.text }]}>Live location verification</Text>
                <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                  Slide once to share your GPS and begin an instant availability check.
                </Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorDot} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <View style={styles.readyRow}>
                <CheckCircle2 size={15} color={colors.primary} />
                <Text style={[styles.readyText, { color: colors.textSecondary }]}>
                  One gesture starts verification and checks your current location.
                </Text>
              </View>
            )}

            <View
              style={[
                styles.sliderShell,
                {
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.7)' : '#e7f8ec',
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.14)' : 'rgba(22, 163, 74, 0.12)',
                },
              ]}
              onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  styles.sliderProgress,
                  {
                    width: Animated.add(dragX, fillBaseWidth),
                    backgroundColor: isDark ? '#16a34a' : '#22c55e',
                  },
                ]}
              />

              <View style={styles.sliderContent}>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.sliderThumb,
                    {
                      backgroundColor: '#ffffff',
                      transform: [{ translateX: dragX }],
                      opacity: locationLoading || isAwaitingResult ? 0.92 : 1,
                    },
                  ]}
                >
                  {isAwaitingResult ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : locationLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ChevronRight size={24} color={colors.primary} strokeWidth={2.6} />
                  )}
                </Animated.View>

                <View style={styles.sliderTextWrap} pointerEvents="none">
                  <Text style={styles.sliderLabel}>{sliderLabel}</Text>
                  <Text style={styles.sliderPercent}>
                    {isAwaitingResult ? '100%' : `${progressPercent}%`}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {showPincodeFallback && (
          <View style={styles.pincodeFallback}>
            <Text style={[styles.fallbackTitle, { color: colors.text }]}>Use pincode instead</Text>
            <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Enter your pincode to verify serviceability.</Text>
            <TouchableWithoutFeedback onPress={onPincodeFallback}>
              <View style={[styles.fallbackButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.fallbackButtonText}>Enter pincode</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: 'absolute', width: '100%', height: '100%' },
  decorativeCircle1: { position: 'absolute', top: -80, right: -80, width: 256, height: 256, borderRadius: 128 },
  decorativeCircle2: { position: 'absolute', bottom: 0, left: -40, width: 192, height: 192, borderRadius: 96 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  heroSection: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 23, maxWidth: 320 },
  messageCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBody: { flex: 1 },
  messageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  messageText: { fontSize: 14, lineHeight: 21 },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  readyText: { fontSize: 13, textAlign: 'center', flex: 1 },
  errorContainer: {
    marginBottom: 18,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center', flex: 1 },
  sliderShell: {
    height: 78,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: TRACK_PADDING,
  },
  sliderProgress: {
    position: 'absolute',
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: 24,
  },
  sliderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sliderThumb: {
    position: 'absolute',
    left: TRACK_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803d',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  sliderTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 68,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  sliderPercent: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  delayModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  delayModalCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  delayTextWrap: { flex: 1 },
  delayTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  delaySubtitle: { fontSize: 12, lineHeight: 18 },
  pincodeFallback: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  fallbackTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  fallbackText: { fontSize: 13, marginBottom: 12 },
  fallbackButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  fallbackButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
