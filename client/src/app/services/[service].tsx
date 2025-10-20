import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import { ArrowLeft, Calendar, Clock, Shield, CheckCircle, Star } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {services } from '../(tabs)/services';

const { width } = Dimensions.get('window');

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

  const service = services.find(s => s.id === serviceId) || services[0];
  const details = serviceDetails[service.id] || { included: [], howItWorks: [] };


  const handleBookNow = () => {
    router.push({ 
      pathname: '/services/book', 
      params: { service: service.id } 
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{service.title}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>

            <View style={[styles.heroCard, { backgroundColor: service.bgColor }]}>
                <View style={[styles.heroIcon, { backgroundColor: service.color }]}>
                    <service.icon size={40} color="white" />
                </View>
                <Text style={[styles.heroTitle, { color: service.color }]}>{service.title}</Text>
                <Text style={styles.heroDescription}>{service.description}</Text>
                <View style={styles.tagsContainer}>
                    <View style={styles.tag}><Shield size={14} color="#475569" /><Text style={styles.tagText}>Insured</Text></View>
                    <View style={styles.tag}><Clock size={14} color="#475569" /><Text style={styles.tagText}>Fast</Text></View>
                    <View style={styles.tag}><Star size={14} color="#475569" /><Text style={styles.tagText}>4.8 ★</Text></View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's Included</Text>
                <View style={styles.card}>
                    {details.included.map((item: string, index: number) => (
                    <View key={index} style={styles.listItem}>
                        <CheckCircle size={18} color="#16a34a" />
                        <Text style={styles.listItemText}>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.card}>
                    {details.howItWorks.map((item: string, index: number) => (
                    <View key={index} style={styles.stepItem}>
                        <View style={[styles.stepNumber, { backgroundColor: service.color }]}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: service.color }]} 
          onPress={handleBookNow}
        >
          <Calendar size={22} color="white" />
          <Text style={styles.bookButtonText}>Book This Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  contentContainer: {
      padding: 16,
  },
  heroCard: {
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
  },
  heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  heroTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      marginBottom: 8,
  },
  heroDescription: {
      fontSize: 15,
      color: '#475569',
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 16,
  },
  tagsContainer: {
      flexDirection: 'row',
      gap: 10,
  },
  tag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 6,
  },
  tagText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: '#475569',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 10,
  },
  stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -2,
  },
  stepNumberText: {
      color: 'white',
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
      fontSize: 15,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
