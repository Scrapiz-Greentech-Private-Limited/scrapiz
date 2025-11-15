
import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Wrench,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parse, isValid } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { wp, hp, fs, spacing } from '../../utils/responsive';
import { AuthService, ServiceBookingPayload } from '../../api/apiService';
import { services } from '../(tabs)/services';

const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM'
];

const getNextSevenDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      fullDate: date.toLocaleDateString('en-IN'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' })
    });
  }
  return days;
};

const validatePhone = (value: string) => /^(\+?\d{6,15})$/.test(value.trim());

export default function BookingScreen() {
  const { service: serviceId } = useLocalSearchParams<{ service?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedLocations } = useLocation();
  const { colors, isDark } = useTheme();

  const selectedService = useMemo(() => {
    if (!serviceId) return services[0];
    const match = services.find((item) => item.id === serviceId);
    return match || services[0];
  }, [serviceId]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setDate('');
    setTime('');
    setNotes('');
  };

  const buildPreferredDateTime = () => {
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    if (!trimmedDate || !trimmedTime) {
      throw new Error('Please provide both date and time');
    }

    const parsed = parse(`${trimmedDate} ${trimmedTime}`, 'yyyy-MM-dd HH:mm', new Date());
    if (!isValid(parsed)) {
      throw new Error('Invalid date or time format');
    }
    return parsed.toISOString();
  };

  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Missing Name', 'Please enter your full name.');
        return;
      }
      if (!validatePhone(phone)) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
        return;
      }
      if (!address.trim()) {
        Alert.alert('Missing Address', 'Please share the service address.');
        return;
      }

      const preferredDateTime = buildPreferredDateTime();

      const payload: ServiceBookingPayload = {
        service: selectedService.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        preferredDateTime,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      setSubmitting(true);
      await AuthService.createServiceBooking(payload);
      setSuccessMessage('Your booking request has been submitted. Our team will reach out shortly.');
      resetForm();
    } catch (error: any) {
      const message = error?.message || 'We could not submit your booking. Please try again.';
      Alert.alert('Booking Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (successMessage) {
      router.replace('/(tabs)/services');
      return;
    }
    router.back();
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={submitting} >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.serviceIcon, { backgroundColor: selectedService.bgColor }]}>
              <selectedService.icon size={26} color={selectedService.color} />
            </View>
            <Text style={styles.headerTitle}>{selectedService.title}</Text>
            <Text style={styles.headerSubtitle}>Complete the form to schedule your service</Text>
          </View>
        </View>

        {successMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={22} color="#16a34a" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputGroup}>
              <User size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />
            </View>
            <View style={styles.inputGroup}>
              <Phone size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Location</Text>
            <View style={[styles.inputGroup, styles.multilineGroup]}>
              <MapPin size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Full address with landmarks"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Preferred Schedule</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.rowField]}>
                <Calendar size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={datePlaceHolder}
                  value={date}
                  onChangeText={setDate}
                  editable={!submitting}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={[styles.inputGroup, styles.rowField]}>
                <Clock size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={timePlaceHolder}
                  value={time}
                  onChangeText={setTime}
                  editable={!submitting}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text style={styles.helperText}>We will try our best to honor your preferred date and time.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={[styles.inputGroup, styles.multilineGroup]}>
              <Wrench size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Tell us about access restrictions, equipment needs, or any questions"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.termsCard}>
            <Text style={styles.termsTitle}>What Happens Next?</Text>
            <Text style={styles.termsText}>• Our specialists review your request within a few hours.</Text>
            <Text style={styles.termsText}>• We confirm the slot and provide a detailed quotation.</Text>
            <Text style={styles.termsText}>• The onsite team arrives with all required tools and safety gear.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Booking Request'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? 56 : 60,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginTop: 8,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#1f2937',
  },
  multilineGroup: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -4,
  },
  termsCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    marginTop: 4,
  },
  termsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 13,
    color: '#065f46',
    marginBottom: 4,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#15803d',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});