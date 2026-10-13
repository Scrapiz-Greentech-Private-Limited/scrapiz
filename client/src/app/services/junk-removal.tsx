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
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fs, spacing, hp, wp } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Brand palette ─────────────────────────────────────────────────────────────
const ORANGE      = '#D95B1A';
const ORANGE_DARK = '#B04512';
const BG          = '#131210';
const CARD_BG     = '#1C1A17';
const CARD_BG2    = '#242018';
const TEXT_PRI    = '#F5F0EB';
const TEXT_MUT    = '#9A948A';
const ACCENT_YEL  = '#F5C84B';

// ── What's Included grid ──────────────────────────────────────────────────────
const INCLUDED = [
  {
    icon: 'sofa-outline'      as const,
    title: 'Removal of furniture, appliances & electronics',
    desc:  'Sofas, beds, e-waste and more.',
  },
  {
    icon: 'office-building-outline' as const,
    title: 'Home, office & construction junk',
    desc:  'Complete debris clearance.',
  },
  {
    icon: 'recycle'           as const,
    title: 'Responsible disposal',
    desc:  'Recycling, donation or eco-friendly processing.',
  },
  {
    icon: 'account-hard-hat-outline' as const,
    title: 'All labor included',
    desc:  'Our team handles lifting, loading and transport.',
  },
];

// ── How It Works timeline ─────────────────────────────────────────────────────
const STEPS = [
  {
    n:     '1',
    icon:  'document-text-outline' as const,
    title: 'Book your service',
    desc:  'Share a few details and preferred time.',
    pill:  '2 mins',
  },
  {
    n:     '2',
    icon:  'car-outline' as const,
    title: 'We pick it up',
    desc:  'Our team arrives and removes the junk.',
    pill:  'Same day\nor next day',
  },
  {
    n:     '3',
    icon:  'leaf-outline' as const,
    title: 'Responsible disposal',
    desc:  'Items are recycled, donated or disposed safely.',
    pill:  'Done',
  },
];

export default function JunkRemovalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const CELL_W = (SCREEN_WIDTH - spacing(32) - spacing(10)) / 2;

  const handleBook = () => {
    router.push({
      pathname: '/services/debris-book',
      params: { service: 'junk-removal' },
    } as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── FLOATING TOP NAV ──────────────────────────────────────────────── */}
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
        <Text style={styles.navTitle}>Debris Removal</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(14) + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BLOCK WITH FULL WIDTH BACKGROUND IMAGE ─────────────────── */}
        <View style={styles.heroBlock}>
          <Image
            source={require('../../../assets/images/services/debris_removal/junk_removal.png')}
            style={styles.heroBgImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(19,18,16,0.7)', 'rgba(19,18,16,0.82)', BG]}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            {/* Badge */}
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark-outline" size={fs(11)} color={ORANGE} />
              <Text style={styles.heroBadgeText}>DEBRIS REMOVAL SERVICE</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroHeadline1}>Clear your space,</Text>
            <Text style={styles.heroHeadline2}>the easy way.</Text>

            <Text style={styles.heroSubtitle}>
              Hassle-free debris and junk removal for homes, societies and offices. We pick up, remove and responsibly dispose of your unwanted items.
            </Text>

            {/* Pills */}
            <View style={styles.heroPillRow}>
              {[
                { icon: 'shield-outline', label: 'Insured' },
                { icon: 'time-outline',   label: 'Fast'    },
                { icon: 'star-outline',   label: '4.8 ★'   },
              ].map((p) => (
                <View key={p.label} style={styles.heroPill}>
                  <Ionicons name={p.icon as any} size={fs(12)} color={TEXT_PRI} />
                  <Text style={styles.heroPillText}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="trash-can-outline" size={fs(22)} color={ORANGE} style={styles.statIcon} />
            <Text style={styles.statValue}>5K+</Text>
            <Text style={styles.statLabel}>Pickups{'\n'}completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="recycle" size={fs(22)} color={ORANGE} style={styles.statIcon} />
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Waste diverted{'\n'}from landfill</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group-outline" size={fs(22)} color={ORANGE} style={styles.statIcon} />
            <Text style={styles.statValue}>4.8/5</Text>
            <Text style={styles.statLabel}>Customer{'\n'}rating</Text>
          </View>
        </View>

        {/* ── WHAT'S INCLUDED ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all details</Text>
              <Ionicons name="chevron-forward" size={fs(13)} color={ORANGE} />
            </TouchableOpacity>
          </View>

          <View style={styles.includedGrid}>
            {INCLUDED.map((item, idx) => (
              <View key={idx} style={[styles.includedCell, { width: CELL_W }]}>
                <View style={styles.includedIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={fs(22)} color={ORANGE} />
                </View>
                <Text style={styles.includedTitle}>{item.title}</Text>
                <Text style={styles.includedDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.timeline}>
            {STEPS.map((step, idx) => (
              <View key={step.n} style={styles.timelineRow}>
                {/* Numbered circle */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineDotNum}>{step.n}</Text>
                  </View>
                  {idx < STEPS.length - 1 && <View style={styles.timelineLine} />}
                </View>

                {/* Icon circle */}
                <View style={styles.timelineIconWrap}>
                  <Ionicons name={step.icon} size={fs(20)} color={TEXT_PRI} />
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{step.title}</Text>
                  <Text style={styles.timelineDesc}>{step.desc}</Text>
                </View>

                {/* Pill */}
                <View style={styles.timelinePill}>
                  <Text style={styles.timelinePillText}>{step.pill}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── STICKY BOOK BUTTON ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing(12)) + spacing(4) },
        ]}
      >
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.88}>
          <MaterialCommunityIcons name="calendar-clock" size={fs(22)} color="#fff" />
          <Text style={styles.bookBtnText}>Book This Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    width: '100%',
    minHeight: hp(42),
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingTop: hp(11),
    backgroundColor: BG,
  },
  heroBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(22),
    paddingTop: spacing(16),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
    backgroundColor: 'rgba(217,91,26,0.2)',
    borderRadius: spacing(20),
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(10),
    alignSelf: 'flex-start',
    marginBottom: spacing(10),
    borderWidth: 1,
    borderColor: 'rgba(217,91,26,0.4)',
  },
  heroBadgeText: {
    fontSize: fs(9),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 0.8,
  },
  heroHeadline1: {
    fontSize: fs(24),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRI,
    lineHeight: fs(30),
  },
  heroHeadline2: {
    fontSize: fs(24),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: ORANGE,
    lineHeight: fs(32),
    marginBottom: spacing(10),
  },
  heroSubtitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUT,
    lineHeight: fs(19),
    marginBottom: spacing(14),
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(6),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    borderRadius: spacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(10),
  },
  heroPillText: {
    fontSize: fs(11),
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: TEXT_PRI,
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    marginHorizontal: spacing(16),
    borderRadius: spacing(16),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(8),
    borderWidth: 1,
    borderColor: 'rgba(217,91,26,0.15)',
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
    color: TEXT_PRI,
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
    backgroundColor: 'rgba(217,91,26,0.2)',
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
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  seeAllText: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: ORANGE,
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
    borderColor: 'rgba(217,91,26,0.12)',
    minHeight: hp(14),
    justifyContent: 'flex-start',
  },
  includedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(217,91,26,0.15)',
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
    marginTop: spacing(6),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: hp(10),
    gap: spacing(10),
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotNum: {
    fontSize: fs(15),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#fff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: ORANGE_DARK,
    opacity: 0.45,
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
    paddingBottom: spacing(20),
  },
  timelineTitle: {
    fontSize: fs(14),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: spacing(3),
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
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(12),
    alignSelf: 'flex-start',
    minWidth: 70,
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
    borderTopColor: 'rgba(217,91,26,0.15)',
  },
  bookBtn: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(18),
    borderRadius: spacing(16),
    gap: spacing(12),
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: fs(18),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
  },
});
