import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import ScrapizLogo from './ScrapizLogo';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsating glow animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation for sparkles
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for textures
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    const timeout = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [fadeAnim, slideAnim, scaleAnim, pulseAnim, glowAnim, floatAnim, rotateAnim, onFinish]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#16a34a', '#15803d', '#14532d', '#0f5523']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Decorative Elements */}
        <View style={styles.backgroundDecorations}>
          {/* Animated circles */}
          <Animated.View 
            style={[
              styles.bgCircle1,
              { opacity: pulseAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.05, 0.12] }) }
            ]} 
          />
          <Animated.View 
            style={[
              styles.bgCircle2,
              { opacity: pulseAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.08, 0.15] }) }
            ]} 
          />
          <Animated.View 
            style={[
              styles.bgCircle3,
              { opacity: pulseAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.06, 0.1] }) }
            ]} 
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Enhanced Logo Section */}
          <Animated.View 
            style={[
              styles.logoContainer, 
              { 
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: floatTranslate }
                ]
              }
            ]}
          >
            {/* Outer Glow Ring */}
            <Animated.View 
              style={[
                styles.glowRing,
                { 
                  opacity: pulseAnim.interpolate({ 
                    inputRange: [0.3, 1], 
                    outputRange: [0.3, 0.7] 
                  }),
                  transform: [{ 
                    scale: pulseAnim.interpolate({ 
                      inputRange: [0.3, 1], 
                      outputRange: [1, 1.1] 
                    })
                  }]
                }
              ]}
            />
            
            {/* Logo Container with Gradient Border Effect */}
            <View style={styles.logoOuterBox}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.95)']}
                style={styles.logoGradientWrapper}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.logoInnerBox}>
                  <ScrapizLogo width={280} />
                  
                  {/* Decorative Corner Elements */}
                  <View style={[styles.cornerDecor, styles.cornerTopLeft]} />
                  <View style={[styles.cornerDecor, styles.cornerTopRight]} />
                  <View style={[styles.cornerDecor, styles.cornerBottomLeft]} />
                  <View style={[styles.cornerDecor, styles.cornerBottomRight]} />
                </View>
              </LinearGradient>
            </View>
            
            {/* Floating Sparkles Around Logo */}
            <Animated.View 
              style={[
                styles.floatingSparkle,
                styles.sparkleTopLeft,
                { 
                  opacity: glowAnim,
                  transform: [{ rotate: rotation }]
                }
              ]}
            >
              <Sparkles size={18} color="#fbbf24" fill="#fbbf24" />
            </Animated.View>
            <Animated.View 
              style={[
                styles.floatingSparkle,
                styles.sparkleTopRight,
                { 
                  opacity: glowAnim,
                  transform: [{ rotate: rotation }]
                }
              ]}
            >
              <Sparkles size={16} color="#fbbf24" fill="#fbbf24" />
            </Animated.View>
            <Animated.View 
              style={[
                styles.floatingSparkle,
                styles.sparkleBottomCenter,
                { 
                  opacity: glowAnim,
                  transform: [{ rotate: rotation }]
                }
              ]}
            >
              <Sparkles size={20} color="#fbbf24" fill="#fbbf24" />
            </Animated.View>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              },
            ]}
          >
            <View style={styles.taglineBox}>
              <Text style={styles.taglineText}>Sell Scrap Online,</Text>
              <Text style={styles.taglineText}>Only on Scrapiz.</Text>
            </View>
          </Animated.View>

          {/* Product Circles with Connecting Lines */}
          <Animated.View 
            style={[
              styles.productsContainer,
              { opacity: fadeAnim }
            ]}
          >
            {/* Connecting Lines and Arrows */}
            <View style={styles.connectingLines}>
              {/* Top Left to Right */}
              <View style={[styles.lineContainer, { top: '25%', left: '25%', width: '35%' }]}>
                <View style={styles.line} />
                <View style={styles.arrowRight} />
              </View>
              
              {/* Top Right to Bottom Right */}
              <View style={[styles.lineContainer, { top: '30%', right: '18%', height: '35%', flexDirection: 'column' }]}>
                <View style={[styles.line, { width: 2, height: '100%' }]} />
                <View style={styles.arrowDown} />
              </View>
              
              {/* Bottom Right to Bottom Left */}
              <View style={[styles.lineContainer, { bottom: '25%', right: '25%', width: '35%' }]}>
                <View style={styles.arrowLeft} />
                <View style={styles.line} />
              </View>
              
              {/* Bottom Left to Top Left */}
              <View style={[styles.lineContainer, { bottom: '30%', left: '18%', height: '35%', flexDirection: 'column' }]}>
                <View style={styles.arrowUp} />
                <View style={[styles.line, { width: 2, height: '100%' }]} />
              </View>

              {/* Enhanced Sparkles */}
              <Animated.View 
                style={[
                  styles.sparkle, 
                  { 
                    top: '20%', 
                    left: '50%', 
                    opacity: glowAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <View style={styles.sparkleGlow}>
                  <Sparkles size={24} color="#ffffff" fill="#ffffff" />
                </View>
              </Animated.View>
              <Animated.View 
                style={[
                  styles.sparkle, 
                  { 
                    bottom: '20%', 
                    left: '15%', 
                    opacity: glowAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <View style={styles.sparkleGlow}>
                  <Sparkles size={20} color="#ffffff" fill="#ffffff" />
                </View>
              </Animated.View>
              <Animated.View 
                style={[
                  styles.sparkle, 
                  { 
                    bottom: '35%', 
                    right: '15%', 
                    opacity: glowAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <View style={styles.sparkleGlow}>
                  <Sparkles size={22} color="#ffffff" fill="#ffffff" />
                </View>
              </Animated.View>
            </View>

            {/* Top Left - Brass Items */}
            <Animated.View 
              style={[
                styles.productCircle, 
                styles.topLeft,
                { 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: floatTranslate }
                  ] 
                }
              ]}
            >
              <View style={styles.productBorder}>
                <Image 
                  source={require('../../assets/images/Scrap_Rates_Photos/Brass.jpg')}
                  style={styles.productImage}
                />
              </View>
            </Animated.View>

            {/* Top Right - Laptops */}
            <Animated.View 
              style={[
                styles.productCircle, 
                styles.topRight,
                { 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: floatTranslate }
                  ] 
                }
              ]}
            >
              <View style={styles.productBorder}>
                <Image 
                  source={require('../../assets/images/Scrap_Rates_Photos/Laptops.jpg')}
                  style={styles.productImage}
                />
              </View>
            </Animated.View>

            {/* Bottom Left - Motors */}
            <Animated.View 
              style={[
                styles.productCircle, 
                styles.bottomLeft,
                { 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: floatTranslate }
                  ] 
                }
              ]}
            >
              <View style={styles.productBorder}>
                <Image 
                  source={require('../../assets/images/Scrap_Rates_Photos/Motors.jpg')}
                  style={styles.productImage}
                />
              </View>
            </Animated.View>

            {/* Bottom Right - Copper Wire */}
            <Animated.View 
              style={[
                styles.productCircle, 
                styles.bottomRight,
                { 
                  transform: [
                    { scale: scaleAnim },
                    { translateY: floatTranslate }
                  ] 
                }
              ]}
            >
              <View style={styles.productBorder}>
                <Image 
                  source={require('../../assets/images//Scrap_Rates_Photos/Copper.jpg')}
                  style={styles.productImage}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
  },
  backgroundDecorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bgCircle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -100,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -60,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: '40%',
    left: '70%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: height * 0.08,
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 145,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 0,
  },
  logoOuterBox: {
    borderRadius: 28,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  logoGradientWrapper: {
    borderRadius: 29,
    padding: 3,
  },
  logoInnerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.15)',
  },
  cornerDecor: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#16a34a',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -3,
    left: -3,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -3,
    right: -3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -3,
    right: -3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 8,
  },
  floatingSparkle: {
    position: 'absolute',
    zIndex: 10,
  },
  sparkleTopLeft: {
    top: -10,
    left: -15,
  },
  sparkleTopRight: {
    top: -5,
    right: -10,
  },
  sparkleBottomCenter: {
    bottom: -15,
    left: '45%',
  },
  logoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  taglineBox: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  taglineText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#16a34a',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  productsContainer: {
    width: width * 0.75,
    height: height * 0.35,
    position: 'relative',
  },
  connectingLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lineContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    backgroundColor: '#ffffff',
    height: 2,
    flex: 1,
    opacity: 0.9,
  },
  arrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderLeftWidth: 12,
    borderLeftColor: '#ffffff',
    marginLeft: -1,
  },
  arrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderRightWidth: 12,
    borderRightColor: '#ffffff',
    marginRight: -1,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderLeftColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'transparent',
    borderTopWidth: 12,
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderLeftColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'transparent',
    borderBottomWidth: 12,
    borderBottomColor: '#ffffff',
    marginBottom: -1,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  productCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  productBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    borderWidth: 3,
    borderColor: 'rgba(22, 163, 74, 0.3)',
    overflow: 'hidden',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
