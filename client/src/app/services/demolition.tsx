import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Assets ───────────────────────────────────────────────────────────────────
const HERO_IMAGE = require('../../../assets/images/services/deomlition_app.webp');
const GALLERY_IMAGES = [
  require('../../../assets/images/services/demolition/demo1.png'),
  require('../../../assets/images/services/demolition/demo2.png'),
  require('../../../assets/images/services/demolition/demo3.png'),
  require('../../../assets/images/services/demolition/demo4.webp'),
];

// ─── Included items ───────────────────────────────────────────────────────────
const INCLUDED_ITEMS = [
  { icon: 'clipboard-list-outline', label: 'On-site assessment and quote', sub: 'Detailed inspection and transparent pricing' },
  { icon: 'account-group-outline',  label: 'Professional team and equipment', sub: 'Experienced crew with modern machinery' },
  { icon: 'leaf',                   label: 'Eco-friendly disposal', sub: 'Responsible waste management & recycling' },
  { icon: 'shield-check-outline',   label: 'Insurance coverage', sub: 'Fully insured for all work' },
  { icon: 'star-four-points',       label: 'Clean-up after completion', sub: 'We leave your space clean and ready' },
  { icon: 'file-document-outline',  label: 'Complete project management', sub: 'From start to finish, hassle-free' },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  { n: 1, title: 'Book Service',    desc: 'Choose your service and share your details.' },
  { n: 2, title: 'Site Visit',      desc: 'We assess the site and provide a quote.' },
  { n: 3, title: 'Demolition',      desc: 'Our expert team completes the work safely and efficiently.' },
  { n: 4, title: 'Clean & Dispose', desc: 'We clean the site and dispose waste responsibly.' },
];

const PRIMARY = '#1a7c3a';
const PRIMARY_LIGHT = '#e6f4ea';

export default function DemolitionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const TILE_W = (SCREEN_WIDTH - spacing(32) - spacing(6) * 3) / 4;

  const handleBook = () => {
    router.push({ pathname: '/services/demolition-book', params: { service: 'demolition' } } as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(12) + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO IMAGE ─────────────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.60)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top nav */}
          <View
            style={[
              styles.topNav,
              { paddingTop: Platform.OS === 'android' ? insets.top + spacing(10) : insets.top + spacing(4) },
            ]}
          >
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={fs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity style={styles.navBtn} activeOpacity={0.85}>
                <Feather name="share-2" size={fs(18)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navBtn, { marginLeft: spacing(8) }]} activeOpacity={0.85}>
                <Ionicons name="heart-outline" size={fs(20)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero text */}
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitle}>Demolition Service</Text>
            <Text style={styles.heroSubtitle}>Building and structure demolition</Text>
          </View>
        </View>

        {/* ── STATS ROW ──────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#e6f4ea' }]}>
              <MaterialCommunityIcons name="shield-check" size={fs(17)} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.statLabel}>Insured</Text>
              <Text style={styles.statSub}>Your property protected</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#fef9e7' }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={fs(17)} color="#d4a017" />
            </View>
            <View>
              <Text style={styles.statLabel}>Fast</Text>
              <Text style={styles.statSub}>On-time completion</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#fef9e7' }]}>
              <Ionicons name="star" size={fs(15)} color="#d4a017" />
            </View>
            <View>
              <Text style={styles.statLabel}>4.8 (320+)</Text>
              <Text style={styles.statSub}>Customer rating</Text>
            </View>
          </View>
        </View>

        {/* ── WHAT'S INCLUDED ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>What's Included</Text>
            <View style={styles.ecoBadge}>
              <MaterialCommunityIcons name="leaf" size={fs(10)} color={PRIMARY} />
              <Text style={styles.ecoBadgeText}>Safe • Professional • Eco-friendly</Text>
            </View>
          </View>

          <View style={styles.includedGrid}>
            {INCLUDED_ITEMS.map((item, idx) => (
              <View key={idx} style={styles.includedCell}>
                <View style={styles.includedIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={fs(19)} color={PRIMARY} />
                </View>
                <Text style={styles.includedLabel}>{item.label}</Text>
                <Text style={styles.includedSub}>{item.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          {/* Stepper circles with connecting line */}
          <View style={styles.stepsRow}>
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.n}>
                <View style={styles.stepCircleWrap}>
                  <View style={[
                    styles.stepCircle,
                    idx === 0 && { backgroundColor: PRIMARY, borderColor: PRIMARY },
                  ]}>
                    <Text style={[styles.stepNum, idx === 0 && { color: '#fff' }]}>{step.n}</Text>
                  </View>
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={styles.stepLine} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Step labels */}
          <View style={styles.stepsLabels}>
            {STEPS.map((step) => (
              <View key={step.n} style={styles.stepLabelCol}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SERVICE GALLERY ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Service Gallery</Text>
            <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={fs(13)} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.galleryRow}>
            {GALLERY_IMAGES.map((src, idx) => (
              <View key={idx} style={[styles.galleryTile, { width: TILE_W, height: TILE_W * 1.08 }]}>
                <Image source={src} style={styles.galleryImg} resizeMode="cover" />
                {idx === GALLERY_IMAGES.length - 1 && (
                  <View style={styles.galleryOverlay}>
                    <Text style={styles.galleryOverlayText}>+5</Text>
                  </View>
                )}
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
          <Ionicons name="arrow-forward" size={fs(20)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f4f2',
  },

  // ── Hero ──
  heroContainer: {
    height: hp(38),
    width: '100%',
    backgroundColor: '#222',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
  },
  heroTitleBlock: {
    position: 'absolute',
    bottom: spacing(20),
    left: spacing(18),
    right: spacing(18),
  },
  heroTitle: {
    fontSize: fs(28),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.88)',
    marginTop: spacing(3),
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing(16),
    marginTop: spacing(14),
    borderRadius: spacing(14),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing(16),
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(7),
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statSub: {
    fontSize: fs(10),
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e8e8e8',
    marginHorizontal: spacing(4),
  },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing(16),
    borderRadius: spacing(16),
    padding: spacing(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing(20),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(16),
    flexWrap: 'wrap',
    gap: spacing(8),
  },
  cardTitle: {
    fontSize: fs(16),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#0f1f12',
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: spacing(20),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(8),
    gap: spacing(4),
  },
  ecoBadgeText: {
    fontSize: fs(9),
    fontFamily: 'Inter-Medium',
    color: PRIMARY,
    fontWeight: '600',
  },
  includedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(14),
  },
  includedCell: {
    width: '46%',
    flexGrow: 1,
  },
  includedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(6),
  },
  includedLabel: {
    fontSize: fs(12),
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: spacing(2),
    lineHeight: fs(17),
  },
  includedSub: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: '#777',
    lineHeight: fs(15),
  },

  // ── Section wrapper ──
  section: {
    marginHorizontal: spacing(16),
    marginBottom: spacing(24),
  },
  sectionTitle: {
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#0f1f12',
    marginBottom: spacing(14),
  },

  // ── Steps ──
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(10),
  },
  stepCircleWrap: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#d0d0d0',
    borderStyle: 'dashed',
  },
  stepNum: {
    fontSize: fs(14),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#666',
  },
  stepsLabels: {
    flexDirection: 'row',
  },
  stepLabelCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing(1),
  },
  stepTitle: {
    fontSize: fs(11),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  stepDesc: {
    fontSize: fs(10),
    fontFamily: 'Inter-Regular',
    color: '#777',
    textAlign: 'center',
    lineHeight: fs(14),
  },

  // ── Gallery ──
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(10),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
  },
  viewAllText: {
    fontSize: fs(13),
    fontFamily: 'Inter-SemiBold',
    color: PRIMARY,
    fontWeight: '600',
    marginBottom: spacing(14),
  },
  galleryRow: {
    flexDirection: 'row',
    gap: spacing(6),
  },
  galleryTile: {
    borderRadius: spacing(10),
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.46)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlayText: {
    color: '#fff',
    fontSize: fs(18),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },

  // ── Footer ──
  footer: {
    backgroundColor: '#fff',
    paddingTop: spacing(12),
    paddingHorizontal: spacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  bookBtn: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(16),
    borderRadius: spacing(14),
    gap: spacing(10),
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: fs(17),
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: -spacing(10),
  },
});
