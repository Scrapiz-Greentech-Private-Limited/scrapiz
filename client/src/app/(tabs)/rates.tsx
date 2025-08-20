import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  CircleAlert as AlertCircle, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  BarChart3,
  Calendar,
  RefreshCw,
  Bookmark,
  Share
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const scrapRates = {
  metal: [
    { name: 'Iron', rate: '₹30-35', trend: 'down', change: '-2.5%', icon: '⚙️', description: 'Scrap iron, steel parts', baseRate: 32.5 },
    { name: 'Tin', rate: '₹25-30', trend: 'up', change: '+1.8%', icon: '🥫', description: 'Tin cans, containers', baseRate: 27.5 },
    { name: 'Steel', rate: '₹45-50', trend: 'stable', change: '0.0%', icon: '🔧', description: 'Steel utensils, parts', baseRate: 47.5 },
    { name: 'Aluminum', rate: '₹150-180', trend: 'up', change: '+3.2%', icon: '🪜', description: 'Aluminum sheets, cans', baseRate: 165 },
    { name: 'Brass', rate: '₹600-680', trend: 'up', change: '+5.1%', icon: '🔔', description: 'Brass fittings, decorative items', baseRate: 640 },
    { name: 'Copper', rate: '₹600-680', trend: 'down', change: '-1.2%', icon: '🔌', description: 'Copper wires, pipes', baseRate: 640 },
  ],
  paper: [
    { name: 'Books', rate: '₹10-12', trend: 'stable', change: '0.0%', icon: '📚', description: 'Old books, notebooks', baseRate: 11 },
    { name: 'Cardboard', rate: '₹10-12', trend: 'up', change: '+0.8%', icon: '📦', description: 'Corrugated boxes', baseRate: 11 },
    { name: 'Office Paper', rate: '₹10-14', trend: 'up', change: '+1.5%', icon: '📄', description: 'White office paper', baseRate: 12 },
    { name: 'Newspaper', rate: '₹12-15', trend: 'down', change: '-0.5%', icon: '📰', description: 'Daily newspapers', baseRate: 13.5 },
    { name: 'Magazines', rate: '₹8-10', trend: 'stable', change: '0.0%', icon: '📖', description: 'Glossy magazines', baseRate: 9 },
    { name: 'Mixed Paper', rate: '₹6-8', trend: 'up', change: '+0.3%', icon: '📋', description: 'Mixed paper waste', baseRate: 7 },
  ],
  plastic: [
    { name: 'Blue Drum', rate: '₹40-50', trend: 'up', change: '+2.1%', icon: '🛢️', description: 'Large plastic drums', baseRate: 45 },
    { name: 'PVC Pipe', rate: '₹10-15', trend: 'stable', change: '0.0%', icon: '🔧', description: 'PVC pipes, fittings', baseRate: 12.5 },
    { name: 'PET Bottles', rate: '₹20-25', trend: 'up', change: '+1.2%', icon: '🧴', description: 'PET bottles', baseRate: 22.5 },
    { name: 'Plastic Crates', rate: '₹25-30', trend: 'down', change: '-0.8%', icon: '📦', description: 'Storage crates', baseRate: 27.5 },
    { name: 'Polythene Bags', rate: '₹15-18', trend: 'up', change: '+0.5%', icon: '🛍️', description: 'Polythene bags', baseRate: 16.5 },
    { name: 'Containers', rate: '₹15-20', trend: 'stable', change: '0.0%', icon: '🥡', description: 'Food containers', baseRate: 17.5 },
  ],
  electronics: [
    { name: 'Mobile Phones', rate: '₹100-500', trend: 'up', change: '+4.2%', icon: '📱', description: 'Old smartphones', baseRate: 300 },
    { name: 'Laptops', rate: '₹500-2000', trend: 'up', change: '+2.8%', icon: '💻', description: 'Old laptops, computers', baseRate: 1250 },
    { name: 'TV/Monitor', rate: '₹200-800', trend: 'down', change: '-1.5%', icon: '📺', description: 'CRT/LCD screens', baseRate: 500 },
    { name: 'Cables & Wires', rate: '₹50-150', trend: 'up', change: '+1.8%', icon: '🔌', description: 'Electronic cables', baseRate: 100 },
    { name: 'Circuit Boards', rate: '₹300-1000', trend: 'up', change: '+3.5%', icon: '🔧', description: 'PCBs, motherboards', baseRate: 650 },
    { name: 'Batteries', rate: '₹80-200', trend: 'stable', change: '0.0%', icon: '🔋', description: 'Lead acid, lithium', baseRate: 140 },
  ],
};

const categoryConfig = {
  metal: { title: 'Metal Scrap', color: '#f59e0b', bgColor: '#fef3c7', gradient: ['#fef3c7', '#fde68a'] },
  paper: { title: 'Paper Scrap', color: '#10b981', bgColor: '#d1fae5', gradient: ['#d1fae5', '#a7f3d0'] },
  plastic: { title: 'Plastic Scrap', color: '#3b82f6', bgColor: '#dbeafe', gradient: ['#dbeafe', '#bfdbfe'] },
  electronics: { title: 'Electronic Scrap', color: '#8b5cf6', bgColor: '#ede9fe', gradient: ['#ede9fe', '#ddd6fe'] },
};

export default function RatesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof scrapRates>('metal');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp size={12} color="#10b981" />;
      case 'down':
        return <ArrowDown size={12} color="#ef4444" />;
      default:
        return <View style={{ width: 12, height: 12, backgroundColor: '#6b7280', borderRadius: 6 }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderCategoryTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
      {Object.entries(categoryConfig).map(([key, config]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.categoryTab,
            selectedCategory === key && { backgroundColor: config.color }
          ]}
          onPress={() => setSelectedCategory(key as keyof typeof scrapRates)}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === key && styles.categoryTabTextActive
          ]}>
            {config.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRateCard = (item: any, config: any) => (
    <View key={item.name} style={styles.rateCard}>
      <LinearGradient colors={config.gradient} style={styles.rateCardGradient}>
        <View style={styles.rateCardHeader}>
          <View style={styles.rateCardLeft}>
            <Text style={styles.rateCardIcon}>{item.icon}</Text>
            <View style={styles.rateCardInfo}>
              <Text style={styles.rateCardName}>{item.name}</Text>
              <Text style={styles.rateCardDescription}>{item.description}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.bookmarkButton}>
            <Bookmark size={16} color={config.color} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.rateCardContent}>
          <View style={styles.priceContainer}>
            <Text style={[styles.ratePrice, { color: config.color }]}>{item.rate}</Text>
            <Text style={styles.rateUnit}>per kg</Text>
          </View>
          
          <View style={styles.trendContainer}>
            {getTrendIcon(item.trend)}
            <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
              {item.change}
            </Text>
          </View>
        </View>
        
        <View style={styles.rateCardFooter}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: config.color }]}>
            <Text style={styles.actionButtonText}>Get Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Share size={16} color={config.color} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1e293b" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#334155']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Market Rates</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <RefreshCw size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.headerSubtitle}>Real-time scrap material prices</Text>
          
          <View style={styles.marketSummary}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <TrendingUp size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Market Status</Text>
                <Text style={styles.summaryValue}>Bullish</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <BarChart3 size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Avg. Growth</Text>
                <Text style={styles.summaryValue}>+2.1%</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Calendar size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Updated</Text>
                <Text style={styles.summaryValue}>Today</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.section}>
          {renderCategoryTabs()}
        </View>

        {/* Disclaimer */}
        <View style={styles.section}>
          <View style={styles.disclaimerCard}>
            <AlertCircle size={20} color="#f59e0b" />
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>Price Disclaimer</Text>
              <Text style={styles.disclaimerText}>
                Rates vary based on quality, quantity, location, and market conditions. 
                Contact us for accurate pricing.
              </Text>
            </View>
          </View>
        </View>

        {/* Rates Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {categoryConfig[selectedCategory].title} Rates
            </Text>
            <TouchableOpacity style={styles.filterButton}>
              <BarChart3 size={16} color="#6b7280" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.ratesGrid}>
            {scrapRates[selectedCategory].map((item) => 
              renderRateCard(item, categoryConfig[selectedCategory])
            )}
          </View>
        </View>

        {/* Market Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights</Text>
          <View style={styles.trendsCard}>
            <View style={styles.trendInsight}>
              <View style={[styles.trendIndicator, { backgroundColor: '#10b981' }]} />
              <Text style={styles.trendInsightText}>Metal prices showing upward trend this week</Text>
            </View>
            <View style={styles.trendInsight}>
              <View style={[styles.trendIndicator, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.trendInsightText}>Electronics demand increasing due to festive season</Text>
            </View>
            <View style={styles.trendInsight}>
              <View style={[styles.trendIndicator, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.trendInsightText}>Paper rates stable with slight seasonal variation</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.section}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready to Sell?</Text>
            <Text style={styles.ctaSubtitle}>
              Get instant quotes based on current market rates for your scrap materials.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/sell')}
            >
              <Text style={styles.ctaButtonText}>Schedule Pickup</Text>
              <ArrowUp size={16} color="#6366f1" style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </LinearGradient>
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
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  marketSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesContainer: {
    marginHorizontal: -8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Inter-SemiBold',
  },
  categoryTabTextActive: {
    color: 'white',
  },
  disclaimerCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#78716c',
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  ratesGrid: {
    gap: 16,
  },
  rateCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rateCardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  rateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rateCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rateCardInfo: {
    flex: 1,
  },
  rateCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  rateCardDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  ratePrice: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
  },
  rateUnit: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  rateCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendInsightText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  ctaCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    fontFamily: 'Inter-Bold',
  },
});