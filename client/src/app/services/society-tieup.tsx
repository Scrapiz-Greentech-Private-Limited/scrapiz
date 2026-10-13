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
import { fs, spacing, wp, hp } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIMARY        = '#127E2D';
const PRIMARY_DARK   = '#0D5C20';
const PRIMARY_LIGHT  = '#E9F7EE';
const PRIMARY_MID    = '#56AE67';
const ACCENT_YELLOW  = '#F5C84B';
const BG             = '#0D1410';
const CARD_BG        = '#151E18';
const CARD_BG2       = '#1B2620';
const TEXT_PRIMARY   = '#F4F7F5';
const TEXT_MUTED     = '#96A89C';
const TEXT_GREEN     = '#7DD98A';

// ─── Timeline steps ───────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    n: '1',
    title: 'Submit enquiry',
    desc: 'Share a few details about your society.',
    pill: 'Today',
    pillBg: PRIMARY,
    pillText: '#fff',
  },
  {
    n: '2',
    title: 'We visit & propose',
    desc: 'Free site visit, custom plan and pricing sent.',
    pill: '3 - 5 days',
    pillBg: CARD_BG2,
    pillText: TEXT_PRIMARY,
  },
  {
    n: '3',
    title: 'First pickup scheduled',
    desc: 'Sign digitally, your society goes eco-clean.',
    pill: '~ 2 weeks',
    pillBg: CARD_BG2,
    pillText: TEXT_PRIMARY,
  },
];

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: 'calendar-outline' as const,
    title: 'Zero\nscheduling effort',
    desc: 'We handle pickups,\nso you don\'t have to.',
  },
  {
    icon: 'car-outline' as const,
    title: 'Reliable\npickup cycles',
    desc: 'On-time collection\nwith trained team.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Monthly\nimpact reports',
    desc: 'Track waste, recycling\nand environmental impact.',
  },
];

export default function SocietyTieupLearnMoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const CARD_W = (SCREEN_WIDTH - spacing(32) - spacing(12)) / 3;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── TOP NAV BAR ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              Platform.OS === 'android'
                ? insets.top + spacing(10)
                : insets.top + spacing(4),
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={fs(22)} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Society Partnerships</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(14) + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO IMAGE SECTION ───────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../../../assets/images/services/society_tieup/society_header.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['rgba(13,20,16,0.0)', 'rgba(13,20,16,0.6)', BG]}
            style={styles.heroGradient}
          />

          {/* Badge */}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>PARTNERSHIP PROGRAM</Text>
          </View>

          {/* Hero headline */}
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroHeadline1}>Make your society</Text>
            <Text style={styles.heroHeadline2}>cleaner, smarter &amp; greener.</Text>
            <Text style={styles.heroSubtitle}>
              End-to-end waste management for a cleaner,{'\n'}healthier and more sustainable community.
            </Text>

            {/* Pill row */}
            <View style={styles.pillRow}>
              {[
                { icon: 'document-text-outline', label: 'Annual contract' },
                { icon: 'location-outline',      label: 'Free site visits' },
                { icon: 'bar-chart-outline',     label: 'Impact reports' },
              ].map((p) => (
                <View key={p.label} style={styles.pill}>
                  <Ionicons name={p.icon as any} size={fs(13)} color={TEXT_PRIMARY} />
                  <Text style={styles.pillText}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── STATS STRIP ──────────────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          {/* Stat 1 */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={fs(24)} color={PRIMARY_MID} style={{ marginBottom: spacing(4) }} />
            <Text style={styles.statValue}>140+</Text>
            <Text style={styles.statLabel}>Societies{'\n'}onboarded</Text>
          </View>
          <View style={styles.statDivider} />
          {/* Stat 2 */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="recycle" size={fs(24)} color={PRIMARY_MID} style={{ marginBottom: spacing(4) }} />
            <Text style={styles.statValue}>82 T</Text>
            <Text style={styles.statLabel}>Waste{'\n'}collected &amp; recycled</Text>
          </View>
          <View style={styles.statDivider} />
          {/* Stat 3 */}
          <View style={styles.statItem}>
            <FontAwesome name="star" size={fs(20)} color={ACCENT_YELLOW} style={{ marginBottom: spacing(4) }} />
            <Text style={[styles.statValue, { color: ACCENT_YELLOW }]}>4.9 / 5</Text>
            <Text style={styles.statLabel}>Secretary{'\n'}rating</Text>
          </View>
        </View>

        {/* ── BUILT FOR BUSY TEAMS ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Built for busy society teams</Text>
            <TouchableOpacity style={styles.seeHowBtn} activeOpacity={0.7}>
              <Text style={styles.seeHowText}>See how it helps</Text>
              <Ionicons name="chevron-forward" size={fs(13)} color={PRIMARY_MID} />
            </TouchableOpacity>
          </View>

          <View style={styles.featureRow}>
            {FEATURES.map((f, idx) => (
              <View key={idx} style={[styles.featureCard, { width: CARD_W }]}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={fs(22)} color={TEXT_PRIMARY} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FROM ENQUIRY TO FIRST PICKUP (TIMELINE) ──────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From enquiry to first pickup</Text>

          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, idx) => (
              <View key={step.n} style={styles.timelineRow}>
                {/* Left: dot + line */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineDotNum}>{step.n}</Text>
                  </View>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineContentInner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineTitle}>{step.title}</Text>
                      <Text style={styles.timelineDesc}>{step.desc}</Text>
                    </View>
                    {/* Pill badge */}
                    <View style={[styles.timelinePill, { backgroundColor: step.pillBg }]}>
                      <Text style={[styles.timelinePillText, { color: step.pillText }]}>{step.pill}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── TESTIMONIAL ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What secretaries say</Text>
            <TouchableOpacity style={styles.seeHowBtn} activeOpacity={0.7}>
              <Text style={styles.seeHowText}>View all</Text>
              <Ionicons name="chevron-forward" size={fs(13)} color={PRIMARY_MID} />
            </TouchableOpacity>
          </View>

          <View style={styles.testimonialCard}>
            {/* Quote mark */}
            <Text style={styles.quoteIcon}>"</Text>

            <Text style={styles.testimonialText}>
              Residents used to dump waste randomly. After this tie-up, segregation compliance went from 20% to 78% in just 3 months.
            </Text>

            <View style={styles.testimonialFooter}>
              {/* Avatar */}
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>RS</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>Ramesh S.</Text>
                <Text style={styles.personRole}>Secretary, Sunrise Residency</Text>
              </View>
              {/* Stars */}
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <FontAwesome key={i} name="star" size={fs(15)} color={ACCENT_YELLOW} />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── STICKY CTA ───────────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing(12)) + spacing(4) },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.88}
          onPress={() => router.push('/services/society-tieup-book' as any)}
        >
          <MaterialCommunityIcons name="handshake-outline" size={fs(22)} color="#fff" />
          <Text style={styles.ctaBtnText}>Partner with Scrapiz</Text>
          <Ionicons name="arrow-forward" size={fs(20)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.ctaFootNote}>Free site visit • No commitment</Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Top bar ──
  topBar: {
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // ── Hero ──
  heroContainer: {
    height: hp(55),
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
    height: hp(35),
  },
  heroBadge: {
    position: 'absolute',
    top: spacing(90),
    left: spacing(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: spacing(4),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(10),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: {
    fontSize: fs(10),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.2,
  },
  heroTextBlock: {
    position: 'absolute',
    bottom: spacing(20),
    left: spacing(18),
    right: spacing(18),
  },
  heroHeadline1: {
    fontSize: fs(26),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    lineHeight: fs(32),
  },
  heroHeadline2: {
    fontSize: fs(26),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_GREEN,
    lineHeight: fs(34),
    marginBottom: spacing(8),
  },
  heroSubtitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: fs(19),
    marginBottom: spacing(14),
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(8),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(12),
    gap: spacing(5),
  },
  pillText: {
    fontSize: fs(11),
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: TEXT_PRIMARY,
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
    borderColor: 'rgba(87,175,103,0.18)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fs(22),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: PRIMARY_MID,
    marginBottom: spacing(2),
  },
  statLabel: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: fs(15),
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(87,175,103,0.22)',
  },

  // ── Generic section ──
  section: {
    marginHorizontal: spacing(16),
    marginTop: spacing(26),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(14),
  },
  sectionTitle: {
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    flexShrink: 1,
  },
  seeHowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  seeHowText: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: PRIMARY_MID,
  },

  // ── Feature cards ──
  featureRow: {
    flexDirection: 'row',
    gap: spacing(10),
  },
  featureCard: {
    backgroundColor: CARD_BG,
    borderRadius: spacing(14),
    padding: spacing(14),
    borderWidth: 1,
    borderColor: 'rgba(87,175,103,0.15)',
    minHeight: hp(16),
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(10),
  },
  featureTitle: {
    fontSize: fs(12),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    lineHeight: fs(17),
    marginBottom: spacing(6),
  },
  featureDesc: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    lineHeight: fs(16),
  },

  // ── Timeline ──
  timeline: {
    marginTop: spacing(4),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: hp(10),
  },
  timelineLeft: {
    width: 52,
    alignItems: 'center',
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
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
    backgroundColor: PRIMARY_MID,
    marginVertical: spacing(4),
    opacity: 0.45,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing(20),
    paddingTop: spacing(4),
  },
  timelineContentInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(10),
  },
  timelineTitle: {
    fontSize: fs(14),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: spacing(3),
  },
  timelineDesc: {
    fontSize: fs(12),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    lineHeight: fs(17),
  },
  timelinePill: {
    borderRadius: spacing(20),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(14),
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  timelinePillText: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },

  // ── Testimonial ──
  testimonialCard: {
    backgroundColor: CARD_BG,
    borderRadius: spacing(18),
    padding: spacing(18),
    borderWidth: 1,
    borderColor: 'rgba(87,175,103,0.2)',
  },
  quoteIcon: {
    fontSize: fs(42),
    fontFamily: 'Inter-Bold',
    fontWeight: '900',
    color: PRIMARY_MID,
    lineHeight: fs(40),
    marginBottom: spacing(4),
  },
  testimonialText: {
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    color: TEXT_PRIMARY,
    lineHeight: fs(21),
    marginBottom: spacing(16),
  },
  testimonialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: fs(15),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
  },
  personName: {
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  personRole: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    marginTop: spacing(1),
  },
  stars: {
    flexDirection: 'row',
    gap: spacing(2),
  },

  // ── Footer / CTA ──
  footer: {
    backgroundColor: BG,
    paddingTop: spacing(14),
    paddingHorizontal: spacing(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(87,175,103,0.15)',
    alignItems: 'center',
  },
  ctaBtn: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(16),
    borderRadius: spacing(14),
    gap: spacing(10),
    width: '100%',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: -spacing(10),
  },
  ctaFootNote: {
    fontSize: fs(12),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    marginTop: spacing(8),
    textAlign: 'center',
  },
});
