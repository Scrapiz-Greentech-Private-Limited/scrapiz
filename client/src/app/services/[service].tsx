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
import { services } from '../(tabs)/services';

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

  const service = services.find(s => s.id === serviceId);
  
  // If service not found, redirect back
  if (!service) {
    router.back();
    return null;
  }
  
  const details = serviceDetails[service.id] || { included: [], howItWorks: [] };


  const handleBookNow = () => {
    router.push({ 
      pathname: '/services/book', 
      params: { service: service.id } 
    } as any);
  };

  return (
    <SafeAreaView className='flex-1 bg-slate-50'>
      <StatusBar barStyle="dark-content" />
      
      <View  className='flex-row items-center px-4 py-3 bg-white border-b border-gray-200'>
        <TouchableOpacity className='bg-gray-100 p-2 rounded-[20px]' onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className='p-16'>

            <View style={ {backgroundColor: service.bgColor} } className='rounded-xl p-5 items-center mb-6 '>
                <View style={{ backgroundColor: service.color }} className='w-18 h-18 rounded-full justify-center items-center mb-4'>
                    <service.icon size={40} color="white" />
                </View>
                <Text style={{ color: service.color }} className='text-2xl font-bold font-inter-bold mb-2'>{service.title}</Text>
                <Text className='text-[15px] text-slate-600 font-inter-regular text-center mb-4'>{service.description}</Text>
                <View className='flex-row gap-[10px] '>
                    <View className='flex-row items-center '><Shield size={14} color="#475569" /><Text className='text-sm font-inter-medium text-slate-600'>Insured</Text></View>
                    <View className='flex-row items-center '><Clock size={14} color="#475569" /><Text className='text-sm font-inter-medium text-slate-600'>Fast</Text></View>
                    <View className='flex-row items-center '><Star size={14} color="#475569" /><Text className='text-sm font-inter-medium text-slate-600'>4.8 ★</Text></View>
                </View>
            </View>

            <View className='mb-6'>
                <Text className='text-lg font-semibold font-inter-semibold text-gray-900'>What's Included</Text>
                <View className='bg-white rounded-2xl p-4 '>
                    {details.included.map((item: string, index: number) => (
                    <View key={index} className='flex-row items-start gap-3 py-2.5'>
                        <CheckCircle size={18} color="#16a34a" />
                        <Text className='flex-1 text-[15px] font-inter-regular text-gray-700 leading-relaxed'>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>

            <View className='mb-6'>
                <Text className='text-lg font-semibold font-inter-semibold text-gray-700 mb-3'>How It Works</Text>
                <View className='bg-white rounded-2xl'>
                    {details.howItWorks.map((item: string, index: number) => (
                    <View key={index} className='flex-row items-start gap-4 py-2.5'>
                        <View style={ { backgroundColor: service.color }} className='w-7 h-7 rounded-full justify-center items-center -mt-[2px] '>
                            <Text className='text-white font-bold font-inter-bold text-[15px]'>{index + 1}</Text>
                        </View>
                        <Text className='flex-1 text-[15px] font-inter-regular text-gray-700 leading-relaxed'>{item}</Text>
                    </View>
                    ))}
                </View>
            </View>
        </View>
      </ScrollView>

      <View className='p-4 bg-white/90 border-t  border-gray-200'>
        <TouchableOpacity 
          style={ { backgroundColor: service.color }} 
          className='flex-row justify-center items-center p-4 rounded-2xl gap-3'
          onPress={handleBookNow}
        >
          <Calendar size={22} color="white" />
          <Text className='text-white text-lg font-semibold font-inter-semibold'>Book This Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
