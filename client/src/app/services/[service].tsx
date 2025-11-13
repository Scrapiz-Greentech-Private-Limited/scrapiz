import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Shield, CheckCircle, Star } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { services } from '../(tabs)/services';
import { useTheme } from '../../context/ThemeContext';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const serviceDetails: { [key: string]: { included: string[]; howItWorks: string[] } } = {
  demolition: {
    included: [
      'On-site assessment and quote',
      'Professional team and equipment',
      'Eco-friendly disposal',
      'Insurance coverage for all work',
      'Clean-up after completion',
    ],
    howItWorks: [
      'Book your service and we\'ll contact you for details.',
      'Our team visits for a final assessment and quote.',
      'We complete the service professionally and safely.',
      'The site is cleaned and waste is disposed of responsibly.',
    ],
  },
  dismantling: {
    included: [
        'Pre-dismantling safety inspection.',
        'Systematic dismantling of machinery.',
        'Segregation of materials for recycling.',
        'Transportation of dismantled parts.',
        'Site clearance and certification.',
    ],
    howItWorks: [
        'Schedule a consultation to discuss your project.',
        'Receive a detailed dismantling plan and quote.',
        'Our certified engineers perform the dismantling.',
        'Materials are processed for scrap or resale.',
    ],
  },
  'paper-shredding': {
    included: [
        'Secure collection of documents in locked bins.',
        'On-site or off-site shredding options available.',
        'A Certificate of Destruction is provided for compliance.',
        'All shredded paper is 100% recycled.',
        'Service compliant with privacy laws.',
    ],
    howItWorks: [
        'Choose a one-time purge or a regular schedule.',
        'We deliver secure bins to your location.',
        'Our trained staff collect and shred your documents.',
        'You receive a certificate confirming destruction.',
    ],
  },
  'society-tieup': {
    included: [
        'Dedicated bins for paper, plastic, and metal.',
        'Regular collection drives (weekly/bi-weekly).',
        'Transparent, on-the-spot digital weighing.',
        'Monthly reports on environmental impact.',
        'Awareness programs for residents on segregation.',
    ],
    howItWorks: [
        'The society committee contacts us to partner up.',
        'We set up a dedicated scrap collection corner.',
        'Residents drop their segregated scrap anytime.',
        'We collect, weigh, and pay the society monthly.',
    ],
  },
  'junk-removal': {
    included: [
        'Removal of furniture, appliances, and electronics.',
        'Household, office, and construction debris clearance.',
        'Responsible disposal, donation, or recycling.',
        'Includes all labor for lifting and loading.',
        'Same-day or next-day service available.',
    ],
    howItWorks: [
        'Send a photo or list of items for a quick quote.',
        'Schedule a convenient pickup time.',
        'Our team arrives and quickly removes your junk.',
        'We sweep the area clean before leaving.',
    ],
  },
};


export default function ServiceDetailsScreen() {
  const { service: serviceId } = useLocalSearchParams<{ service?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const service = services.find(s => s.id === serviceId);
  
  const details = serviceDetails[service?.id || ''] || { included: [], howItWorks: [] };


  const handleBookNow = () => {
    if (!service) return;
    router.push({ 
      pathname: '/services/book', 
      params: { service: service.id } 
    } as any);
  };

  // If service not found, show error state
  if (!service) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.header, { 
          paddingTop: Platform.OS === 'android' ? insets.top + spacing(12) : insets.top + spacing(8) 
        }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <ArrowLeft size={fs(24)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing(20) }}>
          <Text style={{ fontSize: fs(18), color: colors.textSecondary, textAlign: 'center' }}>
            Service not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? insets.top + spacing(12) : insets.top + spacing(8) 
      }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <ArrowLeft size={fs(24)} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(20) + insets.bottom }}
      >
        <View style={styles.contentContainer}>

            <View style={[styles.heroCard, { backgroundColor: service.bgColor }]}>
                <View style={[styles.heroIcon, { backgroundColor: service.color }]}>
                    <service.icon size={fs(34)} color="white" />
                </View>
                <Text style={[styles.heroTitle, { color: service.color }]}>{service.title}</Text>
                <Text style={styles.heroDescription}>{service.description}</Text>
                <View style={styles.tagsContainer}>
                    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}><Shield size={fs(14)} color={colors.textSecondary} /><Text style={[styles.tagText, { color: colors.textSecondary }]}>Insured</Text></View>
                    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}><Clock size={fs(14)} color={colors.textSecondary} /><Text style={[styles.tagText, { color: colors.textSecondary }]}>Fast</Text></View>
                    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}><Star size={fs(14)} color={colors.textSecondary} /><Text style={[styles.tagText, { color: colors.textSecondary }]}>4.8 ★</Text></View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>What's Included</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {details.included.map((item: string, index: number) => (
                    <View key={index} style={styles.listItem}>
                        <CheckCircle size={fs(18)} color={colors.primary} />
                        <Text style={[styles.listItemText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {details.howItWorks.map((item: string, index: number) => (
                    <View key={index} className='flex-row items-start gap-4 py-2.5'>
                        <View style={ { backgroundColor: service.color }} className='w-7 h-7 rounded-full justify-center items-center -mt-[2px] '>
                            <Text className='text-white font-bold font-inter-bold text-[15px]'>{index + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { 
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, spacing(16)) + spacing(8)
      }]}>
        <TouchableOpacity 
          style={ { backgroundColor: service.color }} 
          className='flex-row justify-center items-center p-4 rounded-2xl gap-3'
          onPress={handleBookNow}
        >
          <Calendar size={fs(22)} color="white" />
          <Text style={styles.bookButtonText}>Book This Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(12),
  },
  backButton: {
    padding: spacing(8),
    borderRadius: spacing(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
      paddingHorizontal: spacing(16),
      paddingTop: spacing(8),
  },
  heroCard: {
      borderRadius: spacing(16),
      paddingVertical: spacing(20),
      paddingHorizontal: spacing(20),
      alignItems: 'center',
      marginBottom: spacing(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
  },
  heroIcon: {
      width: wp(16),
      height: wp(16),
      borderRadius: wp(8),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing(10),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
  },
  heroTitle: {
      fontSize: fs(20),
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      marginBottom: spacing(6),
      textAlign: 'center',
  },
  heroDescription: {
      fontSize: fs(13),
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: spacing(16),
      lineHeight: fs(20),
      paddingHorizontal: spacing(8),
  },
  tagsContainer: {
      flexDirection: 'row',
      gap: spacing(10),
  },
  tag: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: spacing(16),
      paddingVertical: spacing(6),
      paddingHorizontal: spacing(12),
      gap: spacing(6),
      borderWidth: 1,
  },
  tagText: {
      fontSize: fs(13),
      fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: spacing(20),
  },
  sectionTitle: {
    fontSize: fs(17),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: spacing(12),
    paddingLeft: spacing(2),
  },
  card: {
    borderRadius: spacing(12),
    padding: spacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(12),
    paddingVertical: spacing(8),
  },
  listItemText: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    lineHeight: fs(20),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(14),
    paddingVertical: spacing(8),
  },
  stepNumber: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing(2),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
  },
  stepNumberText: {
      color: 'white',
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      fontSize: fs(14),
  },
  stepText: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    lineHeight: fs(20),
  },
  footer: {
    paddingTop: spacing(16),
    paddingHorizontal: spacing(16),
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(16),
    borderRadius: spacing(12),
    gap: spacing(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: fs(17),
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
