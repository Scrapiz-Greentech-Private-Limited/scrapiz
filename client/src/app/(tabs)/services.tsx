import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import TutorialOverlay from '@/src/components/TutorialOverlay';
import { useTutorialStore } from '@/src/store/tutorialStore';
import ServiceCard from '@/src/components/ServiceCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getServiceBookingRoute } from '../services/serviceRoutingConfig';

// ─────────────── SERVICE DATA ───────────────
export interface ServiceData {
  id: string;
  title: string;
  titleKey: string;
  descKey: string;
  description: string;
  image: ImageSourcePropType;
  borderColor: string;
  cardBgColor: string;
  gradientColors: [string, string, string];
  included: string[];
  color: string;
  bgColor: string;
  icon: any;
}

const DummyIcon = () => null;

export const services: ServiceData[] = [
  {
    id: 'demolition',
    title: 'Demolition Service',
    titleKey: 'services.demolitionTitle',
    descKey: 'services.demolitionDesc',
    description: 'Book Demolition for any building.',
    image: require('../../../assets/images/services/deomlition_app.webp'),
    borderColor: '#1a7c3a',
    cardBgColor: '#ffffff',
    gradientColors: ['transparent', 'rgba(247,253,249,0.6)', '#f7fdf9'],
    included: [
      'On-site assessment and quote.',
      'Eco-friendly disposal.',
      'Clean-up after completion.',
    ],
    color: '#1a7c3a',
    bgColor: '#f0fdf4',
    icon: DummyIcon,
  },
  {
    id: 'dismantling',
    title: 'Vehicle Scrapping',
    titleKey: 'services.dismantlingTitle',
    descKey: 'services.dismantlingDesc',
    description: 'Scrap your old vehicles.',
    image: require('../../../assets/images/services/carScrap_app.webp'),
    borderColor: '#c0392b',
    cardBgColor: '#ffffff',
    gradientColors: ['transparent', 'rgba(254,247,247,0.6)', '#fef7f7'],
    included: [
      'Pre-dismantling safety inspection.',
      'Segregation of materials for recycling.',
      'Site clearance and certification.',
    ],
    color: '#c0392b',
    bgColor: '#fef2f2',
    icon: DummyIcon,
  },
  {
    id: 'paper-shredding',
    title: 'Paper Shredding',
    titleKey: 'services.paperShreddingTitle',
    descKey: 'services.paperShreddingDesc',
    description: 'Confidential shredding.',
    image: require('../../../assets/images/services/paperShredding_app.webp'),
    borderColor: '#1558a8',
    cardBgColor: '#ffffff',
    gradientColors: ['transparent', 'rgba(245,249,254,0.6)', '#f5f9fe'],
    included: [
      'Secure collection of confidential documents.',
      'Professional shredding with safe handling.',
      'Scheduled pickup options for offices and homes.',
    ],
    color: '#1558a8',
    bgColor: '#eff6ff',
    icon: DummyIcon,
  },
  {
    id: 'society-tieup',
    title: 'Society Tie-up',
    titleKey: 'services.societyTieupTitle',
    descKey: 'services.societyTieupDesc',
    description: 'Regular cleaning drive in your society.',
    image: require('../../../assets/images/services/society_Tieup_app.png'),
    borderColor: '#1558a8',
    cardBgColor: '#ffffff',
    gradientColors: ['transparent', 'rgba(245,249,254,0.6)', '#f5f9fe'],
    included: [
      'Regular collection drives (weekly/bi-weekly).',
      'Monthly reports on environmental impact.',
      'Awareness programs for residents on segregation.',
    ],
    color: '#1558a8',
    bgColor: '#eff6ff',
    icon: DummyIcon,
  },
  {
    id: 'junk-removal',
    title: 'Debris Removal',
    titleKey: 'services.junkRemovalTitle',
    descKey: 'services.junkRemovalDesc',
    description: 'Debris removal service available.',
    image: require('../../../assets/images/services/debris_removal.webp'),
    borderColor: '#c0440a',
    cardBgColor: '#ffffff',
    gradientColors: ['transparent', 'rgba(254,248,243,0.6)', '#fef8f3'],
    included: [
      'Responsible disposal, donation, or recycling.',
      'All labor for lifting and loading included.',
      'Same-day or next-day service available.',
    ],
    color: '#c0440a',
    bgColor: '#fff7ed',
    icon: DummyIcon,
  },
];

// ─────────────── MAIN SCREEN ───────────────
export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const { setStepTarget, currentScreen } = useTutorialStore();
  const overviewRef    = useRef<View>(null);
  const serviceCardsRef = useRef<View>(null);
  const detailsRef     = useRef<View>(null);
  const bookingRef     = useRef<View>(null);

  useEffect(() => {
    if (currentScreen === 'services') {
      const timer = setTimeout(() => {
        overviewRef.current?.measure((x, y, w, h, pageX, pageY) => {
          if (w > 0 && h > 0) setStepTarget('services-overview', { x: pageX, y: pageY, width: w, height: h });
        });
        serviceCardsRef.current?.measure((x, y, w, h, pageX, pageY) => {
          if (w > 0 && h > 0) setStepTarget('services-cards', { x: pageX, y: pageY, width: w, height: h });
        });
        detailsRef.current?.measure((x, y, w, h, pageX, pageY) => {
          if (w > 0 && h > 0) setStepTarget('services-details', { x: pageX, y: pageY, width: w, height: h });
        });
        bookingRef.current?.measure((x, y, w, h, pageX, pageY) => {
          if (w > 0 && h > 0) setStepTarget('services-booking', { x: pageX, y: pageY, width: w, height: h });
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, setStepTarget]);

  const handleLearnMore = (service: ServiceData) => {
    router.push(`/services/${service.id}`);
  };

  const handleBookNow = (service: ServiceData) => {
    router.push({
      pathname: getServiceBookingRoute(service.id),
      params: { service: service.id },
    } as any);
  };

  const pageGradient: [string, string, string, string] = isDark
    ? ['#0A3F18', '#0E6A2A', '#0C1710', '#050A07']
    : ['#006D2B', '#2A8B48', '#EAF2EC', '#F5F7F5'];

  return (
    <LinearGradient
      colors={pageGradient}
      locations={isDark ? [0, 0.26, 0.58, 1] : [0, 0.22, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={isDark ? ['rgba(8,55,20,0.96)', 'rgba(16,110,44,0.78)', 'rgba(14,29,19,0.68)'] : ['#006D2B', '#3B9A56', '#DDEADF']}
        style={[
          styles.headerSection,
          isDark ? styles.headerSectionDark : styles.headerSectionLight,
          { paddingTop: insets.top + spacing(14) },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View ref={overviewRef} style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={fs(24)} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Our Services</Text>

          {/* Spacer to keep title centered */}
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View ref={overviewRef} style={styles.cardsTopSpacer} />

        <View ref={serviceCardsRef}>
          {services.map((service, index) => (
            <View
              key={service.id}
              ref={index === 0 ? bookingRef : index === 1 ? detailsRef : null}
            >
              <ServiceCard
                title={service.title}
                description={service.description}
                image={service.image}
                onLearnMore={() => handleLearnMore(service)}
                onBookNow={() => handleBookNow(service)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TutorialOverlay />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  headerSection: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(1.7),
    minHeight: hp(14),
    borderBottomWidth: 1.6,
  },
  headerSectionLight: {
    borderBottomColor: 'rgba(78,152,111,0.5)',
  },
  headerSectionDark: {
    borderBottomColor: 'rgba(37,119,66,0.62)',
  },

  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: fs(28),
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing(10),
    paddingBottom: spacing(108),
  },
  cardsTopSpacer: {
    height: spacing(2),
  },
});
