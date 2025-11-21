import React, { useState, useMemo, useEffect , useRef} from 'react';
import { View, Text,StyleSheet,ScrollView,TouchableOpacity,Dimensions,Image,Platform,ActivityIndicator,RefreshControl,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  User,
  FileText,
} from 'lucide-react-native';
//Components
import CustomCarousel from '../../components/Carousel';
import LocationSelector from '@/src/components/LocationSelector';
import SearchBar from '@/src/components/SearchBar';
//Hooks
import { useHomeData } from '../../hooks/useHomeData';
import { useScrapCategories } from '../../hooks/useScrapCategories';
import { useRecentActivity } from '../../hooks/useRecentActivity';
import { useLocalization } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useEnvironmentalImpact } from '../../hooks/useImpact';
import { wp, hp, fs } from '../../utils/responsive';

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


const serviceGradients = {
  demolition: ['#16a34a', '#15803d'] as const,
  dismantling: ['#16a34a', '#15803d'] as const,
  'paper-shredding': ['#16a34a', '#15803d'] as const,
  'society-tieup': ['#15803d', '#166534'] as const,
  'junk-removal': ['#16a34a', '#15803d'] as const,
} as const;

// Add this helper component
const ServiceIcon = ({ iconName, color }: { iconName: string, color: string }) => {
  const iconProps = { size: 22, color: color };

  switch (iconName) {
    case 'Hammer':
      return <Hammer {...iconProps} />;
    case 'Wrench':
      return <Wrench {...iconProps} />;
    case 'FileText':
      return <FileText {...iconProps} />;
    case 'Building':
      return <Building {...iconProps} />;
    case 'Trash2':
      return <Trash2 {...iconProps} />;
    default:
      return null;
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, products, categories, orders, loading, error, refetch } = useHomeData();
  const scrapCategories = useScrapCategories(products || [], categories || []);
  const { treesSaved, co2Reduced } = useEnvironmentalImpact(orders || []);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const adScrollRef = useRef<ScrollView | null>(null);
  const [adIndex, setAdIndex] = useState(0);

const services = useMemo(() => [
  { 
    id: 'demolition', 
    title: t('home.demolitionService'), 
    description: t('home.demolitionDescription'), 
    icon: 'Hammer', // <-- Change this to a string
    color: '#16a34a',
  },
  { 
    id: 'dismantling', 
    title: t('home.dismantling'),
    description: t('home.dismantlingDescription'), 
    icon: 'Wrench', // <-- Change this to a string
    color: '#16a34a',
  },
  { 
    id: 'paper-shredding', 
    title: t('home.paperShredding'),
    description: t('home.paperShreddingDescription'), 
    icon: 'FileText', // <-- Change this to a string
    color: '#16a34a',
  },
  { 
    id: 'society-tieup', 
    title: t('home.societyTieup'),
    description: t('home.societyTieupDescription'), 
    icon: 'Building', // <-- Change this to a string
    color: '#16a34a',
  },
  { 
    id: 'junk-removal', 
    title: t('home.junkRemoval'),
    description: t('home.junkRemovalDescription'), 
    icon: 'Trash2', // <-- Change this to a string
    color: '#16a34a', // <-- Also fix the white color here
  },
], [t]);

  const tips = useMemo(() => [
    t('home.tip1'),
    t('home.tip2'),
    t('home.tip3'),
    t('home.tip4'),
    t('home.tip5'),
  ], [t]);
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  // Get user initials for fallback
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if(error){
      Toast.show({
        type: 'error',
        text1: t('home.error'),
        text2: error,
      });
    }
  }, [error]);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const handleNavigate = (path: string) => {
    router.push(path as any);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#16a34a']} 
          />
        }
      >
        {/* Combined Header Section with Green Background */}
        <LinearGradient 
          colors={isDark ? ['#22c55e', '#16a34a', '#15803d'] : ['#16a34a', '#15803d', '#166534']} 
          style={styles.headerSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
v          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
          
          {/* Top Row: Location & Profile */}
          <View style={styles.topRow}>
            {/* Location Selector */}
            <View style={styles.locationContainer}>
              <LocationSelector />
            </View>

            {/* Right Side: Profile */}
            <View style={styles.rightContainer}>
              {/* Coins Badge - Hidden for future use */}
              {/* <TouchableOpacity 
                style={styles.coinsContainer}
                activeOpacity={0.7}
                onPress={() => router.push('/profile/rewards-wallet' as any)}
              >
                <View style={styles.coinsIconWrapper}>
                  <Coins size={16} color="#f59e0b" strokeWidth={2.8} />
                </View>
                <Text style={styles.coinsText}>120</Text>
              </TouchableOpacity> */}

              {/* Profile Icon */}
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.7}
              >
                {user?.profile_image && !imageError ? (
                  <Image
                    source={{ uri: user.profile_image }}
                    className='w-full h-full'
                    onError={() => setImageError(true)}
                  />
                ) : user?.name ? (
                  <View className='w-full h-full justify-center items-center bg-green-100'>
                    <Text className='text-sm font-bold text-green-700'>
                      {getInitials(user.name)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.profileIconWrapper}>
                  <User size={fs(20)} color={isDark ? '#6ee7b7' : '#16a34a'} strokeWidth={2.8} />
                </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <SearchBar />
          </View>
        </LinearGradient>

        <CustomCarousel />

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.sectionBadgeText, { color: 'white' }]}>{t('home.popular')}</Text>
            </View>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate('/(tabs)/sell')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.actionCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.actionIcon, { backgroundColor: 'white' }]}>
                  <PackagePlus size={22} color="#16a34a" strokeWidth={2.5} />
                </View>
                <Text style={[styles.actionTitle, { color: 'white' }]}>{t('home.sellScrap')}</Text>
                <Text style={[styles.actionSubtitle, { color: '#d1fae5' }]}>{t('home.schedulePickup')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate('/(tabs)/rates')}
              activeOpacity={0.8}
            >
              <LinearGradient
              colors={['#16a34a', '#15803d']}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
                <View style={[styles.actionIcon, { backgroundColor: 'white' }]}>
                  <AreaChart size={22} color="#16a34a" strokeWidth={2.5} />
                </View>
                <Text style={[styles.actionTitle, { color: 'white' }]}>{t('home.viewRates')}</Text>
                <Text style={[styles.actionSubtitle, { color: 'white' }]}>{t('home.todaysPrices')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Rates - Backend Data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.todaysMarketRates')}</Text>
            <TouchableOpacity onPress={() => handleNavigate('/(tabs)/rates')}>
             <TrendingUp size={fs(16)} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ratesScrollContent}
            style={styles.ratesScrollView}
          >
            {scrapCategories.length > 0 ? (
              scrapCategories.slice(0, 4).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                  styles.rateCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                index === homeRateItems.length - 1 && { marginRight: 0 }
              ]}
                  onPress={() => handleNavigate('/(tabs)/rates')}
                >
                  <Image source={category.icon} style={styles.itemImage} />
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryRate, { color: category.color }]}>
                    {category.rate}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View className='flex-1 items-center justify-center py-10'>
                <Text className='text-sm text-gray-400'>{t('home.noRatesAvailable')}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Tip of the Day */}
        <View style={styles.section}>
          <LinearGradient
          colors={isDark ? ['#065f46', '#047857'] : ['#ecfdf5', '#d1fae5']}
          style={styles.tipCard}
        >
            <View style={styles.tipIconContainer}>
               <Lightbulb size={fs(24)} color={isDark ? '#6ee7b7' : '#059669'} strokeWidth={2.5} />
            </View>
            <View style={styles.tipTextContainer}>
              <Text style={[styles.tipTitle, { color: isDark ? '#f0fdf4' : '#064e3b' }]}>{t('home.tipOfTheDay')}</Text>
              <Text style={[styles.tipText, { color: isDark ? '#d1fae5' : '#065f46' }]}>{randomTip}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.services')}</Text>
            <TouchableOpacity onPress={() => handleNavigate('/(tabs)/services')}>
              <Text style={[styles.moreServicesText, { color: colors.primary }]}>{t('home.moreServices')}</Text>
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
                    <ServiceIcon iconName={service.icon} color={service.color} />
                  </View>
                  <View className='flex-1'>
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
          activeOpacity={0.8}
        >
            <LinearGradient
            colors={isDark ? ['#78350f', '#92400e'] : ['#fef3c7', '#fde68a']}
            style={styles.referCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
               <View style={styles.referIconContainer}>
                <Gift size={fs(28)} color={isDark ? '#fbbf24' : '#f59e0b'} strokeWidth={2.5} />
              </View>
              <View style={styles.referTextContainer}>
                <Text style={[styles.referTitle, { color: isDark ? '#fef3c7' : '#78350f' }]}>{t('home.referAndEarn')}</Text>
                <Text style={[styles.referSubtitle, { color: isDark ? '#fde68a' : '#92400e' }]}>
                  {t('home.referSubtitle')}
                </Text>
              </View>
               <ChevronRight size={fs(20)} color={isDark ? '#fbbf24' : '#f59e0b'} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Environmental Impact - Backend Data */}
        {(treesSaved > 0 || co2Reduced > 0) && (
          <View style={[styles.section, styles.impactSection]}>
            <View style={styles.sectionHeaderRow}>
               <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.yourImpact')}</Text>
            </View>
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              style={styles.impactCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
        >
               <View style={styles.impactIconContainer}>
                <Text style={styles.impactEmoji}>🌱</Text>
              </View>
              <View style={styles.impactTextContainer}>
                <Text style={styles.impactText}>
                  You've helped save{' '}
                 <Text style={styles.impactHighlight}>{treesSaved} trees</Text> and reduced{' '}
                   <Text style={styles.impactHighlight}>{co2Reduced}kg CO₂</Text> emissions this year!
                </Text>
                <View style={styles.impactStats}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>🌳 +{treesSaved}</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>♻️ {co2Reduced}kg</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Branding Section */}
        <View style={styles.brandingSection}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            style={styles.brandingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative Elements */}
            <View style={styles.brandingCircle1} />
            <View style={styles.brandingCircle2} />
            
            <View style={styles.brandingContent}>
            <View style={styles.brandingBadge}>
              <Text style={styles.brandingBadgeText}>🇮🇳 INDIA'S #1</Text>
            </View>
            
            <Text style={styles.brandingTagline}>Online Scrap</Text>
            <Text style={styles.brandingTagline}>Selling Platform</Text>
            
            <View style={styles.brandingDivider} />
            
            <View style={styles.brandingLogoContainer}>
              <Image 
                source={require('../../../assets/images/LogoWithoutS.png')}
                style={styles.brandingLogoImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>
          </View>
          </LinearGradient>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  // New consolidated header section
  headerSection: {
    paddingTop: hp(6.8), // 55
    paddingHorizontal: wp(4.8), // 18
    paddingBottom: hp(2.7), // 22
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: wp(58.7), // 220
    height: wp(58.7), // 220
    borderRadius: wp(29.3), // 110
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: hp(-7.4), // -60
    right: wp(-16), // -60
    opacity: 0.6,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: wp(42.7), // 160
    height: wp(42.7), // 160
    borderRadius: wp(21.3), // 80
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: hp(-4.9), // -40
    left: wp(-10.7), // -40
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: wp(26.7), // 100
    height: wp(26.7), // 100
    borderRadius: wp(13.3), // 50
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: hp(4.9), // 40
    left: wp(26.7), // 100
    opacity: 0.4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.7), // 14
  },
  locationContainer: {
    // Don't let location take the full row; allow it to shrink
    flexGrow: 0,
    flexShrink: 1,
    marginRight: wp(4.3), // 16
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.7), // 10
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingLeft: wp(1.3), // Reduced from 1.6
    paddingRight: wp(2.7), // Reduced from 3.2
    paddingVertical: hp(0.6), // Reduced from 0.7
    borderRadius: 20,
    gap: wp(1.3), // Reduced from 1.6
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  coinsIconWrapper: {
    width: wp(6), // Reduced from 6.9
    height: wp(6), // Reduced from 6.9
    backgroundColor: '#fef3c7',
    borderRadius: wp(3), // Reduced from 3.5
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsText: {
    fontSize: fs(13), // Reduced from 14
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: -0.3,
  },
  profileButton: {
    backgroundColor: 'white',
    width: wp(10), // Reduced from 11.7
    height: wp(10), // Reduced from 11.7
    borderRadius: wp(5), // Reduced from 5.9
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.15)',
    marginLeft: wp(1.1), // 4
  },
  profileIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    marginBottom: hp(1), // 8
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4.3), // 16
    paddingVertical: hp(2), // 16
    gap: wp(2.7), // 10
    marginTop: hp(-1.2), // -10
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: wp(2.7), // Reduced from 3.2
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconContainer: {
    width: wp(8), // Reduced from 9.6
    height: wp(8), // Reduced from 9.6
    backgroundColor: '#f0fdf4',
    borderRadius: wp(4), // Reduced from 4.8
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.6), // Reduced from 0.7
  },
  statValue: {
    fontSize: fs(15), // Reduced from 16
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: hp(0.2), // 2
  },
  statLabel: {
    fontSize: fs(9), // Reduced from 10
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  searchSection: {
    paddingHorizontal: wp(5.3), // 20
    paddingVertical: hp(2), // 16
    backgroundColor: 'white',
  },
  header: {
    paddingTop: hp(7.4), // 60
    paddingHorizontal: wp(5.3), // 20
    paddingBottom: hp(3), // 24
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  section: {
    paddingHorizontal: wp(5.3), // 20
    paddingVertical: hp(1.5), // 12
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.7), // 14
    gap: wp(2.1), // 8
  },
  sectionBadge: {
    paddingHorizontal: wp(2.1), // 8
    paddingVertical: hp(0.4), // 3
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: fs(10), // 10
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2), // 16
  },
  sectionTitle: {
    fontSize: fs(17), // Reduced from 18
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  ratesScrollView: {
    paddingBottom: hp(1), // 8px bottom spacing - reduced
  },
  ratesScrollContent: {
    paddingHorizontal: wp(5.3), // 20
  },
  rateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: wp(3.5), // Reduced from 4.3
    marginRight: wp(3.2), // 12 spacing between cards
    width: wp(28), // Reduced from 32
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: wp(11), // Reduced from 12.8
    height: wp(11), // Reduced from 12.8
    marginBottom: hp(1), // Reduced from 1.2
    borderRadius: wp(5.5), // Reduced from 6.4
    backgroundColor: '#f3f4f6',
  },
  categoryName: {
    fontSize: fs(11), // Reduced from 12
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: hp(0.4), // Reduced from 0.5
  },
  categoryRate: {
    fontSize: fs(15), // Reduced from 16
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: wp(3.2), // 12
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionCardGradient: {
    padding: wp(4), // Reduced from 4.8
    alignItems: 'center',
    minHeight: hp(15), // Reduced from 17.2
    justifyContent: 'center',
  },
  actionIcon: {
    width: wp(10), // Reduced from 11.7
    height: wp(10), // Reduced from 11.7
    borderRadius: wp(5), // Reduced from 5.9
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1), // Reduced from 1.2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: fs(14), // Reduced from 15
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: hp(0.3), // Reduced from 0.4
  },
  actionSubtitle: {
    fontSize: fs(10), // Reduced from 11
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
  moreServicesText: {
    fontSize: fs(14), // 14
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  viewAllText: {
    fontSize: fs(14), // 14
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  servicesList: {
    gap: wp(3.2), // 12
  },
  serviceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: wp(3.5), // Reduced from 4
  },
  serviceIconContainer: {
    width: wp(11), // Reduced from 12.8
    height: wp(11), // Reduced from 12.8
    borderRadius: wp(5.5), // Reduced from 6.4
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2.7), // Reduced from 3.2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceInfo: {
    flex: 1,
    marginRight: wp(2.7), // 10
  },
  serviceTitle: {
    fontSize: fs(15), // Reduced from 16
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: hp(0.3), // 2
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: fs(12), // Reduced from 13
    fontFamily: 'Inter-Regular',
    opacity: 0.95,
    lineHeight: fs(16), // Reduced from 18
  },
  impactSection: {
    marginTop: hp(1), // 8
    marginBottom: hp(0.5), // Reduced from 1.2 to decrease gap with branding
  },
  impactCard: {
    borderRadius: 20,
    padding: wp(6.4), // 24
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  impactIconContainer: {
    width: wp(16), // 60
    height: wp(16), // 60
    borderRadius: wp(8), // 30
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4.3), // 16
  },
  impactEmoji: {
    fontSize: fs(32), // 32
  },
  impactTextContainer: {
    flex: 1,
  },
  impactText: {
    fontSize: fs(15), // 15
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: hp(2.7), // 22
    marginBottom: hp(1.5), // 12
  },
  impactHighlight: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: fs(16), // 16
  },
  impactStats: {
    flexDirection: 'row',
    gap: wp(2.7), // 10
    marginTop: hp(0.5), // 4
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: wp(3.2), // 12
    paddingVertical: hp(0.7), // 6
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statBadgeText: {
    fontSize: fs(12), // 12
    fontWeight: '700',
    color: '#ffffff',
  },
  referCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  referCardGradient: {
    borderRadius: 20,
    padding: wp(4.8), // 18
    flexDirection: 'row',
    alignItems: 'center',
  },
  referIconContainer: {
    width: wp(12.8), // 48
    height: wp(12.8), // 48
    backgroundColor: 'white',
    borderRadius: wp(6.4), // 24
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  referTextContainer: {
    flex: 1,
    marginHorizontal: wp(3.7), // 14
  },
  referTitle: {
    fontSize: fs(15), // 15
    fontWeight: '700',
    color: '#92400e',
    fontFamily: 'Inter-Bold',
    marginBottom: hp(0.4), // 3
  },
  referSubtitle: {
    fontSize: fs(12), // 12
    color: '#b45309',
    fontFamily: 'Inter-Medium',
  },
  tipCard: {
    borderRadius: 16,
    padding: wp(5.3), // 20
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.2), // Reduced from 0.6 to decrease gap
  },
  tipIconContainer: {
    width: wp(14.9), // 56
    height: wp(14.9), // 56
    backgroundColor: '#ffffff',
    borderRadius: wp(7.5), // 28
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tipTextContainer: {
    flex: 1,
    marginLeft: wp(4.3), // 16
  },
  tipTitle: {
    fontSize: fs(14), // 14
    fontWeight: '600',
    color: '#047857',
    fontFamily: 'Inter-SemiBold',
    marginBottom: hp(0.5), // 4
  },
  tipText: {
    fontSize: fs(13), // 13
    color: '#065f46',
    fontFamily: 'Inter-Regular',
    lineHeight: hp(2.2), // 18
  },
  // Branding Section
    brandingSection: {
      marginTop: 0,
      marginBottom: wp(5.3), // 20
      marginHorizontal: wp(5.3), // 20
      overflow: 'hidden',
      borderRadius: 24,
    },
    brandingGradient: {
      paddingVertical: hp(4.9), // 40
      paddingHorizontal: wp(6.4), // 24
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
    },
    brandingCircle1: {
      position: 'absolute',
      width: wp(80), // 300
      height: wp(80), // 300
      borderRadius: wp(40), // 150
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      top: hp(-12.3), // -100
      right: wp(-21.3), // -80
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.15)',
    },
    brandingCircle2: {
      position: 'absolute',
      width: wp(66.7), // 250
      height: wp(66.7), // 250
      borderRadius: wp(33.3), // 125
      backgroundColor: 'rgba(59, 130, 246, 0.06)',
      bottom: hp(-9.8), // -80
      left: wp(-16), // -60
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.12)',
    },
    brandingContent: {
      position: 'relative',
      zIndex: 1,
    },
    brandingBadge: {
      backgroundColor: 'rgba(22, 163, 74, 0.15)',
      paddingHorizontal: wp(3.7), // 14
      paddingVertical: hp(0.7), // 6
      borderRadius: 18,
      alignSelf: 'flex-start',
      marginBottom: hp(2.2), // 18
      borderWidth: 1,
      borderColor: 'rgba(22, 163, 74, 0.3)',
    },
    brandingBadgeText: {
      fontSize: fs(11), // 11
      fontWeight: '800',
      color: '#16a34a',
      letterSpacing: 1.2,
    },
    brandingTagline: {
      fontSize: fs(32), // 32
      fontWeight: '900',
      color: '#ffffff',
      textAlign: 'left',
      letterSpacing: -1,
      lineHeight: hp(4.9), // 40
    },
    brandingDivider: {
      width: wp(18.7), // 70
      height: 3,
      backgroundColor: '#16a34a',
      borderRadius: 2,
      marginVertical: hp(2.2), // 18
      alignSelf: 'flex-start', // Align divider to the left
    },
    brandingLogoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: hp(1.2), // 10
    backgroundColor: 'transparent',
  },
  brandingLogoImage: {
    width: wp(55), // Reduced from 75 to make it smaller
    height: hp(8), // Reduced from 11 to make it smaller
    marginLeft: wp(-2), // Move more to the left
    ...(Platform.OS === 'ios' && {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    }),
  },
  brandingSubtext: {
    fontSize: fs(15), // 15
    color: '#94a3b8',
    fontWeight: '600',
  },
  brandingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: wp(5.3), // 20
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandingStat: {
    flex: 1,
    alignItems: 'center',
  },
  brandingStatNumber: {
    fontSize: fs(24), // 24
    fontWeight: '800',
    color: '#10b981',
    marginBottom: hp(0.5), // 4
  },
  brandingStatLabel: {
    fontSize: fs(11), // 11
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  brandingStatDivider: {
    width: 1,
    height: hp(4.9), // 40
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: wp(3.2), // 12
  },
});
