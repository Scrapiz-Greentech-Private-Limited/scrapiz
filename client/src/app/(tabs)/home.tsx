import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  Package,
  TrendingUp,
  ArrowRight,
  Truck,
} from 'lucide-react-native';
import { AuthService, UserProfile } from '../../api/apiService';

const { width } = Dimensions.get('window');

function formatAMPM(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesString = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutesString + ' ' + ampm;
  return strTime;
}

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AuthService.getUser();
        setUser(data);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profileName = user?.name || 'User'; 

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // const stats = [
  //   { id: 1, title: 'Total Earnings', value: '₹8,420', icon: IndianRupee, color: '#16a34a' },
  //   { id: 2, title: 'Orders Completed', value: '2', icon: Package, color: '#3b82f6' },
  // ];

  const quickActions = [
    {
      id: 1,
      title: 'Sell Scrap',
      subtitle: 'Schedule pickup',
      icon: Package,
      color: '#16a34a',
      route: '/(tabs)/sell',
    },
    {
      id: 2,
      title: 'View Rates',
      subtitle: 'Market prices',
      icon: TrendingUp,
      color: '#3b82f6',
      route: '/(tabs)/rates',
    },
    {
      id: 3,
      title: 'Track Orders',
      subtitle: 'Order status',
      icon: Truck,
      color: '#f59e0b',
      route: '/(tabs)/orders',
    },
  ];

  const ads = [
    { id: 1, title: 'Get ₹100 Bonus', subtitle: 'Refer a friend and earn rewards', colors: ['#fde68a', '#fbbf24'] },
    { id: 2, title: 'Higher Rates Today', subtitle: 'Best prices for Iron & Copper', colors: ['#bfdbfe', '#93c5fd'] },
    { id: 3, title: 'Eco Challenge', subtitle: 'Recycle 10kg this week and win', colors: ['#c7d2fe', '#a5b4fc'] },
  ];

  const adScrollRef = useRef<ScrollView | null>(null);
  const [adIndex, setAdIndex] = useState(0);
  const adCardWidth = width - 40; // full-bleed minus horizontal padding

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (adIndex + 1) % ads.length;
      setAdIndex(next);
      try {
        adScrollRef.current?.scrollTo({ x: next * (adCardWidth + 16), animated: true });
      } catch {}
    }, 3500);
    return () => clearInterval(interval);
  }, [adIndex, ads.length, adCardWidth]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Gradient */}
      <LinearGradient colors={['#16a34a', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{profileName}</Text>
            </View>
          </View>

        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ads Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad's</Text>
          <ScrollView
            ref={adScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={adCardWidth + 16}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 8 }}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / (adCardWidth + 16));
              if (idx !== adIndex) setAdIndex(idx);
            }}
            scrollEventThrottle={16}
            style={{ marginHorizontal: -8 }}
          >
            {ads.map((ad) => (
              <LinearGradient key={ad.id} colors={ad.colors as any} style={[styles.adCard, { width: adCardWidth, marginHorizontal: 8 }] }>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adSubtitle}>{ad.subtitle}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
          <View style={styles.adDots}>
            {ads.map((ad, idx) => (
              <View key={ad.id} style={[styles.adDot, idx === adIndex && styles.adDotActive]} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <action.icon size={24} color="white" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                {/* <Text style={styles.actionSubtitle}>{action.subtitle}</Text> */}
                <ArrowRight size={26} color="#6b7280" style={styles.actionArrow} />
              </TouchableOpacity>
            ))}
          </View>
            </View>      
        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Recycling</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Did you know?</Text>
            <Text style={styles.tipText}>
              Separating your metal scraps can increase their value by up to 30%. 
              Clean copper and aluminum fetch higher rates!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  statsContainer: {
    marginHorizontal: -8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  actionsGrid: {
    gap: 12,
  },
  adCard: {
    marginHorizontal: 8,
    borderRadius: 16,
    padding: 16,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  adSubtitle: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
  },
  adDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  adDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  adDotActive: {
    backgroundColor: '#6b7280',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  actionArrow: {
    position: 'absolute',
    right: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 16,
  },
  impactCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  impactEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'Inter-Bold',
  },
  impactDescription: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  impactStat: {
    alignItems: 'center',
  },
  impactStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: 'Inter-Bold',
  },
  impactStatLabel: {
    fontSize: 12,
    color: '#166534',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#78716c',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});