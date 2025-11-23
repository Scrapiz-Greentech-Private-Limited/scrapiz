import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parse, format, addDays, startOfToday, setHours, setMinutes } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthService, ServiceBookingPayload } from '../../api/apiService';
import { services } from '../(tabs)/services';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  CheckCircle 
} from 'lucide-react-native';

// --- Configuration ---
const TIME_SLOTS = [
  '09:00 AM', '11:00 AM', '01:00 PM', 
  '03:00 PM', '05:00 PM', '07:00 PM'
];

// Helper to generate next 14 days
const getBookingDates = () => {
  const dates = [];
  const today = startOfToday();
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    dates.push({
      fullDate: date,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tom' : format(date, 'EEE'),
      dayNumber: format(date, 'd'),
      month: format(date, 'MMM')
    });
  }
  return dates;
};

const validatePhone = (value: string) => /^(\+?\d{6,15})$/.test(value.trim());

export default function BookingScreen() {
  const { service: serviceId } = useLocalSearchParams<{ service?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // --- State ---
  const bookingDates = useMemo(() => getBookingDates(), []);
  
  // Selected Service Logic
  const selectedService = useMemo(() => {
    if (!serviceId) return services[0];
    const match = services.find((item) => item.id === serviceId);
    return match || services[0];
  }, [serviceId]);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Stores Date Object
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // Stores "09:00 AM" string
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Handlers ---

  const handleBack = () => {
    if (successMessage) {
      router.replace('/(tabs)/services');
      return;
    }
    router.back();
  };

  const handleBackToServices = () => {
    router.replace('/(tabs)/services');
  };

  const buildPreferredDateTime = () => {
    if (!selectedDate || !selectedTime) {
      throw new Error('Please select both a date and a time slot');
    }

    // Combine Date object with Time String
    // Format of time is "09:00 AM"
    const timeParts = selectedTime.match(/(\d+):(\d+) (AM|PM)/);
    if (!timeParts) throw new Error('Invalid time format');

    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const meridian = timeParts[3];

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const combinedDate = setMinutes(setHours(new Date(selectedDate), hours), minutes);
    return combinedDate.toISOString();
  };

  const handleSubmit = async () => {
    try {
      // Validations
      if (!name.trim()) return Alert.alert('Missing Name', 'Please enter your full name.');
      if (!validatePhone(phone)) return Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      if (!address.trim()) return Alert.alert('Missing Address', 'Please share the service address.');
      if (!selectedDate) return Alert.alert('Missing Date', 'Please select a service date.');
      if (!selectedTime) return Alert.alert('Missing Time', 'Please select a time slot.');

      setSubmitting(true);

      const preferredDateTime = buildPreferredDateTime();
      
      console.log('📅 Booking Details:', {
        service: selectedService.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        preferredDateTime,
        notes: notes.trim() || undefined,
      });

      const payload: ServiceBookingPayload = {
        service: selectedService.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        preferredDateTime,
        notes: notes.trim() || undefined,
      };

      console.log('🚀 Sending booking request...');
      const result = await AuthService.createServiceBooking(payload);
      console.log('✅ Booking successful:', result);
      
      setSuccessMessage('Booking Confirmed! Meeting details have been sent to your email.');
      
      // Redirect to services page after 3 seconds
      setTimeout(() => {
        router.replace('/(tabs)/services');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Booking error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || 'Network error. Please check your connection and try again.';
      
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{selectedService.title}</Text>
            <Text style={styles.headerSubtitle}>Schedule Service</Text>
          </View>
          <View style={[styles.serviceIcon, { backgroundColor: selectedService.bgColor }]}>
            <selectedService.icon size={20} color={selectedService.color} />
          </View>
        </View>

        {successMessage ? (
          <View style={styles.successContainer}>
            <CheckCircle size={64} color="#16a34a" />
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successText}>{successMessage}</Text>
            <Text style={styles.successSubtext}>Check your email for meeting details</Text>
            <TouchableOpacity style={styles.homeButton} onPress={handleBackToServices}>
              <Text style={styles.homeButtonText}>Back to Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Contact Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Details</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', height: 80 }]}>
                <MapPin size={18} color="#6b7280" style={[styles.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, { height: 80, paddingTop: 12 }]}
                  placeholder="Service Address"
                  multiline
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Section 2: Date Selection (Horizontal Scroll) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Calendar size={18} color="#111827" />
                <Text style={styles.sectionTitle}>Select Date</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                {bookingDates.map((item, index) => {
                  const isSelected = selectedDate?.toDateString() === item.fullDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      onPress={() => setSelectedDate(item.fullDate)}
                    >
                      <Text style={[styles.dayName, isSelected && styles.textSelected]}>{item.dayName}</Text>
                      <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>{item.dayNumber}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Section 3: Time Selection (Grid) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Clock size={18} color="#111827" />
                <Text style={styles.sectionTitle}>Select Time</Text>
              </View>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((slot, index) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text style={[styles.timeText, isSelected && styles.textSelected]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Wrench size={18} color="#111827" />
                <Text style={styles.sectionTitle}>Additional Notes</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder="Any specific requirements?"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

          </ScrollView>
        )}

        {/* Footer Button */}
        {!successMessage && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  serviceIcon: {
    padding: 8,
    borderRadius: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  // Date Styles
  dateScroll: {
    gap: 12,
  },
  dateCard: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: 70,
  },
  dateCardSelected: {
    backgroundColor: '#2563eb', // Primary Blue
    borderColor: '#2563eb',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  // Time Styles
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeChip: {
    width: '30%', // approx 3 per row
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  textSelected: {
    color: '#fff',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
  },
  homeButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
});