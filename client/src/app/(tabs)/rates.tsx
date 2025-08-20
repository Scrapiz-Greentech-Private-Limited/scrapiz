import React, { useEffect, useMemo, useState } from 'react';
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
import { AuthService, CategorySummary, ProductSummary } from '../../api/apiService';

const { width } = Dimensions.get('window');

export default function RatesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, prods] = await Promise.all([
          AuthService.getCategories(),
          AuthService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
      } catch (e) {}
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter(p => p.category === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const getTrendIcon = (minRate: number, maxRate: number) => {
    // Placeholder trend based on spread
    const spread = maxRate - minRate;
    if (spread > 20) return <ArrowUp size={12} color="#10b981" />;
    if (spread < 5) return <View style={{ width: 12, height: 12, backgroundColor: '#6b7280', borderRadius: 6 }} />;
    return <ArrowDown size={12} color="#ef4444" />;
  };

  const getTrendColor = (minRate: number, maxRate: number) => {
    const spread = maxRate - minRate;
    if (spread > 20) return '#10b981';
    if (spread < 5) return '#6b7280';
    return '#ef4444';
  };

  const renderCategoryTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryTab,
            selectedCategoryId === cat.id && { backgroundColor: '#3b82f6' }
          ]}
          onPress={() => setSelectedCategoryId(cat.id)}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategoryId === cat.id && styles.categoryTabTextActive
          ]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRateCard = (item: ProductSummary) => (
    <View key={item.id} style={styles.rateCard}>
      <LinearGradient colors={['#eef2ff', '#e0e7ff']} style={styles.rateCardGradient}>
        <View style={styles.rateCardHeader}>
          <View style={styles.rateCardLeft}>
            <Text style={styles.rateCardIcon}>♻️</Text>
            <View style={styles.rateCardInfo}>
              <Text style={styles.rateCardName}>{item.name}</Text>
              <Text style={styles.rateCardDescription}>{item.description}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bookmarkButton}>
            <Bookmark size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        <View style={styles.rateCardContent}>
          <View style={styles.priceContainer}>
            <Text style={[styles.ratePrice, { color: '#3b82f6' }]}>₹{item.min_rate}-{item.max_rate}</Text>
            <Text style={styles.rateUnit}>per kg</Text>
          </View>
          <View style={styles.trendContainer}>
            {getTrendIcon(item.min_rate, item.max_rate)}
            <Text style={[styles.trendText, { color: getTrendColor(item.min_rate, item.max_rate) }]}>range</Text>
          </View>
        </View>
        <View style={styles.rateCardFooter}>
          {/* <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}> 
            <Text style={styles.actionButtonText}>Get Quote</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.shareButton}>
            <Share size={16} color="#3b82f6" />
          </TouchableOpacity> */}
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
            <TouchableOpacity style={styles.refreshButton} onPress={async () => {
              try {
                const [cats, prods] = await Promise.all([
                  AuthService.getCategories(),
                  AuthService.getProducts(),
                ]);
                setCategories(cats);
                setProducts(prods);
                if (cats.length > 0 && !cats.find(c => c.id === selectedCategoryId)) setSelectedCategoryId(cats[0].id);
              } catch {}
            }}>
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
                <Text style={styles.summaryValue}>Active</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <BarChart3 size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Avg. Spread</Text>
                <Text style={styles.summaryValue}>~₹{Math.max(0, Math.round((products.reduce((s, p) => s + (p.max_rate - p.min_rate), 0) / Math.max(1, products.length))))}</Text>
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
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity style={styles.filterButton}>
              <BarChart3 size={16} color="#6b7280" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratesGrid}>
            {filteredProducts.map((item) => renderRateCard(item))}
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