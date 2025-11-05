import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { ArrowLeft,Shield, MessageCircle, Phone, Mail, CircleHelp as HelpCircle, FileText, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HelpSupport(){
    const router = useRouter();
      const handleContactSupport = async (method: string, value: string) => {
    try {
      let url = '';
      let canOpen = false;

      switch (method) {
        case 'phone':
          url = `tel:${value}`;
          canOpen = await Linking.canOpenURL(url);
          break;
        case 'email':
          url = `mailto:${value}`;
          canOpen = await Linking.canOpenURL(url);
          break;
        case 'whatsapp':
          // Remove + and spaces from phone number
          const cleanNumber = value.replace(/[\s+]/g, '');
          url = `whatsapp://send?phone=${cleanNumber}`;
          canOpen = await Linking.canOpenURL(url);
          if (!canOpen) {
            // Fallback to web WhatsApp
            url = `https://wa.me/${cleanNumber}`;
            canOpen = true;
          }
          break;
        case 'url':
          url = value;
          canOpen = await Linking.canOpenURL(url);
          break;
      }

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Unable to Open',
          `Unable to open ${method}. Please make sure you have the app installed.`
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to open ${method}. Please try again or use an alternative contact method.`
      );
    }
  };
    const contactMethods = [
         {
      icon: Phone,
      title: 'Call Us',
      subtitle: '+91 87654 32100',
      description: 'Available 9 AM - 6 PM, Mon-Sat',
      action: () => handleContactSupport('phone'),
      color: '#16a34a',
    },
     {
      icon: Mail,
      title: 'Email Support',
      subtitle: 'support@scrapiz.com',
      description: 'We respond within 24 hours',
      action: () => handleContactSupport('email'),
      color: '#f59e0b',
    },
    ];

    const faqItems = [
    {
      question: 'How do I schedule a pickup?',
      answer: 'Go to the Sell tab, select your items, choose date and time, and confirm your address.',
    },
    {
      question: 'What types of scrap do you accept?',
      answer: 'We accept paper,  metal, electronics, glass, and textiles. Check our rates page for details.',
    },
    {
      question: 'How is the payment calculated?',
      answer: 'Payment is based on current market rates and the weight of materials collected.',
    },
  ];

  const helpSources  =[
    {
      icon: FileText,
      title: 'User Guide',
      subtitle: 'Complete guide to using Scrapiz',
      action: () => Alert.alert('User Guide', 'This would open the user guide.'),
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      subtitle: 'Frequently asked questions',
      action: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          {contactMethods.map((method, index) => (
            <TouchableOpacity key={index} style={styles.contactCard} onPress={method.action}>
              <View style={styles.contactLeft}>
                <View style={[styles.contactIcon, { backgroundColor: `${method.color}20` }]}>
                  <method.icon size={24} color={method.color} />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactTitle}>{method.title}</Text>
                  <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
                  <Text style={styles.contactDescription}>{method.description}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <TouchableOpacity 
            style={styles.privacyCard} 
            onPress={() => handleContactSupport('url', 'https://www.scrapiz.in/privacy-policy')}
          >
            <View style={styles.privacyLeft}>
              <View style={styles.privacyIcon}>
                <Shield size={24} color="#16a34a" />
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Privacy Policy</Text>
                <Text style={styles.privacySubtitle}>Learn how we protect your data</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#d1d5db" />
          </TouchableOpacity>
        </View>

          

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
          <Text style={styles.emergencyText}>
            For urgent issues or emergencies, please call our 24/7 helpline
          </Text>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => handleContactSupport('phone')}
          >
            <Phone size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Call Emergency Support</Text>
          </TouchableOpacity>
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
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  resourceSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
    privacyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
    privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  emergencyCard: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencyText: {
    fontSize: 14,
    color: '#fecaca',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});
