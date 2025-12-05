import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  TrendingUp,
  CircleAlert as AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { wp, hp, fs } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { AuthService, CategorySummary, ProductSummary } from '../../api/apiService';
import { RemoteImage } from '../../components/RemoteImage';
import TutorialOverlay from '@/src/components/TutorialOverlay';
import { ratesTutorialConfig } from '@/src/config/tutorials/homeTutorial';
import { useTutorialStore } from '@/src/store/tutorialStore';

// Helper to get product image - checks S3 URL first, then falls back to local assets
const getImageForProduct = (product: ProductSummary) => {
  // Priority 1: Use S3 image if available
  if (product.image_url) {
    return { uri: product.image_url };
  }
  
  // Priority 2: Fallback to local assets based on product name
  const name = product.name.toLowerCase();
  if (name.includes('newspaper')) return require('../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
  if (name.includes('cardboard') || name.includes('corrugated')) return require('../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
  if (name.includes('book') || name.includes('paper')) return require('../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  if (name.includes('plastic')) return require('../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
  if (name.includes('iron') || name.includes('steel')) return require('../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
  if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
  if (name.includes('copper')) return require('../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
  if (name.includes('brass')) return require('../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
  if (name.includes('tin')) return require('../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
  if (name.includes('refrigerator')) return require('../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
  if (name.includes('battery')) return require('../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
  if (name.includes('front load machine')) return require('../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
  if (name.includes('tv') || name.includes('television')) return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
  if (name.includes('laptops')) return require('../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
  if (name.includes('windowac')) return require('../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
  if (name.includes('printer')) return require('../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
  if (name.includes('microwave')) return require('../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
  if (name.includes('glass')) return require('../../../assets/images/Scrap_Rates_Photos/glass.jpg');
  return null;
};

// Helper to get fallback image for a product (used by RemoteImage component)
const getFallbackImageForProduct = (productName: string) => {
  const name = productName.toLowerCase();
  if (name.includes('newspaper')) return require('../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
  if (name.includes('cardboard') || name.includes('corrugated')) return require('../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
  if (name.includes('book') || name.includes('paper')) return require('../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  if (name.includes('plastic')) return require('../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
  if (name.includes('iron') || name.includes('steel')) return require('../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
  if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
  if (name.includes('copper')) return require('../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
  if (name.includes('brass')) return require('../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
  if (name.includes('tin')) return require('../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
  if (name.includes('refrigerator')) return require('../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
  if (name.includes('battery')) return require('../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
  if (name.includes('front load machine')) return require('../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
  if (name.includes('tv') || name.includes('television')) return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
  if (name.includes('laptops')) return require('../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
  if (name.includes('windowac')) return require('../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
  if (name.includes('printer')) return require('../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
  if (name.includes('microwave')) return require('../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
  if (name.includes('glass')) return require('../../../assets/images/Scrap_Rates_Photos/glass.jpg');
  // Default fallback
  return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
};

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('paper') || name.includes('cardboard')) return '📄';
  if (name.includes('plastic')) return '🧴';
  if (name.includes('metal') || name.includes('iron') || name.includes('steel')) return '🔧';
  if (name.includes('electronic') || name.includes('e-waste')) return '📱';
  if (name.includes('glass')) return '🍾';
  return '♻️';
};


export default function RatesScreen(){
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tutorial system integration
  const { setStepTarget, currentScreen } = useTutorialStore();
  const disclaimerRef = useRef<View>(null);
  const categoryRef = useRef<View>(null);
  const rateItemsRef = useRef<View>(null);
  const priceFormatRef = useRef<View>(null);
  const contactRef = useRef<View>(null);

  useEffect(()=>{
    loadData();
  },[])

  // Measure element positions when tutorial is active
  useEffect(() => {
    if (currentScreen === 'rates') {
      // Small delay to ensure elements are rendered
      const measureTimeout = setTimeout(() => {
        // Measure disclaimer card
        disclaimerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('rates-disclaimer', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure category section
        categoryRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('rates-category', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure rate items
        rateItemsRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('rates-items', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure price format (using first rate item as example)
        priceFormatRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('rates-price-format', { x: pageX, y: pageY, width, height });
          }
        });

        // Measure contact section
        contactRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            setStepTarget('rates-contact', { x: pageX, y: pageY, width, height });
          }
        });
      }, 100);

      return () => clearTimeout(measureTimeout);
    }
  }, [currentScreen, setStepTarget, categories, products]);

    const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, prods] = await Promise.all([
        AuthService.getCategories(),
        AuthService.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e: any) {
      const errorMsg = e.message || 'Failed to load rates';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('paper')) return '#16a34a';
    if (lowerName.includes('plastic')) return '#16a34a';
    if (lowerName.includes('metal')) return '#16a34a';
    if (lowerName.includes('electronic')) return '#16a34a';
    if (lowerName.includes('glass')) return '#16a34a';
    return '#16a34a';
  };

  const renderCategorySection = (category: CategorySummary, isFirstCategory: boolean) => {
    const categoryProducts = products.filter((p) => p.category === category.id);
    if (categoryProducts.length === 0) return null;
    const categoryIcon = getCategoryIcon(category.name);

    return(
      <View key={category.id} style={styles.categorySection}>
        <LinearGradient
          ref={isFirstCategory ? categoryRef : null}
          colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
          style={styles.categoryHeader}
        >
          <Text style={styles.categoryTitle}>{category.name}</Text>
        </LinearGradient>

        <View style={styles.itemsGrid}>
          {categoryProducts.map((item, index) => {
            const productImage = getImageForProduct(item);
            const fallbackImage = getFallbackImageForProduct(item.name);
            const isFirstItem = isFirstCategory && index === 0;
            const isSecondItem = isFirstCategory && index === 1;
            return (
              <View 
                key={index} 
                ref={isFirstItem ? rateItemsRef : (isSecondItem ? priceFormatRef : null)}
                style={[styles.rateItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[
                  styles.itemIcon, 
                  productImage ? { 
                    backgroundColor: isDark ? colors.surface : '#ffffff',
                    borderWidth: 2,
                    borderColor: colors.border,
                    overflow: 'hidden'
                  } : { backgroundColor: getCategoryColor(category.name) }
                ]}>
                  {productImage ? (
                    <RemoteImage 
                      source={productImage} 
                      fallback={fallbackImage}
                      style={styles.itemImage}
                      showLoadingIndicator={false}
                    />
                  ) : (
                    <Text style={styles.itemEmoji}>{categoryIcon}</Text>
                  )}
                </View>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemRate, { color: colors.primary }]}>
                  ₹{item.min_rate}-{item.max_rate}
                </Text>
                <Text style={[styles.itemUnit, { color: colors.textSecondary }]}>Per {item.unit}</Text>
                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    )
  }
if (loading && categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
        colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
        style={styles.header}
      >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={fs(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scrap Rates</Text>
          <View style={styles.headerRight}>
          <TrendingUp size={fs(24)} color="white" />
        </View>
        </LinearGradient>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading rates...</Text>
        </View>
      </View>
    );
  }

if (error && categories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
        colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
        style={styles.header}
      >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={fs(24)} color="white" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Scrap Rates</Text>
          <View style={styles.headerRight}>
            <TrendingUp size={fs(24)} color="white" />
        </View>
        </LinearGradient>
        <View style={[styles.content, styles.centerContent]}>
          <AlertCircle size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>Failed to Load Rates</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return(
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={fs(24)} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scrap Rates</Text>
        <View style={styles.headerRight}>
          <TrendingUp size={fs(24)} color="white" />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
        {/* Disclaimer */}
        <View ref={disclaimerRef} style={[styles.disclaimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.disclaimerHeader}>
             <AlertCircle size={fs(20)} color={colors.primary} />
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>Important Note</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            The prices shown are for reference only. Actual rates may vary based on:
          </Text>
          <View style={styles.disclaimerList}>
            <Text style={[styles.disclaimerItem, { color: colors.textSecondary }]}>1. Current market conditions</Text>
            <Text style={[styles.disclaimerItem, { color: colors.textSecondary }]}>2. Quality and quantity of materials</Text>
            <Text style={[styles.disclaimerItem, { color: colors.textSecondary }]}>3. Location and transportation costs</Text>
            <Text style={[styles.disclaimerItem, { color: colors.textSecondary }]}>4. Seasonal demand fluctuations</Text>
          </View>
          <Text style={[styles.disclaimerFooter, { color: colors.textSecondary }]}>
            Contact us for accurate pricing based on your specific materials.
          </Text>
        </View>

        {/* Last Updated */}
        <View style={[styles.lastUpdated, { backgroundColor: colors.card }]}>
          <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>
            Last updated: {new Date().toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>

        {/* Rate Categories */}
        {categories.length > 0 ? (
          categories.map((category, index) => renderCategorySection(category, index === 0))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No rates available</Text>
          </View>
        )}

        {/* Contact Section */}
        <View ref={contactRef} style={[styles.contactSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Need Accurate Pricing?</Text>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            Get real-time quotes for your specific materials by scheduling a pickup.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/sell')}
          >
            <Text style={styles.contactButtonText}>Schedule Pickup</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
      <TutorialOverlay />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  disclaimerCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  disclaimerList: {
    marginBottom: 12,
  },
  disclaimerItem: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 4,
  },
  disclaimerFooter: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  lastUpdated: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  rateItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemEmoji: {
    fontSize: 48,
  },
  itemImage: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemRate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
    color: '#16a34a',
  },
  itemUnit: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  contactSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  contactButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
});

