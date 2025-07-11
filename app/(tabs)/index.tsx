import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions 
} from 'react-native';
import { 
  Recycle, 
  TrendingUp, 
  Clock, 
  IndianRupee,
  ChevronRight,
  Zap
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const scrapCategories = [
  {
    id: 1,
    name: 'Paper & Cardboard',
    rate: '₹12/kg',
    icon: '📄',
    color: '#10b981',
    items: ['Newspapers', 'Magazines', 'Cardboard', 'Office Paper']
  },
  {
    id: 2,
    name: 'Plastic',
    rate: '₹18/kg',
    icon: '🧴',
    color: '#3b82f6',
    items: ['Bottles', 'Containers', 'Bags', 'Electronics Cases']
  },
  {
    id: 3,
    name: 'Metal',
    rate: '₹45/kg',
    icon: '🔧',
    color: '#f59e0b',
    items: ['Iron', 'Steel', 'Aluminum', 'Copper']
  },
  {
    id: 4,
    name: 'Electronics',
    rate: '₹85/kg',
    icon: '📱',
    color: '#8b5cf6',
    items: ['Mobile Phones', 'Laptops', 'Components', 'Cables']
  }
];

const recentActivity = [
  {
    id: 1,
    type: 'pickup_completed',
    amount: '₹480',
    date: 'Today',
    description: 'Mixed scrap pickup completed'
  },
  {
    id: 2,
    type: 'pickup_scheduled',
    amount: '₹320',
    date: 'Tomorrow',
    description: 'Electronics pickup scheduled'
  }
];

// Function to get dynamic greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning!';
  } else if (hour < 17) {
    return 'Good afternoon!';
  } else {
    return 'Good evening!';
  }
};

export default function HomeScreen() {
  const router = useRouter();
  // This will be replaced with actual user data from database later
  const userName = 'Rajesh Kumar';
  const greeting = getGreeting();

  const handleSellScrap = () => {
    router.push('/(tabs)/sell');
  };

  const handleTrackOrder = () => {
    router.push('/(tabs)/orders');
  };

  const handleViewRates = () => {
    router.push('/(tabs)/rates');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>
      </View>

      {/* Market Rates */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Market Rates</Text>
          <TouchableOpacity onPress={handleViewRates}>
            <TrendingUp size={16} color="#16a34a" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ratesScroll}>
          {scrapCategories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.rateCard}
              onPress={handleViewRates}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={[styles.categoryRate, { color: category.color }]}>
                {category.rate}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#f0fdf4' }]}
            onPress={handleSellScrap}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#16a34a' }]}>
              <Recycle size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>Sell Scrap</Text>
            <Text style={styles.actionSubtitle}>Schedule pickup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#eff6ff' }]}
            onPress={handleTrackOrder}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0ea5e9' }]}>
              <Clock size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>Track Order</Text>
            <Text style={styles.actionSubtitle}>View status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <ChevronRight size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityLeft}>
              <View style={[
                styles.activityIcon,
                { 
                  backgroundColor: activity.type === 'pickup_completed' 
                    ? '#dcfce7' 
                    : '#fef3c7' 
                }
              ]}>
                {activity.type === 'pickup_completed' ? (
                  <Recycle size={16} color="#16a34a" />
                ) : (
                  <Clock size={16} color="#f59e0b" />
                )}
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </View>
            <Text style={styles.activityAmount}>{activity.amount}</Text>
          </View>
        ))}
      </View>

      {/* Environmental Impact */}
      <View style={[styles.section, styles.impactSection]}>
        <Text style={styles.sectionTitle}>Environmental Impact</Text>
        <View style={styles.impactCard}>
          <Text style={styles.impactEmoji}>🌱</Text>
          <Text style={styles.impactText}>
            You've helped save{' '}
            <Text style={styles.impactHighlight}>124 trees</Text>
            {' '}and reduced{' '}
            <Text style={styles.impactHighlight}>340kg CO₂</Text>
            {' '}emissions this year!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  ratesScroll: {
    marginHorizontal: -8,
  },
  rateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryRate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  impactSection: {
    marginBottom: 20,
  },
  impactCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  impactEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  impactHighlight: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});