import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Hammer, Wrench, Building, Trash2, ChevronRight, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fs, spacing, responsiveValue } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import TutorialOverlay from '@/src/components/TutorialOverlay';
import { servicesTutorialConfig } from '@/src/config/tutorials/servicesTutorial';
import { useTutorialStore } from '@/src/store/tutorialStore';

export const services = [
  { id: 'demolition', titleKey: 'services.demolitionTitle', descKey: 'services.demolitionDesc', icon: Hammer, color: '#16a34a', bgColor: '#f0fdf4' },
  { id: 'dismantling', titleKey: 'services.dismantlingTitle', descKey: 'services.dismantlingDesc', icon: Wrench, color: '#16a34a', bgColor: '#f0fdf4' },
  { id: 'paper-shredding', titleKey: 'services.paperShreddingTitle', descKey: 'services.paperShreddingDesc', icon: FileText, color: '#16a34a', bgColor: '#f0fdf4' },
  { id: 'society-tieup', titleKey: 'services.societyTieupTitle', descKey: 'services.societyTieupDesc', icon: Building, color: '#16a34a', bgColor: '#f0fdf4' },
  { id: 'junk-removal', titleKey: 'services.junkRemovalTitle', descKey: 'services.junkRemovalDesc', icon: Trash2, color: '#16a34a', bgColor: '#f0fdf4' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  // Tutorial system integration
  const { setStepTarget, currentScreen } = useTutorialStore();
  const overviewRef = useRef<View>(null);
  const serviceCardsRef = useRef<View>(null);
  const detailsRef = useRef<View>(null);
  const bookingRef = useRef<View>(null);

  // Measure element positions when tutorial is active
  useEffect(() => {
    if (currentScreen === 'services') {
      // Small delay to ensure elements are rendered
      const measureTimeout = setTimeout(() => {
        // Measure services overview (header section)
        overviewRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('services-overview', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure service cards (first service card as representative)
        serviceCardsRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('services-cards', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure details section (info card)
        detailsRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('services-details', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure booking (first service card touchable as representative)
        bookingRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('services-booking', { x: pageX, y: pageY, width, height });
          }
        });
      }, 100);

      return () => clearTimeout(measureTimeout);
    }
  }, [currentScreen, setStepTarget]);

  const handleServiceSelect = (service: typeof services[0]) => {
    router.push(`/services/${service.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
              barStyle={isDark ? "light-content" : "dark-content"}
              backgroundColor="transparent"
              translucent
            />
      <LinearGradient 
        colors={colors.headerGradient} 
        style={styles.headerSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View ref={overviewRef}>
          <Text style={styles.headerTitle}>{t('services.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('services.subtitle')}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesList} ref={serviceCardsRef}>
          {services.map((service, index) => (
            <LinearGradient
              key={service.id}
              colors={['#16a34a', '#15803d', '#166534']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.serviceCard}
            >
              <TouchableOpacity 
                ref={index === 0 ? bookingRef : null}
                style={styles.serviceCardTouchable}
                onPress={() => handleServiceSelect(service)}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIcon, { backgroundColor: 'white' }]}>
                  <service.icon size={fs(24)} color={service.color} strokeWidth={2.5} />
                </View>
                <View style={styles.serviceTextContainer}>
                  <Text style={styles.serviceTitle}>{t(service.titleKey)}</Text>
                  <Text style={styles.serviceDescription}>{t(service.descKey)}</Text>
                </View>
                <ChevronRight size={fs(22)} color="rgba(255, 255, 255, 0.9)" strokeWidth={2.5} />
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>

        <View ref={detailsRef} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{t('services.whyChooseUs')}</Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>{t('services.benefit1')}</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>{t('services.benefit2')}</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>{t('services.benefit3')}</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>{t('services.benefit4')}</Text>
            <Text style={[styles.infoItem, { color: colors.textSecondary }]}>{t('services.benefit5')}</Text>
          </View>
        </View>
      </ScrollView>
      
      <TutorialOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: { 
    paddingTop: Platform.select({ ios: hp(6.5), android: hp(5.5) }), // Reduced from 7.4/6.2
    paddingHorizontal: spacing(20), // Reduced from 24
    paddingBottom: spacing(20), // Reduced from 24
    borderBottomLeftRadius: spacing(24),
    borderBottomRightRadius: spacing(24),
  },
  headerTitle: { 
    fontSize: fs(22), // Reduced from 24
    fontWeight: 'bold',
    color: 'white', 
    fontFamily: 'Inter-Bold', 
    textAlign: 'center', 
    marginBottom: spacing(4) 
  },
  headerSubtitle: { 
    fontSize: fs(14), // Reduced from 15
    color: '#a7f3d0', 
    fontFamily: 'Inter-Regular', 
    textAlign: 'center' 
  },
  content: { 
    flex: 1, 
    padding: spacing(14) // Reduced from 16
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? spacing(100) : spacing(80),
  },
  servicesList: { 
    marginBottom: spacing(24) 
  },
  serviceCard: { 
    borderRadius: spacing(16),
    marginBottom: spacing(12), // Reduced from 14
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
   headerSection: {
    paddingTop: hp(6.8),
    paddingHorizontal: wp(4.8),
    paddingBottom: hp(3.5), // Increased bottom padding slightly for visual balance
    borderBottomLeftRadius: 28, // Slightly rounder looks more modern
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    // Remove shadow here, let the gradient do the work
  },
  serviceCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(15), // Reduced from 18
    minHeight: responsiveValue({
      small: hp(7.5), // Reduced from 8
      medium: hp(8), // Reduced from 8.8
      large: hp(8.5), // Reduced from 9
      tablet: hp(10),
      default: hp(8), // Reduced from 8.8
    }),
  },
  serviceIcon: { 
    width: responsiveValue({
      small: wp(10),   // Reduced from 11
      medium: wp(11),  // Reduced from 12.8
      large: wp(11),   // Reduced from 12.8
      tablet: wp(9),
      default: wp(11), // Reduced from 12.8
    }),
    height: responsiveValue({
      small: wp(10),   // Reduced from 11
      medium: wp(11),  // Reduced from 12.8
      large: wp(11),   // Reduced from 12.8
      tablet: wp(9),
      default: wp(11), // Reduced from 12.8
    }),
    borderRadius: responsiveValue({
      small: wp(5),    // Reduced from 5.5
      medium: wp(5.5), // Reduced from 6.4
      large: wp(5.5),  // Reduced from 6.4
      tablet: wp(4.5),
      default: wp(5.5), // Reduced from 6.4
    }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(14), // Reduced from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceTextContainer: {
    flex: 1,
    marginRight: spacing(10) // Reduced from 12
  },
  serviceTitle: { 
    fontSize: fs(15), // Reduced from 16
    fontWeight: '600', 
    color: 'white', 
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(3)
  },
  serviceDescription: { 
    fontSize: fs(12), // Reduced from 13
    color: 'white', 
    fontFamily: 'Inter-Regular',
    lineHeight: fs(16) // Reduced from 18
  },
  infoCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: spacing(16), 
    padding: spacing(16), // Reduced from 20
    marginBottom: spacing(16), // Reduced from 20
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  infoTitle: { 
    fontSize: fs(16), // Reduced from 17
    fontWeight: '600', 
    color: '#111827', 
    fontFamily: 'Inter-SemiBold', 
    marginBottom: spacing(14) // Reduced from 16
  },
  infoList: { 
    gap: spacing(8) // Reduced from 10
  },
  infoItem: { 
    fontSize: fs(13), // Reduced from 14
    color: '#374151', 
    fontFamily: 'Inter-Regular', 
    lineHeight: fs(18) // Reduced from 20
  },
});
