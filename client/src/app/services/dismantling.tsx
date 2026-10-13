import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fs, spacing, hp } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Brand palette ─────────────────────────────────────────────────────────────
const PRIMARY     = '#1DB954';   // Bright green
const PRIMARY_DRK = '#127E2D';   // Dark green
const PRIMARY_MID = '#2A9D4E';
const BG          = '#0D120F';
const CARD_BG     = '#141A16';
const CARD_BG2    = '#1B2420';
const TEXT_PRI    = '#F0F5F1';
const TEXT_MUT    = '#8A9E91';

// ── What's Included ───────────────────────────────────────────────────────────
const INCLUDED = [
  {
    icon: 'file-document-outline' as const,
    title: 'Complete documentation',
    desc: 'RC cancellation, scrapping certificate, RTO formalities.',
  },
  {
    icon: 'car-pickup' as const,
    title: 'Free vehicle pickup',
    desc: 'Hassle-free pickup from your location.',
  },
  {
    icon: 'recycle' as const,
    title: 'Eco-friendly disposal',
    desc: 'Responsible dismantling and recycling of parts.',
  },
  {
    icon: 'currency-inr' as const,
    title: 'Best value for your vehicle',
    desc: 'Get fair and transparent valuation.',
  },
];

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1',
    icon: 'clipboard-list-outline' as const,
    title: 'Submit vehicle details',
    desc: 'Share RC and a few basic details.',
    pill: '2 mins',
  },
  {
    n: '2',
    icon: 'truck-delivery-outline' as const,
    title: 'Get valuation & schedule pickup',
    desc: 'We provide best quote and pickup time.',
    pill: 'Same day',
  },
  {
    n: '3',
    icon: 'file-certificate-outline' as const,
    title: 'Vehicle scrapped & certificate issued',
    desc: 'We complete the process and share documents.',
    pill: '1 - 3 days',
  },
];

export default function VehicleScrappingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const CELL_W = (SCREEN_WIDTH - spacing(32) - spacing(10)) / 2;

  const handleBook = () => {
    router.push({
      pathname: '/services/dismantling-book',
      params: { service: 'dismantling' },
    } as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── FLOATING TOP NAV ──────────────────────────────────────────── */}
      <View
        style={[
          styles.topNav,
          {
            paddingTop:
              Platform.OS === 'android'
                ? insets.top + spacing(10)
                : insets.top + spacing(4),
          },
        ]}
      >
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={fs(21)} color={TEXT_PRI} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Vehicle Scrapping</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(16) + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BLOCK ────────────────────────────────────────────────── */}
        <View style={styles.heroBlock}>
          {/* Full-width hero image */}
          <Image
            source={require('../../../assets/images/services/vehicle_scrapping/car_scrapp.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Bottom gradient overlay for text legibility */}
          <LinearGradient
            colors={['rgba(13,18,15,0.0)', 'rgba(13,18,15,0.65)', BG]}
            style={styles.heroGradient}
          />

          {/* Hero text overlay */}
          <View style={styles.heroTextBlock}>
            {/* Badge */}
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="leaf" size={fs(11)} color={PRIMARY} />
              <Text style={styles.heroBadgeText}>AUTHORIZED &amp; ECO-FRIENDLY</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroHeadline1}>Give your old</Text>
            <Text style={styles.heroHeadline1}>vehicle{' '}
              <Text style={styles.heroHeadline2}>a better{'\n'}tomorrow.</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              Hassle-free vehicle scrapping with proper documentation{'\n'}and eco-friendly disposal.
            </Text>

            {/* Pills row */}
            <View style={styles.heroPillRow}>
              {[
                { icon: 'shield-outline',      label: 'RTO\nCompliant'       },
                { icon: 'flash-outline',       label: 'Quick\nProcess'       },
                { icon: 'leaf-outline',        label: 'Environment\nFriendly'},
              ].map((p) => (
                <View key={p.label} style={styles.heroPill}>
                  <Ionicons name={p.icon as any} size={fs(13)} color={TEXT_PRI} />
                  <Text style={styles.heroPillText}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── STATS STRIP ───────────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="car" size={fs(22)} color={PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>1,200+</Text>
            <Text style={styles.statLabel}>Vehicles{'\n'}scrapped</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="recycle" size={fs(22)} color={PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Materials{'\n'}recycled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="leaf" size={fs(22)} color={PRIMARY} style={styles.statIcon} />
            <Text style={styles.statValue}>4.8 / 5</Text>
            <Text style={styles.statLabel}>Customer{'\n'}rating</Text>
          </View>
        </View>

        {/* ── WHAT'S INCLUDED ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all details</Text>
              <Ionicons name="chevron-forward" size={fs(13)} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.includedGrid}>
            {INCLUDED.map((item, idx) => (
              <View key={idx} style={[styles.includedCell, { width: CELL_W }]}>
                <View style={styles.includedIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={fs(22)} color={PRIMARY} />
                </View>
                <Text style={styles.includedTitle}>{item.title}</Text>
                <Text style={styles.includedDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.timeline}>
            {STEPS.map((step, idx) => (
              <View key={step.n} style={styles.timelineRow}>
                {/* Numbered circle + connector line */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineDotNum}>{step.n}</Text>
                  </View>
                  {idx < STEPS.length - 1 && <View style={styles.timelineLine} />}
                </View>

                {/* Icon square */}
                <View style={styles.timelineIconWrap}>
                  <MaterialCommunityIcons name={step.icon} size={fs(21)} color={PRIMARY} />
                </View>

                {/* Text */}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{step.title}</Text>
                  <Text style={styles.timelineDesc}>{step.desc}</Text>
                </View>

                {/* Time pill */}
                <View style={styles.timelinePill}>
                  <Text style={styles.timelinePillText}>{step.pill}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── STICKY CTA ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing(12)) + spacing(4) },
        ]}
      >
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.88}>
          <MaterialCommunityIcons name="calendar-clock" size={fs(22)} color="#fff" />
          <Text style={styles.bookBtnText}>Book Vehicle Scrapping</Text>
          <Ionicons name="arrow-forward" size={fs(20)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.footNote}>RTO Compliant • Safe Disposal • Better Environment</Text>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Top nav ──
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(10),
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRI,
  },

  // ── Hero ──
  heroBlock: {
    height: hp(54),
    width: '100%',
    backgroundColor: '#1a2a1e',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(38),
  },
  heroTextBlock: {
    position: 'absolute',
    bottom: spacing(22),
    left: spacing(18),
    right: spacing(18),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
    backgroundColor: 'rgba(29,185,84,0.18)',
    borderRadius: spacing(20),
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(12),
    alignSelf: 'flex-start',
    marginBottom: spacing(10),
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.35)',
  },
  heroBadgeText: {
    fontSize: fs(9),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.9,
  },
  heroHeadline1: {
    fontSize: fs(25),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRI,
    lineHeight: fs(32),
  },
  heroHeadline2: {
    fontSize: fs(25),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: fs(35),
  },
  heroSubtitle: {
    fontSize: fs(12),
    fontFamily: 'Inter-Regular',
    color: 'rgba(240,245,241,0.75)',
    lineHeight: fs(18),
    marginTop: spacing(8),
    marginBottom: spacing(14),
  },
  heroPillRow: {
    flexDirection: 'row',
    gap: spacing(8),
    flexWrap: 'wrap',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
    borderRadius: spacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(11),
  },
  heroPillText: {
    fontSize: fs(10),
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: TEXT_PRI,
    lineHeight: fs(14),
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    marginHorizontal: spacing(16),
    marginTop: spacing(14),
    borderRadius: spacing(16),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(8),
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.15)',
    marginBottom: spacing(6),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: spacing(4),
  },
  statValue: {
    fontSize: fs(20),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: spacing(2),
  },
  statLabel: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUT,
    textAlign: 'center',
    lineHeight: fs(15),
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(29,185,84,0.2)',
  },

  // ── Section wrapper ──
  section: {
    marginHorizontal: spacing(16),
    marginTop: spacing(24),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(14),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRI,
    marginBottom: spacing(14),
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(14),
  },
  seeAllText: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: PRIMARY,
  },

  // ── Included grid ──
  includedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(10),
  },
  includedCell: {
    backgroundColor: CARD_BG,
    borderRadius: spacing(14),
    padding: spacing(14),
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.12)',
    minHeight: hp(14),
  },
  includedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(29,185,84,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(10),
  },
  includedTitle: {
    fontSize: fs(12),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRI,
    lineHeight: fs(17),
    marginBottom: spacing(4),
  },
  includedDesc: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUT,
    lineHeight: fs(16),
  },

  // ── Timeline ──
  timeline: {
    marginTop: spacing(2),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(10),
    minHeight: hp(10),
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B2E20',
    borderWidth: 1.5,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotNum: {
    fontSize: fs(14),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: PRIMARY,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: PRIMARY_MID,
    opacity: 0.35,
    marginTop: spacing(3),
    minHeight: hp(5),
  },
  timelineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CARD_BG2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing(22),
  },
  timelineTitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: spacing(3),
    lineHeight: fs(19),
  },
  timelineDesc: {
    fontSize: fs(12),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUT,
    lineHeight: fs(17),
  },
  timelinePill: {
    backgroundColor: CARD_BG2,
    borderRadius: spacing(10),
    paddingVertical: spacing(7),
    paddingHorizontal: spacing(12),
    alignSelf: 'flex-start',
    minWidth: 72,
    alignItems: 'center',
    flexShrink: 0,
  },
  timelinePillText: {
    fontSize: fs(11),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: TEXT_PRI,
    textAlign: 'center',
    lineHeight: fs(16),
  },

  // ── Footer ──
  footer: {
    backgroundColor: BG,
    paddingTop: spacing(14),
    paddingHorizontal: spacing(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center',
  },
  bookBtn: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(18),
    borderRadius: spacing(16),
    gap: spacing(12),
    width: '100%',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: -spacing(12),
  },
  footNote: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUT,
    marginTop: spacing(8),
    textAlign: 'center',
  },
});
