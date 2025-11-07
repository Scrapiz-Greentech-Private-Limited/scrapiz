import React, { useState, useMemo, useEffect , useRef} from 'react';
import { View, Text,StyleSheet,ScrollView,TouchableOpacity,Dimensions,Image,Platform,ActivityIndicator,RefreshControl,} from 'react-native';
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
  
  const { user, products, categories, orders, loading, error, refetch } = useHomeData();
  const scrapCategories = useScrapCategories(products || [], categories || []);
  const { treesSaved, co2Reduced } = useEnvironmentalImpact(orders || []);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
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
    <View className='flex-1 bg-slate-100'>
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
          colors={['#16a34a', '#15803d', '#166534']} 
          className='pt-[55px] px-[18px] pb-[22px] rounded-b-3xl overflow-hidden relative'
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View className='absolute w-[220px] h-[220px] rounded-[110px] bg-white/10 -top-[60px] -right-[60px] opacity-60' />
          <View className='absolute w-[160px] h-[160px] rounded-[80px] bg-white/[.08] -bottom-[40px] -left-[40px] opacity-50' />
          <View className='absolute w-[100px] h-[100px] rounded-[50px] bg-white/[.06] top-10 left-[100px] opacity-40' />
          
          {/* Top Row: Location & Profile */}
          <View className='flex-row justify-between items-center mb-[14px]'>
            {/* Location Selector */}
            <View className='flex-grow-0 flex-shrink mr-4'>
              <LocationSelector />
            </View>

            {/* Right Side: Profile */}
            <View className='flex-row items-center gap-2.5'>
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
                className='bg-white w-11 h-11 rounded-full justify-center items-center shadow-lg shadow-green-600/25 border-2 border-green-600/15 ml-1 overflow-hidden'
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
                  <View className='w-full h-full justify-center items-center'>
                    <User size={20} color="#16a34a" strokeWidth={2.8} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className='mb-2'>
            <SearchBar />
          </View>
        </LinearGradient>

        <CustomCarousel />

        {/* Quick Actions */}
        <View className='px-5 py-3'>
          <View className='flex-row items-center mb-[14px] gap-2'>
            <Text className='text-lg font-bold text-gray-900 font-inter-bold tracking-[-0.3px]'>{t('home.quickActions')}</Text>
            <View className='bg-amber-100 px-2 py-0.5 rounded-lg'>
              <Text className='text-[10px] font-bold text-amber-500 uppercase tracking-[0.5px]'>{t('home.popular')}</Text>
            </View>
          </View>
          <View className='flex-row gap-3'>
            <TouchableOpacity
              className='flex-1 rounded-2xl overflow-hidden shadow-lg shadow-black/15'
              onPress={() => handleNavigate('/(tabs)/sell')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                className='p-[18px] items-center min-h-[140px] justify-center'
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
              className='flex-1 rounded-2xl overflow-hidden shadow-lg shadow-black/15'
              onPress={() => handleNavigate('/(tabs)/rates')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                className='p-[18px] items-center min-h-[140px] justify-center'
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
        <View className='px-5 py-3'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-lg font-bold text-gray-900 font-inter-bold tracking-[-0.3px]'>{t('home.todaysMarketRates')}</Text>
            <TouchableOpacity onPress={() => handleNavigate('/(tabs)/rates')}>
              <TrendingUp size={16} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='-mx-2'
          >
            {scrapCategories.length > 0 ? (
              scrapCategories.slice(0, 4).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className='bg-white rounded-2xl p-4 mx-2 min-w-[120px] items-center shadow-sm shadow-black/10'
                  onPress={() => handleNavigate('/(tabs)/rates')}
                >
                  <Image source={category.icon} className='w-12 h-12 mb-2.5 rounded-full' />
                  <Text className='text-xs text-gray-500 font-inter-medium text-center mb-1'>{category.name}</Text>
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
        <View className='px-5 py-3'>
          <LinearGradient
            colors={['#ecfdf5', '#d1fae5']}
            className='rounded-2xl p-5 flex-row items-center'
          >
            <View className='w-14 h-14 bg-white rounded-full justify-center items-center shadow-md shadow-emerald-700/15'>
              <Lightbulb size={24} color="#059669" />
            </View>
            <View className='flex-1 ml-4'>
              <Text className='text-sm font-semibold text-emerald-700 font-inter-semibold mb-1'>{t('home.tipOfTheDay')}</Text>
              <Text className='text-[13px] text-emerald-800 font-inter-regular leading-[18px]'>{randomTip}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Services */}
        <View className='px-5 py-3'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-lg font-bold text-gray-900 font-inter-bold tracking-[-0.3px]'>{t('home.services')}</Text>
            <TouchableOpacity onPress={() => handleNavigate('/(tabs)/services')}>
              <Text className='text-sm text-green-600 font-inter-semibold'>{t('home.moreServices')}</Text>
            </TouchableOpacity>
          </View>
          <View className='gap-3'>
            {services.map((service) => (
              <LinearGradient
                key={service.id}
                colors={serviceGradients[service.id as keyof typeof serviceGradients]}
                className='rounded-2xl p-3 flex-row items-center shadow-sm shadow-black/10'
              >
                <TouchableOpacity
                  className='flex-row items-center flex-1'
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
        <View className='px-5 py-3'>
          <TouchableOpacity 
            className='rounded-[20px] overflow-hidden shadow-lg shadow-amber-500/20'
            onPress={() => handleNavigate('/profile/refer-friends')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              className='rounded-[20px] p-[18px] flex-row items-center'
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className='w-12 h-12 bg-white rounded-full justify-center items-center shadow-md shadow-amber-500/20'>
                <Gift size={28} color="#f59e0b" strokeWidth={2.5} />
              </View>
              <View className='flex-1 mx-[14px]'>
                <Text className='text-[15px] font-bold text-amber-800 font-inter-bold mb-0.5'>{t('home.referAndEarn')}</Text>
                <Text className='text-xs text-amber-700 font-inter-medium'>
                  {t('home.referSubtitle')}
                </Text>
              </View>
              <ChevronRight size={20} color="#f59e0b" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Environmental Impact - Backend Data */}
        {(treesSaved > 0 || co2Reduced > 0) && (
          <View style={[styles.section, styles.impactSection]}>
            <View className='flex-row items-center mb-[14px] gap-2'>
              <Text className='text-lg font-bold text-gray-900 font-inter-bold tracking-[-0.3px]'>{t('home.yourImpact')}</Text>
            </View>
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              className='rounded-[20px] p-6 flex-row items-start shadow-xl shadow-emerald-500/25'
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className='w-15 h-15 rounded-full bg-white justify-center items-center mr-4'>
                <Text className='text-[32px]'>🌱</Text>
              </View>
              <View className='flex-1'>
                <Text className='text-[15px] text-white font-semibold leading-[22px] mb-3'>
                  You've helped save{' '}
                  <Text className='font-extrabold text-white text-base'>{treesSaved} trees</Text> and reduced{' '}
                  <Text className='font-extrabold text-white text-base'>{co2Reduced}kg CO₂</Text> emissions this year!
                </Text>
                <View className='flex-row gap-2.5 mt-1'>
                  <View className='bg-white/25 px-3 py-1.5 rounded-xl border border-white/30'>
                    <Text className='text-xs font-bold text-white'>🌳 +{treesSaved}</Text>
                  </View>
                  <View className='bg-white/25 px-3 py-1.5 rounded-xl border border-white/30'>
                    <Text className='text-xs font-bold text-white'>♻️ {co2Reduced}kg</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Branding Section */}
        <View className='mt-0 mb-5 mx-5 overflow-hidden rounded-3xl'>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            className='py-10 px-6 relative overflow-hidden rounded-3xl'
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative Elements */}
            <View className='absolute w-[300px] h-[300px] rounded-[150px] bg-emerald-500/[.08] -top-[100px] -right-[80px] border border-emerald-500/15' />
            <View className='absolute w-[250px] h-[250px] rounded-[125px] bg-blue-500/[.06] -bottom-[80px] -left-[60px] border border-blue-500/[.12]' />
            
            <View className='relative z-10'>
              <View className='bg-green-600/15 px-[14px] py-1.5 rounded-full self-start mb-[18px] border border-green-600/30'>
                <Text className='text-[11px] font-extrabold text-green-600 tracking-[1.2px]'>{t('home.indiaNumber1')}</Text>
              </View>
              
              <Text className='text-[32px] font-black text-white text-left tracking-[-1px] leading-10'>{t('home.onlineScrapPlatform')}</Text>
              <Text className='text-[32px] font-black text-white text-left tracking-[-1px] leading-10'>{t('home.selling')}</Text>
              
              <View className='w-[70px] h-[3px] bg-green-600 rounded-full my-[18px]' />
              
              <View className='flex-row items-start justify-start mb-2.5 bg-transparent'>
                <Image 
                  source={require('../../../assets/images/LogowithoutS.png')}
                  className='w-[220px] h-[68px] -ml-4 shadow-none'
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  headerSection: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -60,
    right: -60,
    opacity: 0.6,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -40,
    left: -40,
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: 40,
    left: 100,
    opacity: 0.4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationContainer: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 16,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  coinsIconWrapper: {
    width: 26,
    height: 26,
    backgroundColor: '#fef3c7',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  profileButton: {
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.15)',
    marginLeft: 4,
  },
  profileIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
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
  itemImage: {
    width: 48,
    height: 48,
    marginBottom: 10,
    borderRadius: 24,
  },
  categoryName: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryRate: {
    fontSize: 16,
    fontWeight: '600',
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
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
    padding: 18,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 11,
    opacity: 0.9,
  },
  moreServicesText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 13,
  },
  impactSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  impactCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  impactIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  impactEmoji: {
    fontSize: 32,
  },
  impactTextContainer: {
    flex: 1,
  },
  impactText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  impactHighlight: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 16,
  },
  impactStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statBadgeText: {
    fontSize: 12,
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
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
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
    marginHorizontal: 14,
  },
  referTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 3,
  },
  referSubtitle: {
    fontSize: 12,
    color: '#b45309',
  },
  tipCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 28,
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
    marginLeft: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#065f46',
    lineHeight: 18,
  },
  brandingSection: {
    marginTop: 0,
    marginBottom: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    borderRadius: 24,
  },
  brandingGradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
  },
  brandingCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: -100,
    right: -80,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  brandingCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
});