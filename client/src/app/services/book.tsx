import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parse, format, addDays, startOfToday, setHours, setMinutes } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useLocation, SavedLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalization } from '../../context/LocalizationContext';
import { AuthService, ServiceBookingPayload, AddressSummary } from '../../api/apiService';
import { services } from '../(tabs)/services';
import MapLocationPicker from '../../components/MapLocationPicker';
import NetworkRetryOverlay from '../../components/NetworkRetryOverlay';
import { useNetworkRetry } from '../../hooks/useNetworkRetry';
import { populateFormFromLocation, LocationResult } from '../../utils/addressHelpers';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  CheckCircle,
  Plus,
  Navigation,
  Home,
  Building
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Configuration ---
const TIME_SLOTS = [
  '09:00 AM', '11:00 AM', '01:00 PM',
  '03:00 PM', '05:00 PM', '07:00 PM'
];

// Parse "09:00 AM" / "01:00 PM" → 24-hour integer (9 / 13)
const getSlotHour = (slot: string): number => {
  const match = slot.match(/(\d+):(\d+) (AM|PM)/);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  if (match[3] === 'PM' && h < 12) h += 12;
  if (match[3] === 'AM' && h === 12) h = 0;
  return h;
};

// Current hour in IST (UTC+5:30) — keeps comparison consistent regardless of device timezone
const getCurrentISTHour = (): number => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600000).getHours();
};

// Returns TIME_SLOTS filtered to only future slots when date is today
const getAvailableTimeSlots = (date: Date | null): string[] => {
  if (!date) return TIME_SLOTS;
  const isToday = date.toDateString() === startOfToday().toDateString();
  if (!isToday) return TIME_SLOTS;
  const currentHour = getCurrentISTHour();
  return TIME_SLOTS.filter(slot => getSlotHour(slot) > currentHour);
};

// Helper to generate next 14 days
const getBookingDates = () => {
  const dates = [];
  const today = startOfToday();
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    dates.push({
      fullDate: date,
      dayName: i === 0 ? 'Today'  : format(date, 'EEE'),
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
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  const { savedLocations, reloadAddresses } = useLocation();

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
  const [selectedAddress, setSelectedAddress] = useState<AddressSummary | null>(null);
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Keep a ref in sync with selectedTime so the date-change effect below can
  // read the latest value without needing selectedTime in its dependency array.
  const selectedTimeRef = React.useRef(selectedTime);
  useEffect(() => { selectedTimeRef.current = selectedTime; }, [selectedTime]);

  // Intentionally depends only on selectedDate — we read selectedTime via ref
  // to avoid re-running this effect on every keystroke / time selection.
  useEffect(() => {
    if (!selectedDate || !selectedTimeRef.current) return;
    const available = getAvailableTimeSlots(selectedDate);
    if (!available.includes(selectedTimeRef.current)) {
      setSelectedTime(null);
    }
  }, [selectedDate]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Combined data loading function for retry
  const loadInitialData = async () => {
    setLoadingUser(true);
    setLoadingAddresses(true);
    
    const [user, addressData] = await Promise.all([
      AuthService.getUser(),
      AuthService.getAddresses()
    ]);
    
    setName(user.name || '');
    setAddresses(addressData);
    
    // Auto-select first address if available
    if (addressData.length > 0 && !selectedAddress) {
      setSelectedAddress(addressData[0]);
    }
    
    setLoadingUser(false);
    setLoadingAddresses(false);
  };

  // Network retry hook
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
    fetchFn: loadInitialData,
    countdownSeconds: 5,
    maxRetries: 3,
  });

  // Load user data and addresses
  useEffect(() => {
    const initLoad = async () => {
      const isConnected = await checkNetworkAndLoad();
      if (isConnected) {
        try {
          await loadInitialData();
        } catch (error: any) {
          const errorMsg = error.message || 'Failed to load data';
          const isNetworkError = 
            errorMsg.toLowerCase().includes('network') ||
            errorMsg.toLowerCase().includes('internet') ||
            errorMsg.toLowerCase().includes('connection');
          
          if (isNetworkError) {
            startRetryFlow(errorMsg);
          } else {
            setLoadingUser(false);
            setLoadingAddresses(false);
          }
        }
      }
    };
    
    initLoad();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const addressData = await AuthService.getAddresses();
      setAddresses(addressData);
      
      // Auto-select first address if available
      if (addressData.length > 0 && !selectedAddress) {
        setSelectedAddress(addressData[0]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressSelect = (address: AddressSummary) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const handleMapLocationSelect = async (location: LocationResult) => {
    try {
      const newAddress: any = {
        name: 'Service Location',
        phone_number: phone || '',
        room_number: '',
        street: location.address.split(',')[0] || '',
        area: location.area,
        city: location.city,
        state: location.state,
        country: 'India',
        pincode: parseInt(location.pincode) || 0,
        delivery_suggestion: '',
      };

      const savedAddress = await AuthService.createAddress(newAddress);
      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress);
      setShowMapPicker(false);
      
      Toast.show({
        type: 'success',
        text1: 'Address Added',
        text2: 'Location has been saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving address:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save address',
      });
    }
  };

  const getAddressIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('home') || lowerName.includes('house')) {
      return <Home size={18} color={colors.primary} />;
    }
    if (lowerName.includes('office') || lowerName.includes('work')) {
      return <Building size={18} color={colors.info} />;
    }
    return <MapPin size={18} color={colors.textSecondary} />;
  };

  const formatAddressShort = (addr: AddressSummary) => {
    return `${addr.area}, ${addr.city}`;
  };

  const formatAddressFull = (addr: AddressSummary) => {
    const parts = [addr.room_number, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.join(', ');
  };

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
      if (!name.trim()) return Alert.alert('Missing Name', 'Please enter your full name.');
      if (!validatePhone(phone)) return Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      if (!selectedAddress) return Alert.alert('Missing Address', 'Please select a service address.');
      if (!selectedDate) return Alert.alert('Missing Date', 'Please select a service date.');
      if (!selectedTime) return Alert.alert('Missing Time', 'Please select a time slot.');

      setSubmitting(true);

      const preferredDateTime = buildPreferredDateTime();
      const fullAddress = formatAddressFull(selectedAddress);
      
      const payload: ServiceBookingPayload = {
        service: selectedService.id,
        name: name.trim(),
        phone: phone.trim(),
        address: fullAddress,
        preferredDateTime,
        notes: notes.trim() || undefined,
      };

      const result = await AuthService.createServiceBooking(payload);
      
      setSuccessMessage('Booking Confirmed! Meeting details have been sent to your email.');
      
      setTimeout(() => {
        router.replace('/(tabs)/services');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Booking error:', error);
      
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || 'Network error. Please check your connection and try again.';
      
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t(selectedService.titleKey)}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Schedule Service</Text>
          </View>
          <View style={[styles.serviceIcon, { backgroundColor: selectedService.bgColor }]}>
            <selectedService.icon size={20} color={selectedService.color} />
          </View>
        </View>

        {successMessage ? (
          <View style={styles.successContainer}>
            <CheckCircle size={64} color={colors.primary} />
            <Text style={[styles.successTitle, { color: colors.text }]}>Success!</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>{successMessage}</Text>
            <Text style={[styles.successSubtext, { color: colors.textTertiary }]}>Check your email for meeting details</Text>
            <TouchableOpacity style={[styles.homeButton, { backgroundColor: colors.primary }]} onPress={handleBackToServices}>
              <Text style={styles.homeButtonText}>Back to Services</Text>
            </TouchableOpacity>
          </View>
        ) : loadingUser ? (
          <View style={styles.successContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.successSubtext, { color: colors.textSecondary, marginTop: 16 }]}>Loading...</Text>
          </View>
        ) : (
          <>
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
              {/* Section 1: Contact Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Section 2: Address Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <MapPin size={20} color={colors.text} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 0 }]}>Service Address</Text>
                </View>
                
                {selectedAddress ? (
                  <TouchableOpacity
                    style={[styles.selectedAddressCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                    onPress={() => setShowAddressModal(true)}
                  >
                    <View style={styles.addressCardContent}>
                      {getAddressIcon(selectedAddress.name)}
                      <View style={styles.addressTextContainer}>
                        <Text style={[styles.addressName, { color: colors.text }]}>{selectedAddress.name}</Text>
                        <Text style={[styles.addressShort, { color: colors.textSecondary }]} numberOfLines={1}>
                          {formatAddressShort(selectedAddress)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.changeText, { color: colors.primary }]}>Change</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.addAddressButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowAddressModal(true)}
                  >
                    <Plus size={20} color={colors.primary} />
                    <Text style={[styles.addAddressText, { color: colors.primary }]}>Select Address</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Section 3: Date Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Calendar size={20} color={colors.text} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 0 }]}>Select Date</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                  {bookingDates.map((item, index) => {
                    // Hide today (and any date) if it has no remaining time slots
                    if (getAvailableTimeSlots(item.fullDate).length === 0) return null;
                    const isSelected = selectedDate?.toDateString() === item.fullDate.toDateString();
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dateCard,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedDate(item.fullDate)}
                      >
                        <Text style={[styles.dayName, { color: colors.textSecondary }, isSelected && styles.textSelected]}>{item.dayName}</Text>
                        <Text style={[styles.dayNumber, { color: colors.text }, isSelected && styles.textSelected]}>{item.dayNumber}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Section 4: Time Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Clock size={20} color={colors.text} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 0 }]}>Select Time</Text>
                </View>
                {(() => {
                  const availableSlots = getAvailableTimeSlots(selectedDate);
                  if (availableSlots.length === 0) {
                    return (
                      <Text style={[styles.noSlotsText, { color: colors.textSecondary }]}>
                        No time slots available for today. Please select another date.
                      </Text>
                    );
                  }
                  return (
                    <View style={styles.timeGrid}>
                      {availableSlots.map((slot, index) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeChip,
                              { backgroundColor: colors.surface, borderColor: colors.border },
                              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => setSelectedTime(slot)}
                          >
                            <Text style={[styles.timeText, { color: colors.text }, isSelected && styles.textSelected]}>{slot}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}
              </View>

              {/* Section 5: Notes */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Wrench size={20} color={colors.text} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 0 }]}>Additional Notes</Text>
                </View>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Any specific requirements?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom || 20 }]}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  submitting && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Address Selection Modal */}
        <Modal
          visible={showAddressModal}
          animationType="slide"
          onRequestClose={() => setShowAddressModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Use Current Location */}
              <TouchableOpacity
                style={[styles.useLocationButton, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#16a34a' : '#bbf7d0' }]}
                onPress={() => {
                  setShowAddressModal(false);
                  setShowMapPicker(true);
                }}
              >
                <Navigation size={20} color={colors.primary} />
                <Text style={[styles.useLocationText, { color: colors.primary }]}>Use Current Location</Text>
              </TouchableOpacity>

              {/* Saved Addresses */}
              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedAddress?.id === addr.id && { borderColor: colors.primary, backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }
                  ]}
                  onPress={() => handleAddressSelect(addr)}
                >
                  <View style={styles.addressOptionContent}>
                    {getAddressIcon(addr.name)}
                    <View style={styles.addressOptionText}>
                      <Text style={[styles.addressOptionName, { color: colors.text }]}>{addr.name}</Text>
                      <Text style={[styles.addressOptionAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                        {formatAddressFull(addr)}
                      </Text>
                    </View>
                  </View>
                  {selectedAddress?.id === addr.id && (
                    <CheckCircle size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {addresses.length === 0 && !loadingAddresses && (
                <View style={styles.emptyAddresses}>
                  <MapPin size={48} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved addresses</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Add your first address to continue</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Map Location Picker */}
        <MapLocationPicker
          visible={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
          mode="form-populate"
          autoOpenGPS={true}
        />

        <Toast />

        {/* Network Retry Overlay - Shows when network issues occur */}
        <NetworkRetryOverlay
          visible={showRetryOverlay}
          countdown={countdown}
          isRetrying={isRetrying}
          hasFailedPermanently={hasFailedPermanently}
          errorMessage={errorMessage || undefined}
          onRetryNow={retryNow}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  serviceIcon: {
    padding: 10,
    borderRadius: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  // Date Styles
  dateScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  dateCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 72,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Time Styles
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noSlotsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  timeChip: {
    width: '31%',  // 3 items per row with space between
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSelected: {
    color: '#fff',
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
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
    padding: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // Address Styles
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressShort: {
    fontSize: 14,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 20,
  },
  useLocationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  addressOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  addressOptionText: {
    flex: 1,
  },
  addressOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressOptionAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyAddresses: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});