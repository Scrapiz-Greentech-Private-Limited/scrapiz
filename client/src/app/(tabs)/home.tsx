import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import {
  TrendingUp,
  ChevronRight,
  PackagePlus,
  AreaChart,
  Package,
  Gift,
  Lightbulb,
  Hammer,
  Wrench,
  Building,
  Trash2,
  Truck,
  FileText,
} from 'lucide-react-native';

import CustomCarousel from '../../components/Carousel';

import { useHomeData } from '../../hooks/useHomeData';
import { useScrapCategories } from '../../hooks/useScrapCategories';
import { useRecentActivity } from '../../hooks/useRecentActivity';
import { useEnvironmentalImpact } from '../../hooks/useImpact';

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

const services = [
  { 
    id: 'demolition', 
    title: 'Demolition Service', 
    description: 'Building and structure demolition', 
    icon: Hammer, 
    color: '#dc2626',
  },
  { 
    id: 'dismantling', 
    title: 'Dismantling', 
    description: 'Equipment and machinery dismantling', 
    icon: Wrench, 
    color: '#ea580c',
  },
  { 
    id: 'paper-shredding', 
    title: 'Paper Shredding', 
    description: 'Secure document shredding', 
    icon: FileText, 
    color: '#0891b2',
  },
  { 
    id: 'society-tieup', 
    title: 'Society Tie-up', 
    description: 'Scrap collection for societies', 
    icon: Building, 
    color: '#7c3aed',
  },
  { 
    id: 'junk-removal', 
    title: 'Junk Removal', 
    description: 'Household and office junk removal', 
    icon: Trash2, 
    color: '#059669',
  },
]
const serviceGradients = {
   demolition: ['#dc2626', '#b91c1c'],
  dismantling: ['#ea580c', '#c2410c'],
  'paper-shredding': ['#0891b2', '#0ea5e9'],
  'society-tieup': ['#7c3aed', '#a855f7'],
  'junk-removal': ['#059669', '#34d399'],
}
const tips = [
  'Recycling one aluminum can saves enough energy to run a TV for 3 hours.',
  'The U.S. throws away $11.4 billion worth of recyclable containers and packaging every year.',
  'Recycling plastic saves twice as much energy as burning it in an incinerator.',
  'Around 1 billion trees worth of paper are thrown away every year in the U.S.',
  'Glass is 100% recyclable and can be recycled endlessly without loss in quality or purity.',
];
  const quickActions = [
    {
      id: 1,
      title: 'Sell Scrap',
      subtitle: 'Schedule pickup',
      icon: Package,
       colors: ['#16a34a', '#15803d'], // Use a colors array for the gradient
      iconColor: '#16a34a',
        route: '/(tabs)/sell',
    },
    {
      id: 2,
      title: 'View Rates',
      subtitle: 'Market prices',
      icon: TrendingUp,
      colors: ['#0ea5e9', '#0284c7'],
      iconColor: '#0ea5e9',
      route: '/(tabs)/rates',
    },
    {
      id: 3,
      title: 'Track Orders',
      subtitle: 'Order status',
      icon: Truck,
      colors: ['#f59e0b', '#d97706'],
      iconColor: '#f59e0b',
      route: '/(tabs)/orders',
    },
    {
      id: 4,
      title: 'Services',
      subtitle: 'Our offerings',
      icon: Wrench,
      colors: ['#8b5cf6', '#7c3aed'],
      iconColor: '#8b5cf6',
      route: '/(tabs)/services',
    }
  ];

export default function HomeScreen() {
  const router = useRouter();
  const {user , products, categories, orders, loading, error , refetch } = useHomeData()
  const scrapCategories = useScrapCategories(products || [], categories||[])
  const recentActivity = useRecentActivity(orders || [], products, 2)
  const { treesSaved , co2Reduced } = useEnvironmentalImpact(orders || [])
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const randomTip = tips[Math.floor(Math.random() * tips.length)]

  const adScrollRef = useRef<ScrollView | null>(null);
  const [adIndex, setAdIndex] = useState(0);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  useEffect(() => {
    if(error){
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const handleNavigate = (path: string) => {
    router.push(path as any);
  }
    useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const profileName = user?.name || 'User'; 

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  


  const adCardWidth = width - 40; // full-bleed minus horizontal padding
  const greeting = getGreeting();


   if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={['#16a34a']} 
        />
      }
    >

      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
        </View>
      </LinearGradient>
      <CustomCarousel />


      <View style={styles.section}>
  <Text style={styles.sectionTitle}>Quick Actions</Text>
  <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.actionsGrid}
  >
    {quickActions.map((action) => (
      <TouchableOpacity
        key={action.id}
        style={styles.actionCard}
        onPress={() => handleNavigate(action.route)}
      >
        <LinearGradient
          colors={action.colors} // Dynamic gradient colors
          style={styles.actionCardGradient}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'white' }]}>
            {/* Dynamic icon rendering */}
            <action.icon size={24} color={action.iconColor} /> 
          </View>
          <Text style={[styles.actionTitle, { color: 'white' }]}>{action.title}</Text>
          <Text style={[styles.actionSubtitle, { color: '#d1fae5' }]}>{action.subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    ))}
  </ScrollView>
      </View>

      {/* Market Rates - Backend Data */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Market Rates</Text>
          <TouchableOpacity onPress={() => handleNavigate('/(tabs)/rates')}>
            <TrendingUp size={16} color="#16a34a" />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.ratesScroll}
        >
          {scrapCategories.length > 0 ? (
            scrapCategories.slice(0, 4).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.rateCard}
                onPress={() => handleNavigate('/(tabs)/rates')}
              >
                <Image source={category.icon} style={styles.categoryIconImage} width={24} height={24} />
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={[styles.categoryRate, { color: category.color }]}>
                  {category.rate}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No rates available</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Tip of the Day */}
      <View style={styles.section}>
        <LinearGradient
          colors={['#f0f9ff', '#e0f2fe']}
          style={styles.tipCard}
        >
          <Lightbulb size={24} color="#0284c7" />
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>Tip of the Day</Text>
            <Text style={styles.tipText}>{randomTip}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services</Text>
          <TouchableOpacity onPress={() => handleNavigate('/(tabs)/services')}>
            <Text style={styles.moreServicesText}>More Services</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.servicesList}>
          {services.map((service) => (
            <LinearGradient
              key={service.id}
              colors={serviceGradients[service.id as keyof typeof serviceGradients]}
              style={styles.serviceCard}
            >
              <TouchableOpacity
                style={styles.serviceCardTouchable}
                onPress={() => handleNavigate(`/services/${service.id}`)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: 'white' }]}>
                  <service.icon size={22} color={service.color} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceTitle, { color: 'white' }]}>
                    {service.title}
                  </Text>
                  <Text style={[styles.serviceDescription, { color: 'white' }]}>
                    {service.description}
                  </Text>
                </View>
                <ChevronRight size={18} color="#f1f5f9" />
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Refer & Earn */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.referCard}
          onPress={() => handleNavigate('/profile/refer-friends')}
        >
          <LinearGradient
            colors={['#fffbeb', '#fef3c7']}
            style={styles.referCardGradient}
          >
            <Gift size={32} color="#f59e0b" />
            <View style={styles.referTextContainer}>
              <Text style={styles.referTitle}>Refer & Earn</Text>
              <Text style={styles.referSubtitle}>
                Share with friends and earn exciting rewards!
              </Text>
            </View>
            <ChevronRight size={20} color="#d4d4d8" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Environmental Impact - Backend Data */}
      {(treesSaved > 0 || co2Reduced > 0) && (
        <View style={[styles.section, styles.impactSection]}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          <LinearGradient colors={['#ecfdf5', '#a7f3d0']} style={styles.impactCard}>
            <Text style={styles.impactEmoji}>🌱</Text>
            <Text style={styles.impactText}>
              You've helped save{' '}
              <Text style={styles.impactHighlight}>{treesSaved} trees</Text> and reduced{' '}
              <Text style={styles.impactHighlight}>{co2Reduced}kg CO₂</Text> emissions this
              year!
            </Text>
          </LinearGradient>
        </View>
      )}

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#d1fae5',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  moreServicesText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  ratesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryIconImage: {
        width: 50, // Adjust size as needed
        height: 50, // Adjust size as needed
        borderRadius: 5,
        marginBottom: 5,
    },
  rateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryRate: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  tipCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    opacity: 0.9,
  },
  referCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  referCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  referTextContainer: {
    flex: 1,
  },
  referTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  referSubtitle: {
    fontSize: 14,
    color: '#92400e',
  },
  impactSection: {
    marginBottom: 40,
  },
  impactCard: {
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  impactEmoji: {
    fontSize: 48,
  },
  impactText: {
    flex: 1,
    fontSize: 15,
    color: '#065f46',
    lineHeight: 22,
  },
  impactHighlight: {
    fontWeight: '700',
    color: '#047857',
  },
});