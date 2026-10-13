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

// ── Palette (matching uploaded image exactly) ───────────────────────────────
const BG             = '#060D1A';
const CARD_BG        = '#0C1A30';
const CARD_BORDER    = 'rgba(38, 92, 175, 0.32)';
const ICON_CIRCLE_BG = '#132B52';
const ACCENT_BLUE    = '#38B6FF';
const ACCENT_CYAN    = '#5CAEFF';
const BTN_BLUE       = '#0066FF';
const TEXT_WHITE     = '#FFFFFF';
const TEXT_MUTED     = '#8FA2BC';
const TEXT_SUB       = '#9BB0C7';
const BADGE_BG       = 'rgba(12, 28, 54, 0.88)';
const BADGE_BORDER   = 'rgba(56, 150, 255, 0.35)';
const PILL_DARK      = '#0C203E';
const PILL_BORDER    = 'rgba(56, 182, 255, 0.45)';

export default function CorporateTieupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEnquiry = () => {
    router.push('/services/paper-shredding-book');
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── TOP NAV BAR ─────────────────────────────────────────────────── */}
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={fs(24)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Corporate Tie - Up</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: hp(4) + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ── HERO HEADER WITH FULL WIDTH IMAGE & OVERLAY TEXT ────────────── */}
        <View style={styles.heroContainer}>
          {/* Background image covering complete width of header */}
          <Image
            source={require('../../../assets/images/services/corporateTieup.webp')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Left-to-right gradient to darken left text area while keeping bins visible */}
          <LinearGradient
            colors={[
              'rgba(6, 13, 26, 0.95)',
              'rgba(6, 13, 26, 0.78)',
              'rgba(6, 13, 26, 0.35)',
              'rgba(6, 13, 26, 0.05)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top-to-bottom subtle gradient for nav and bottom blend */}
          <LinearGradient
            colors={[
              'rgba(6, 13, 26, 0.6)',
              'transparent',
              'rgba(6, 13, 26, 0.85)',
              BG,
            ]}
            locations={[0, 0.35, 0.85, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* High z-index content over header image */}
          <View
            style={[
              styles.heroContent,
              {
                paddingTop:
                  Platform.OS === 'android'
                    ? insets.top + spacing(64)
                    : insets.top + spacing(56),
              },
            ]}
          >
            {/* Pill Badge */}
            <View style={styles.heroPillBadge}>
              <Text style={styles.heroPillBadgeText}>B2B PARTNERSHIP PROGRAM</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroTitleWhite}>Zero-waste</Text>
            <Text style={styles.heroTitleWhite}>office.</Text>
            <Text style={styles.heroTitleCyan}>Full compliance.</Text>

            {/* Subtitle */}
            <Text style={styles.heroSubtitle}>
              End-to-end waste management for a cleaner, greener and compliant workplace.
            </Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              {/* Badge 1: ISO 14001 ready */}
              <View style={styles.badgeItem}>
                <Ionicons name="shield-checkmark" size={fs(15)} color={ACCENT_BLUE} />
                <View style={styles.badgeTextWrap}>
                  <Text style={styles.badgeLine1}>ISO 14001</Text>
                  <Text style={styles.badgeLine2}>ready</Text>
                </View>
              </View>

              {/* Badge 2: GST invoicing */}
              <View style={styles.badgeItem}>
                <Ionicons name="receipt-outline" size={fs(15)} color={ACCENT_BLUE} />
                <View style={styles.badgeTextWrap}>
                  <Text style={styles.badgeLine1}>GST</Text>
                  <Text style={styles.badgeLine2}>invoicing</Text>
                </View>
              </View>

              {/* Badge 3: Free audits */}
              <View style={styles.badgeItem}>
                <Ionicons name="bar-chart-outline" size={fs(15)} color={ACCENT_BLUE} />
                <View style={styles.badgeTextWrap}>
                  <Text style={styles.badgeLine1}>Free</Text>
                  <Text style={styles.badgeLine2}>audits</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── STATS STRIP / CARD ──────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {/* Stat 1 */}
          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <Ionicons name="business" size={fs(19)} color={ACCENT_BLUE} />
            </View>
            <View style={styles.statTextWrap}>
              <Text style={styles.statNumber}>320+</Text>
              <Text style={styles.statLabel}>Companies{'\n'}served</Text>
            </View>
          </View>

          {/* Stat 2 */}
          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <MaterialCommunityIcons name="recycle" size={fs(21)} color={ACCENT_BLUE} />
            </View>
            <View style={styles.statTextWrap}>
              <Text style={styles.statNumber}>1200 T</Text>
              <Text style={styles.statLabel}>Waste{'\n'}diverted</Text>
            </View>
          </View>

          {/* Stat 3 */}
          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <Ionicons name="star" size={fs(19)} color={ACCENT_BLUE} />
            </View>
            <View style={styles.statTextWrap}>
              <Text style={styles.statNumber}>4.9/5</Text>
              <Text style={styles.statLabel}>HR{'\n'}rating</Text>
            </View>
          </View>
        </View>

        {/* ── WHY COMPANIES CHOOSE US ? ───────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Why companies choose us ?</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerLinkRow}>
            <Text style={styles.headerLinkText}>See all benefits</Text>
            <Ionicons name="chevron-forward" size={fs(13)} color={ACCENT_BLUE} />
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            {/* Card 1 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="document-text" size={fs(19)} color={ACCENT_BLUE} />
              </View>
              <Text style={styles.featureTitle}>Compliance ready{'\n'}documents</Text>
              <Text style={styles.featureDesc}>
                Disposal certificates for ISO, ESG & CPCB audits.
              </Text>
            </View>

            {/* Card 2 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="leaf" size={fs(19)} color={ACCENT_BLUE} />
              </View>
              <Text style={styles.featureTitle}>End-to-end{'\n'}waste management</Text>
              <Text style={styles.featureDesc}>
                From segregation to responsible disposal.
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            {/* Card 3 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="people" size={fs(19)} color={ACCENT_BLUE} />
              </View>
              <Text style={styles.featureTitle}>Dedicated account{'\n'}manager</Text>
              <Text style={styles.featureDesc}>
                Single point of contact for all your locations.
              </Text>
            </View>

            {/* Card 4 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="bar-chart" size={fs(19)} color={ACCENT_BLUE} />
              </View>
              <Text style={styles.featureTitle}>Impact reports</Text>
              <Text style={styles.featureDesc}>
                Track waste diverted, recycling rate and environmental impact.
              </Text>
            </View>
          </View>
        </View>

        {/* ── HOW IT WORKS ? ──────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>How it works ?</Text>
        </View>

        <View style={styles.timelineWrap}>
          {/* Step 1 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineStepCol}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>1</Text>
              </View>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineIconBox}>
              <Ionicons name="document-text-outline" size={fs(20)} color={ACCENT_BLUE} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Submit free enquiry</Text>
              <Text style={styles.timelineDesc}>
                Share your company details & requirements.
              </Text>
            </View>

            <View style={styles.timelinePill}>
              <Text style={styles.timelinePillText}>Today</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineStepCol}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>2</Text>
              </View>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineIconBox}>
              <Ionicons name="call-outline" size={fs(20)} color={ACCENT_BLUE} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Discovery call + proposal</Text>
              <Text style={styles.timelineDesc}>
                Custom SLA & pricing sent with compliance certs listed.
              </Text>
            </View>

            <View style={styles.timelinePill}>
              <Text style={styles.timelinePillText}>2 - 3 days</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineStepCol}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>3</Text>
              </View>
            </View>

            <View style={styles.timelineIconBox}>
              <MaterialCommunityIcons name="truck-outline" size={fs(22)} color={ACCENT_BLUE} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Pickups begin</Text>
              <Text style={styles.timelineDesc}>
                e-Sign contract, raise PO, first pickup scheduled.
              </Text>
            </View>

            <View style={styles.timelinePill}>
              <Text style={styles.timelinePillText}>~ 1 week</Text>
            </View>
          </View>
        </View>

        {/* ── WHAT HR MANAGERS SAY ? ──────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>What HR managers say ?</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerLinkRow}>
            <Text style={styles.headerLinkText}>View all</Text>
            <Ionicons name="chevron-forward" size={fs(13)} color={ACCENT_BLUE} />
          </TouchableOpacity>
        </View>

        {/* Testimonial Card */}
        <View style={styles.testimonialCard}>
          <View style={styles.testimonialTopRow}>
            {/* Quote Mark */}
            <FontAwesome name="quote-left" size={fs(20)} color={ACCENT_BLUE} />

            {/* 5 Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons key={i} name="star" size={fs(16)} color="#FBBF24" />
              ))}
            </View>
          </View>

          <Text style={styles.testimonialText}>
            We cleared 3 years of archived documents securely before our ISO audits. The destruction certificate was accepted immediately.
          </Text>

          <View style={styles.testimonialAuthorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>RS</Text>
            </View>
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>Ramesh S.</Text>
              <Text style={styles.authorRole}>HR Manager, Fintech firm, Pune</Text>
            </View>
          </View>
        </View>

        {/* ── SUBMIT ENQUIRY CTA BUTTON ───────────────────────────────────── */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleEnquiry}
          activeOpacity={0.88}
        >
          <Ionicons name="calendar" size={fs(22)} color={TEXT_WHITE} style={styles.ctaIconLeft} />
          <Text style={styles.ctaButtonText}>Submit enquiry</Text>
          <Ionicons name="chevron-forward" size={fs(20)} color={TEXT_WHITE} style={styles.ctaIconRight} />
        </TouchableOpacity>

        {/* ── FOOTER TRUST BADGES ─────────────────────────────────────────── */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>
            ISO 14001 Compliant  •  GST Invoicing  •  Secure & Responsible Disposal
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },

  // ── Top Bar ──
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: fs(18),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_WHITE,
    textAlign: 'center',
  },

  // ── Hero Section ──
  heroContainer: {
    width: '100%',
    minHeight: hp(42),
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: BG,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(16),
  },
  heroPillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(9, 32, 68, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(56, 160, 255, 0.55)',
    borderRadius: spacing(20),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(4),
    marginBottom: spacing(10),
  },
  heroPillBadgeText: {
    color: ACCENT_CYAN,
    fontSize: fs(10),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitleWhite: {
    fontSize: fs(27),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_WHITE,
    lineHeight: fs(33),
  },
  heroTitleCyan: {
    fontSize: fs(27),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: ACCENT_BLUE,
    lineHeight: fs(34),
    marginBottom: spacing(8),
  },
  heroSubtitle: {
    fontSize: fs(12.5),
    fontFamily: 'Inter-Regular',
    color: TEXT_SUB,
    lineHeight: fs(18),
    maxWidth: SCREEN_WIDTH * 0.65,
    marginBottom: spacing(14),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(7),
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BADGE_BG,
    borderWidth: 1,
    borderColor: BADGE_BORDER,
    borderRadius: spacing(9),
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(6),
    gap: spacing(6),
  },
  badgeTextWrap: {
    justifyContent: 'center',
  },
  badgeLine1: {
    fontSize: fs(10),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_WHITE,
    lineHeight: fs(12),
  },
  badgeLine2: {
    fontSize: fs(9),
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: TEXT_MUTED,
    lineHeight: fs(11),
  },

  // ── Stats Card ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: spacing(16),
    marginHorizontal: spacing(16),
    marginTop: spacing(14),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(9),
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ICON_CIRCLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextWrap: {
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: fs(19),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_WHITE,
    lineHeight: fs(22),
  },
  statLabel: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    lineHeight: fs(14),
  },

  // ── Section Header Row ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing(16),
    marginTop: spacing(26),
    marginBottom: spacing(14),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_WHITE,
  },
  headerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  headerLinkText: {
    fontSize: fs(12.5),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: ACCENT_BLUE,
  },

  // ── Grid of 4 Cards ──
  gridContainer: {
    marginHorizontal: spacing(16),
    gap: spacing(10),
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing(10),
  },
  featureCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: spacing(14),
    padding: spacing(14),
    minHeight: 135,
    justifyContent: 'flex-start',
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ICON_CIRCLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(10),
  },
  featureTitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_WHITE,
    lineHeight: fs(17),
    marginBottom: spacing(5),
  },
  featureDesc: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    lineHeight: fs(15),
  },

  // ── Timeline ──
  timelineWrap: {
    marginHorizontal: spacing(16),
    gap: spacing(12),
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(10),
  },
  timelineStepCol: {
    width: 28,
    alignItems: 'center',
    marginTop: spacing(2),
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D6EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBubbleText: {
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#0C2548',
  },
  timelineLine: {
    width: 2,
    height: hp(5.2),
    backgroundColor: ACCENT_BLUE,
    marginTop: spacing(4),
  },
  timelineIconBox: {
    width: 42,
    height: 42,
    borderRadius: spacing(12),
    backgroundColor: '#102444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    paddingTop: spacing(1),
  },
  timelineTitle: {
    fontSize: fs(13.5),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: TEXT_WHITE,
    marginBottom: spacing(3),
  },
  timelineDesc: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: TEXT_MUTED,
    lineHeight: fs(15),
  },
  timelinePill: {
    backgroundColor: PILL_DARK,
    borderWidth: 1,
    borderColor: PILL_BORDER,
    borderRadius: spacing(20),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(5),
    alignSelf: 'center',
  },
  timelinePillText: {
    fontSize: fs(11),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: ACCENT_BLUE,
  },

  // ── Testimonials ──
  testimonialCard: {
    backgroundColor: '#D4ECFC',
    borderRadius: spacing(16),
    marginHorizontal: spacing(16),
    padding: spacing(16),
  },
  testimonialTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(8),
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  testimonialText: {
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#0A2548',
    lineHeight: fs(19),
    marginBottom: spacing(12),
  },
  testimonialAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A2B5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: TEXT_WHITE,
    fontSize: fs(13),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
  },
  authorMeta: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: fs(13.5),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#0A2548',
  },
  authorRole: {
    fontSize: fs(11),
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: '#4A698F',
    marginTop: 1,
  },

  // ── CTA Button ──
  ctaButton: {
    backgroundColor: BTN_BLUE,
    height: 52,
    borderRadius: spacing(14),
    marginHorizontal: spacing(16),
    marginTop: spacing(24),
    marginBottom: spacing(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: BTN_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIconLeft: {
    marginRight: spacing(8),
  },
  ctaButtonText: {
    fontSize: fs(16),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: TEXT_WHITE,
  },
  ctaIconRight: {
    position: 'absolute',
    right: spacing(16),
  },

  // ── Footer ──
  footerWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    marginBottom: spacing(8),
  },
  footerText: {
    fontSize: fs(10.5),
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: '#6F88A5',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
