import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  Bell,
  Package,
  TrendingUp,
  IndianRupee,
  Award,
  ArrowRight,
  Recycle,
  Truck,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const stats = [
    { id: 1, title: 'Total Earnings', value: '₹8,420', icon: IndianRupee, color: '#16a34a' },
    { id: 2, title: 'Orders Completed', value: '24', icon: Package, color: '#3b82f6' },
    { id: 3, title: 'Recycled Weight', value: '186kg', icon: Recycle, color: '#f59e0b' },
    { id: 4, title: 'Eco Score', value: '4.8★', icon: Award, color: '#8b5cf6' },
  ];

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Gradient */}
      <LinearGradient colors={['#16a34a', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>Rajesh Kumar</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color="white" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsContainer}
          >
            {stats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                <ArrowRight size={16} color="#6b7280" style={styles.actionArrow} />
              </TouchableOpacity>
            ))}
          </View>
            </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#dcfce7' }]}>
                <Package size={20} color="#16a34a" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Pickup Completed</Text>
                <Text style={styles.activitySubtitle}>Order #ORD-2024-002 • ₹650</Text>
                <Text style={styles.activityTime}>Yesterday, 4:45 PM</Text>
              </View>
            </View>
            
            <View style={styles.activityDivider} />
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                <Truck size={20} color="#3b82f6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Agent En Route</Text>
                <Text style={styles.activitySubtitle}>Order #ORD-2024-001 • ETA 30 mins</Text>
                <Text style={styles.activityTime}>Today, 2:30 PM</Text>
              </View>
            </View>
          </View>
              </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Environmental Impact</Text>
          <LinearGradient
            colors={['#f0fdf4', '#dcfce7']}
            style={styles.impactCard}
          >
            <View style={styles.impactHeader}>
              <Text style={styles.impactEmoji}>🌱</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Great Job!</Text>
                <Text style={styles.impactDescription}>
                  You've recycled 186kg of waste this month
                </Text>
              </View>
            </View>

            <View style={styles.impactStats}>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>124</Text>
                <Text style={styles.impactStatLabel}>Trees Saved</Text>
              </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>340kg</Text>
                <Text style={styles.impactStatLabel}>CO₂ Reduced</Text>
              </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>89%</Text>
                <Text style={styles.impactStatLabel}>Efficiency</Text>
              </View>
            </View>
          </LinearGradient>
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