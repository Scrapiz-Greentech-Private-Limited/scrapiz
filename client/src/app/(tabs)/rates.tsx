import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Linking,
} from 'react-native';
import { ArrowLeft, CircleAlert as AlertCircle, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService, CategorySummary, ProductSummary } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';
import { fs } from '../../utils/responsive';
import { RemoteImage } from '../../components/RemoteImage';
import TutorialOverlay from '@/src/components/TutorialOverlay';
import NetworkRetryOverlay from '../../components/NetworkRetryOverlay';
import { useNetworkRetry } from '../../hooks/useNetworkRetry';
import { useTutorialStore } from '@/src/store/tutorialStore';

type ScrapCategoryKey = 'paper' | 'plastic' | 'metal' | 'electronic';

type ScrapCategoryCard = {
  key: ScrapCategoryKey;
  label: string;
  image: any;
  heroImage: any;
};

type ScrapCategoryTheme = {
  title: string;
  heroImage: any;
  gradient: [string, string, string, string];
  darkGradient: [string, string, string, string];
};

const CATEGORY_GRID_BACKGROUND: [string, string, string] = ['#006D2B', '#2A8B48', '#DFF0E1'];
const CATEGORY_GRID_BACKGROUND_DARK: [string, string, string] = ['#00451B', '#006D2B', '#0E2E19'];
const CATEGORY_SURFACE_LIGHT = '#ECEFED';
const CATEGORY_SURFACE_DARK = '#0E1C13';
const DETAIL_GRADIENT: [string, string, string, string] = ['#127E2D', '#88BE96', '#C4DFCB', '#FFFFFF'];
const DETAIL_GRADIENT_DARK: [string, string, string, string] = ['#0A4719', '#246A35', '#4D8661', '#0F1812'];

const SCRAP_CATEGORY_CARDS: ScrapCategoryCard[] = [
  {
    key: 'paper',
    label: 'Paper Scrap',
    image: require('../../../assets/images/categories/paper_Scrap.png'),
    heroImage: require('../../../assets/images/sell/paper_pile_converted.webp'),
  },
  {
    key: 'plastic',
    label: 'Plastic Scrap',
    image: require('../../../assets/images/categories/plastic_Scrap.png'),
    heroImage: require('../../../assets/images/sell/plastic_bg_converted.webp'),
  },
  {
    key: 'metal',
    label: 'Metal Scrap',
    image: require('../../../assets/images/categories/metal_Scrap.png'),
    heroImage: require('../../../assets/images/sell/metal_head.png'),
  },
  {
    key: 'electronic',
    label: 'Electronic Scrap',
    image: require('../../../assets/images/categories/Electronic_scrap.png'),
    heroImage: require('../../../assets/images/sell/metal_bg_converted.webp'),
  },
];

const CATEGORY_THEMES: Record<ScrapCategoryKey, ScrapCategoryTheme> = {
  paper: {
    title: 'Paper Scrap',
    heroImage: require('../../../assets/images/sell/paper_pile_converted.webp'),
    gradient: DETAIL_GRADIENT,
    darkGradient: DETAIL_GRADIENT_DARK,
  },
  plastic: {
    title: 'Plastic Scrap',
    heroImage: require('../../../assets/images/sell/plastic_bg_converted.webp'),
    gradient: DETAIL_GRADIENT,
    darkGradient: DETAIL_GRADIENT_DARK,
  },
  metal: {
    title: 'Metal Scrap',
    heroImage: require('../../../assets/images/sell/metal_head.png'),
    gradient: DETAIL_GRADIENT,
    darkGradient: DETAIL_GRADIENT_DARK,
  },
  electronic: {
    title: 'Electronic Scrap',
    heroImage: require('../../../assets/images/sell/metal_bg_converted.webp'),
    gradient: DETAIL_GRADIENT,
    darkGradient: DETAIL_GRADIENT_DARK,
  },
};

const CONTACT_CARD_LOGO = require('../../../assets/images/sell/scrapiz_logo_card.png');
const CONTACT_CARD_STARTUP = require('../../../assets/images/sell/startup_india.png');

const getImageForProduct = (product: ProductSummary) => {
  if (product.image_url) {
    return { uri: product.image_url };
  }

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
  return require('../../../assets/images/Scrap_Rates_Photos/TV.jpg');
};

const matchesScrapCategory = (categoryName: string, categoryKey: ScrapCategoryKey): boolean => {
  const normalized = categoryName.toLowerCase();
  if (categoryKey === 'paper') return normalized.includes('paper') || normalized.includes('cardboard') || normalized.includes('book');
  if (categoryKey === 'plastic') return normalized.includes('plastic');
  if (categoryKey === 'metal') {
    return normalized.includes('metal') || normalized.includes('iron') || normalized.includes('steel') || normalized.includes('brass') || normalized.includes('copper') || normalized.includes('aluminium') || normalized.includes('aluminum');
  }
  return normalized.includes('electronic') || normalized.includes('e-waste') || normalized.includes('ewaste') || normalized.includes('appliance');
};

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { setStepTarget, currentScreen } = useTutorialStore();

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ScrapCategoryKey | null>(null);

  const categoryGridRef = useRef<View>(null);
  const productsRef = useRef<View>(null);
  const contactRef = useRef<View>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [cats, prods] = await Promise.all([
      AuthService.getCategories(),
      AuthService.getProducts(),
    ]);

    setCategories(cats);
    setProducts(prods);
    setLoading(false);
  }, []);

  const {
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
    startRetryFlow,
    resetRetryState,
    checkNetworkAndLoad,
  } = useNetworkRetry({
    fetchFn: loadData,
    countdownSeconds: 5,
    maxRetries: 3,
  });

  useEffect(() => {
    const initLoad = async () => {
      const isConnected = await checkNetworkAndLoad();
      if (!isConnected) return;

      try {
        await loadData();
      } catch (loadError: any) {
        const errorMsg = loadError.message || 'Failed to load rates';
        const isNetworkError =
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('internet') ||
          errorMsg.toLowerCase().includes('connection');

        if (isNetworkError) {
          startRetryFlow(errorMsg);
        } else {
          setError(errorMsg);
          setLoading(false);
        }
      }
    };

    initLoad();
  }, []);

  useEffect(() => {
    if (currentScreen !== 'rates') return;

    const timer = setTimeout(() => {
      categoryGridRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          setStepTarget('rates-category', { x: pageX, y: pageY, width, height });
        }
      });

      productsRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          setStepTarget('rates-items', { x: pageX, y: pageY, width, height });
          setStepTarget('rates-price-format', { x: pageX, y: pageY, width, height });
        }
      });

      contactRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          setStepTarget('rates-contact', { x: pageX, y: pageY, width, height });
          setStepTarget('rates-disclaimer', { x: pageX, y: pageY, width, height });
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentScreen, setStepTarget, selectedCategory, categories, products]);

  const onRefresh = async () => {
    setRefreshing(true);
    resetRetryState();

    try {
      await loadData();
    } catch (loadError: any) {
      const errorMsg = loadError.message || 'Failed to load rates';
      const isNetworkError =
        errorMsg.toLowerCase().includes('network') ||
        errorMsg.toLowerCase().includes('internet') ||
        errorMsg.toLowerCase().includes('connection');

      if (isNetworkError) {
        startRetryFlow(errorMsg);
      } else {
        setError(errorMsg);
      }
    }

    setRefreshing(false);
  };

  const selectedTheme = selectedCategory ? CATEGORY_THEMES[selectedCategory] : null;

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];

    const matchingCategoryIds = categories
      .filter((category) => matchesScrapCategory(category.name, selectedCategory))
      .map((category) => category.id);

    return products.filter((product) => matchingCategoryIds.includes(product.category));
  }, [categories, products, selectedCategory]);

  const openSupportMail = async () => {
    const mailUrl = 'mailto:support@scrapiz.in';
    try {
      await Linking.openURL(mailUrl);
    } catch (mailError) {
      console.log('Unable to open mail app', mailError);
    }
  };

  const renderProductCard = (product: ProductSummary, index: number) => {
    const imageSource = getImageForProduct(product);
    const fallbackImage = getFallbackImageForProduct(product.name);
    const unitLabel = (product.unit || 'unit').toUpperCase();

    return (
      <View
        key={`${product.id}-${index}`}
        ref={index === 0 ? productsRef : null}
        style={[styles.productCard, isDark && styles.productCardDark]}
      >
        <View style={styles.productImageWrap}>
          {imageSource ? (
            <RemoteImage
              source={imageSource}
              fallback={fallbackImage}
              style={styles.productImage}
              showLoadingIndicator={false}
            />
          ) : (
            <Image source={fallbackImage} style={styles.productImage} resizeMode="cover" />
          )}
        </View>

        <View style={styles.productContent}>
          <Text style={[styles.productName, isDark && styles.productNameDark]} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={[styles.productMeta, isDark && styles.productMetaDark]} numberOfLines={1}>
            {product.description || `Best rate for ${product.name.toLowerCase()}`}
          </Text>
          <View style={styles.productRateRow}>
            <Text style={[styles.productRate, isDark && styles.productRateDark]}>
              Rs {product.min_rate}-{product.max_rate}
            </Text>
            <View style={[styles.unitPill, isDark && styles.unitPillDark]}>
              <Text style={[styles.unitPillPrefix, isDark && styles.unitPillPrefixDark]}>Per</Text>
              <Text style={styles.unitPillText}>{unitLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryChooser = () => (
    <View style={[styles.categoryLanding, isDark ? styles.categoryLandingDark : styles.categoryLandingLight]}>
      <LinearGradient
        colors={isDark ? CATEGORY_GRID_BACKGROUND_DARK : CATEGORY_GRID_BACKGROUND}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.categoryTopPanel, isDark && styles.categoryTopPanelDark, { paddingTop: insets.top + 10 }]}
      >
        <View style={[styles.heroHeader, styles.categoryHeroHeader]}>
          <TouchableOpacity style={[styles.iconButton, styles.categoryBackButton]} onPress={() => router.back()}>
            <ArrowLeft size={fs(22)} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.heroHeaderTitle, styles.categoryHeroTitle]}>Types of Scraps</Text>
          <View style={[styles.iconButton, styles.categoryBackButton]}>
            <TrendingUp size={fs(18)} color="rgba(255,255,255,0.95)" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.categoryLandingBody}>
        <View ref={categoryGridRef} style={[styles.categoryGridShell, isDark && styles.categoryGridShellDark]}>
          <View style={styles.categoryGrid}>
            {SCRAP_CATEGORY_CARDS.map((card) => (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.88}
                style={[styles.categoryCard, isDark && styles.categoryCardDark]}
                onPress={() => setSelectedCategory(card.key)}
              >
                <View style={[styles.categoryCardImageWrap, isDark && styles.categoryCardImageWrapDark]}>
                  <Image source={card.image} style={styles.categoryCardImage} resizeMode="cover" />
                </View>
                <View style={styles.categoryCardLabelWrap}>
                  <Text style={[styles.categoryCardLabel, isDark && styles.categoryCardLabelDark]}>{card.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderCategoryDetail = () => {
    if (!selectedCategory || !selectedTheme) return null;

    return (
      <LinearGradient
        colors={isDark ? selectedTheme.darkGradient : selectedTheme.gradient}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.detailContainer}
      >
        <View style={[styles.heroHeader, { paddingTop: insets.top + 18 }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setSelectedCategory(null)}>
            <ArrowLeft size={fs(22)} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.heroHeaderTitle}>{selectedTheme.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#127E2D']} />
          }
        >
          <Image source={selectedTheme.heroImage} style={styles.heroImage} resizeMode="contain" />

          {(selectedCategory === 'paper' || selectedCategory === 'plastic') && (
            <View style={[styles.minimumBookingNote, isDark && styles.minimumBookingNoteDark]}>
              <AlertCircle size={18} color={isDark ? '#BBF7D0' : '#166534'} />
              <Text style={[styles.minimumBookingNoteText, isDark && styles.minimumBookingNoteTextDark]}>
                Note: A minimum order value of ₹1,000 is required during booking. You may combine any number of {selectedCategory} products.
              </Text>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Available Rates
            </Text>
          </View>

          <View style={styles.productsList}>
            {categoryProducts.length > 0 ? (
              categoryProducts.map(renderProductCard)
            ) : (
              <View ref={productsRef} style={[styles.emptyStateCard, isDark && styles.emptyStateCardDark]}>
                <Text style={[styles.emptyStateTitle, isDark && styles.emptyStateTitleDark]}>
                  No products available right now
                </Text>
                <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
                  Pull to refresh or check back later for updated rates.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            ref={contactRef}
            activeOpacity={0.9}
            onPress={openSupportMail}
            style={[styles.contactBannerButton, isDark && styles.contactBannerButtonDark]}
          >
            <View style={[styles.contactCardTop, isDark && styles.contactCardTopDark]}>
              <View style={styles.contactCircleLeft} />
              <View style={styles.contactCircleRight} />
              <Image source={CONTACT_CARD_LOGO} style={styles.contactLogo} resizeMode="contain" />
              <Text style={styles.contactTitle}>Need help?</Text>
              <View style={[styles.contactActionButton, isDark && styles.contactActionButtonDark]}>
                <Text style={styles.contactActionText}>Contact Us</Text>
              </View>
              <Image source={CONTACT_CARD_STARTUP} style={styles.contactStartupImage} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#127E2D" />
        <Text style={styles.stateText}>Loading rates...</Text>
      </View>
    );
  }

  if (error && categories.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <StatusBar barStyle="light-content" />
        <AlertCircle size={56} color="#dc2626" />
        <Text style={styles.errorTitle}>Failed to load rates</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {selectedCategory ? renderCategoryDetail() : renderCategoryChooser()}

      <NetworkRetryOverlay
        visible={showRetryOverlay}
        countdown={countdown}
        isRetrying={isRetrying}
        hasFailedPermanently={hasFailedPermanently}
        errorMessage={errorMessage || undefined}
        onRetryNow={retryNow}
      />

      <TutorialOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#f6fbf7',
  },
  stateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#356644',
    fontFamily: 'Inter-Medium',
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 20,
    color: '#19311f',
    fontFamily: 'Inter-Bold',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    color: '#5d6e62',
    fontFamily: 'Inter-Regular',
  },
  retryButton: {
    backgroundColor: '#127E2D',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  categoryLanding: {
    flex: 1,
  },
  categoryLandingLight: {
    backgroundColor: CATEGORY_SURFACE_LIGHT,
  },
  categoryLandingDark: {
    backgroundColor: CATEGORY_SURFACE_DARK,
  },
  categoryTopPanel: {
    minHeight: 124,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(66,138,210,0.55)',
  },
  categoryTopPanelDark: {
    borderBottomColor: 'rgba(88,140,108,0.5)',
  },
  categoryLandingBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 18,
    paddingTop: 22,
  },
  heroHeader: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryHeroHeader: {
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  heroHeaderTitle: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
  categoryHeroTitle: {
    fontSize: 36,
    lineHeight: 40,
  },
  categoryGridShell: {
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  categoryGridShellDark: {
    backgroundColor: 'transparent',
  },
  categoryGridTitle: {
    fontSize: 18,
    color: '#0A5722',
    fontFamily: 'Inter-Bold',
  },
  categoryGridTitleDark: {
    color: '#EAF7EE',
  },
  categoryGridSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    color: '#53715e',
    fontFamily: 'Inter-Regular',
  },
  categoryGridSubtitleDark: {
    color: '#A9C4B2',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48.6%',
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#F4F6F4',
    borderWidth: 0,
    overflow: 'hidden',
  },
  categoryCardDark: {
    backgroundColor: '#1A2F20',
  },
  categoryCardImageWrap: {
    width: '100%',
    height: 142,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#CFD5D0',
  },
  categoryCardImageWrapDark: {
    backgroundColor: '#2C3E33',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.06 }],
  },
  categoryCardLabelWrap: {
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  categoryCardLabel: {
    textAlign: 'center',
    color: '#1A1A1A',
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
  },
  categoryCardLabelDark: {
    color: '#EDF6EF',
  },
  detailContainer: {
    flex: 1,
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: 18,
    paddingBottom: 38,
  },
  heroImage: {
    width: '100%',
    height: 236,
    marginTop: 6,
    marginBottom: 16,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  minimumBookingNote: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  minimumBookingNoteDark: { backgroundColor: '#123D24', borderColor: '#276749' },
  minimumBookingNoteText: { flex: 1, color: '#166534', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  minimumBookingNoteTextDark: { color: '#BBF7D0' },
  sectionTitle: {
    fontSize: 22,
    color: '#0D3917',
    fontFamily: 'Inter-Bold',
  },
  sectionTitleDark: {
    color: '#EFF8F0',
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    minHeight: 122,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE4',
    shadowColor: '#2A8B48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  productCardDark: {
    backgroundColor: 'rgba(20,34,23,0.92)',
    borderColor: 'rgba(154,197,166,0.18)',
  },
  productImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F4F8F4',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 17,
    color: '#173420',
    fontFamily: 'Inter-Bold',
  },
  productNameDark: {
    color: '#F4FBF4',
  },
  productMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#64806D',
    fontFamily: 'Inter-Regular',
  },
  productMetaDark: {
    color: '#B4C8B8',
  },
  productRateRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productRate: {
    color: '#127E2D',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  productRateDark: {
    color: '#57D37B',
  },
  unitPill: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E9F7EE',
    borderWidth: 1,
    borderColor: '#BEE3C9',
    alignItems: 'center',
  },
  unitPillDark: {
    backgroundColor: '#1A4728',
    borderColor: '#2F7A45',
  },
  unitPillPrefix: {
    color: '#3A6E4A',
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Inter-Medium',
  },
  unitPillPrefixDark: {
    color: '#B7DCC2',
  },
  unitPillText: {
    color: '#0F7A2B',
    fontSize: 12,
    lineHeight: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  emptyStateCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  emptyStateCardDark: {
    backgroundColor: 'rgba(20,34,23,0.92)',
  },
  emptyStateTitle: {
    color: '#173420',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  emptyStateTitleDark: {
    color: '#EFF8F0',
  },
  emptyStateText: {
    marginTop: 6,
    color: '#64806D',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  emptyStateTextDark: {
    color: '#B4C8B8',
  },
  contactBannerButton: {
    marginTop: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0E5621',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
    backgroundColor: '#0E8A30',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  contactBannerButtonDark: {
    backgroundColor: '#0D6A2A',
    borderColor: 'rgba(128,168,139,0.28)',
  },
  contactCardTop: {
    height: 184,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D8B2C',
    position: 'relative',
  },
  contactCardTopDark: {
    backgroundColor: '#117533',
  },
  contactCircleLeft: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: 'rgba(180,248,203,0.55)',
    left: -72,
    top: -46,
  },
  contactCircleRight: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: 'rgba(19,112,53,0.8)',
    right: -58,
    bottom: -44,
  },
  contactLogo: {
    width: 122,
    height: 42,
    position: 'absolute',
    left: 20,
    top: 14,
  },
  contactTitle: {
    color: '#F4FFF6',
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  contactActionButton: {
    minWidth: 176,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#20C14D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#0A4E1E',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.34,
    shadowRadius: 10,
    elevation: 6,
  },
  contactActionButtonDark: {
    backgroundColor: '#27B24D',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  contactActionText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 21,
    fontFamily: 'Inter-Bold',
  },
  contactStartupImage: {
    width: 126,
    height: 38,
    position: 'absolute',
    right: 18,
    bottom: 10,
    zIndex: 2,
  },
});
