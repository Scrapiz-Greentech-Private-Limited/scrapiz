import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Volume2, VolumeX, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function ScrappyAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<Video>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
  };

  const handleSelectMetalScrap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/scrappy-category', params: { category: 'metal' } } as any);
  };

  const handleSelectElectronicScrap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/scrappy-category', params: { category: 'electronic' } } as any);
  };

  const handleSelectServices = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/scrappy-category', params: { category: 'services' } } as any);
  };

  const handleSelectDemolition = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/scrappy-category', params: { category: 'demolition' } } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Lush Green Gradient Background */}
      <LinearGradient
        colors={['#012615', '#044226', '#065f38', '#02331c', '#011c0f']}
        locations={[0, 0.25, 0.55, 0.8, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Wavy Lines (SVG) - Top Left */}
      <View style={styles.svgTopLeft} pointerEvents="none">
        <Svg width={220} height={220} viewBox="0 0 220 220" fill="none">
          <Path
            d="M-40 20C20 40 50 90 40 160C30 230 80 260 140 250"
            stroke="rgba(52, 211, 153, 0.18)"
            strokeWidth={1.5}
          />
          <Path
            d="M-30 40C30 60 70 110 60 180C50 250 100 280 160 270"
            stroke="rgba(52, 211, 153, 0.14)"
            strokeWidth={1.5}
          />
          <Path
            d="M-20 60C40 80 90 130 80 200C70 270 120 300 180 290"
            stroke="rgba(52, 211, 153, 0.10)"
            strokeWidth={1.5}
          />
        </Svg>
      </View>

      {/* Decorative Glowing Accent - Top Right */}
      <View style={styles.glowTopRight} pointerEvents="none" />

      {/* Decorative Wavy Lines (SVG) - Bottom Right */}
      <View style={styles.svgBottomRight} pointerEvents="none">
        <Svg width={220} height={220} viewBox="0 0 220 220" fill="none">
          <Path
            d="M60 220C80 160 130 130 180 140C230 150 260 100 260 40"
            stroke="rgba(52, 211, 153, 0.16)"
            strokeWidth={1.5}
          />
          <Path
            d="M80 230C100 170 150 140 200 150C250 160 280 110 280 50"
            stroke="rgba(52, 211, 153, 0.12)"
            strokeWidth={1.5}
          />
        </Svg>
      </View>

      {/* Safe Area Wrapper */}
      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 14) }]}>
        {/* Top Control Bar: Mute Toggle & Close Button */}
        <View style={styles.topControlBar}>
          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={toggleSound}
            activeOpacity={0.7}
            accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX size={20} color="#ffffff" strokeWidth={2.2} />
            ) : (
              <Volume2 size={20} color="#ffffff" strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeIconBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityLabel="Close Assistant"
          >
            <X size={22} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 36) },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header Greeting Typography */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.greetingTitle}>Hi, I'm Scrappy</Text>
            <Text style={styles.greetingSubtitle}>Your AI Scrap Pickup Assistant</Text>
          </View>

          {/* Transparent Mascot Video Container */}
          <View style={styles.mascotVideoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: 'https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/media/transparent-alpha.webm' }}
              style={styles.mascotVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              isLooping={true}
              isMuted={isMuted}
              useNativeControls={false}
            />
          </View>

          {/* Prompt Question */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>What are you looking for today?</Text>
          </View>

          {/* Categories Section with Enhanced Visuals & Full-Dimension Images */}
          <View style={styles.categoriesSection}>
            {/* Row 1: Metal Scrap & Electronic Scrap */}
            <View style={styles.categoryRow}>
              {/* Category 1: Metal Scrap */}
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={handleSelectMetalScrap}
                activeOpacity={0.88}
              >
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryTitle, { color: '#059669' }]}>
                    METAL SCRAP
                  </Text>
                </View>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={require('../../assets/images/categories/metal_Scrap.png')}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>

              {/* Category 2: Electronic Scrap */}
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={handleSelectElectronicScrap}
                activeOpacity={0.88}
              >
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryTitle, { color: '#e11d48' }]}>
                    ELECTRONIC SCRAP
                  </Text>
                </View>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={require('../../assets/images/categories/Electronic_scrap.png')}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: Scrap Related Services (Premium Full-Width Card) */}
            <TouchableOpacity
              style={styles.servicesBannerCard}
              onPress={handleSelectServices}
              activeOpacity={0.88}
            >
              <View style={styles.servicesInfoSide}>
                <View style={styles.servicesTag}>
                  <Text style={styles.servicesTagText}>SERVICES</Text>
                </View>
                <Text style={styles.servicesTitle}>
                  SCRAP RELATED{'\n'}SERVICES
                </Text>
                <Text style={styles.servicesSubtitle}>
                  Demolition, Debris & Tie-ups
                </Text>
                <View style={styles.servicesActionRow}>
                  <Text style={styles.servicesActionText}>Explore</Text>
                  <ArrowRight size={13} color="#0284c7" strokeWidth={2.8} />
                </View>
              </View>

              <View style={styles.servicesImageSide}>
                <Image
                  source={require('../../assets/images/demolition_app.webp')}
                  style={styles.servicesBannerImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.servicesBannerCard}
              onPress={handleSelectDemolition}
              activeOpacity={0.88}
            >
              <View style={styles.servicesInfoSide}>
                <View style={[styles.servicesTag, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.servicesTagText, { color: '#15803d' }]}>SPECIALIST HELP</Text>
                </View>
                <Text style={[styles.servicesTitle, { color: '#15803d' }]}>
                  DEMOLITION{ '\n' }& CLEARANCE
                </Text>
                <Text style={styles.servicesSubtitle}>
                  Break, clear and recycle responsibly
                </Text>
                <View style={styles.servicesActionRow}>
                  <Text style={[styles.servicesActionText, { color: '#15803d' }]}>Tell Scrappy</Text>
                  <ArrowRight size={13} color="#15803d" strokeWidth={2.8} />
                </View>
              </View>
              <View style={styles.servicesImageSide}>
                <Image
                  source={require('../../assets/images/services/deomlition_app.webp')}
                  style={styles.servicesBannerImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Dismiss Pill Button */}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.dismissPill}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissPillText}>
                I don't want to try AI Scrap Pickup{'  '}✕
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#012615',
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  /* Top Control Bar */
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    width: '100%',
    zIndex: 10,
  },
  controlIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* SVG Background Elements */
  svgTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glowTopRight: {
    position: 'absolute',
    top: 30,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  svgBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },

  /* Header Greeting Typography */
  headerTextContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  greetingSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d1fae5',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  /* Transparent Mascot Video Container */
  mascotVideoContainer: {
    width: '100%',
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginVertical: 4,
  },
  mascotVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  /* Prompt */
  promptContainer: {
    marginTop: 6,
    marginBottom: 16,
  },
  promptQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  /* Categories Section */
  categoriesSection: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },

  /* 2-Column Category Cards with Full-Dimension Images */
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  categoryHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardImageWrapper: {
    width: '100%',
    height: 125,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },

  /* Full-Width Services Banner Card */
  servicesBannerCard: {
    width: '100%',
    height: 128,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  servicesInfoSide: {
    flex: 1.15,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: 'space-between',
  },
  servicesTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  servicesTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0284c7',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  servicesSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  servicesActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servicesActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  servicesImageSide: {
    flex: 0.95,
    height: '100%',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  servicesBannerImage: {
    width: '100%',
    height: '100%',
  },

  /* Bottom Dismiss Button */
  bottomButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  dismissPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#f0fdf4',
    letterSpacing: 0.1,
  },
});
