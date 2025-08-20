import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Minus,
  Calendar,
  MapPin,
  Camera,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const scrapCategories = [
  {
    id: 1,
    name: 'Paper & Cardboard',
    rate: 12,
    icon: '📄',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
    items: ['Newspapers', 'Magazines', 'Cardboard', 'Office Paper']
  },
  {
    id: 2,
    name: 'Plastic',
    rate: 18,
    icon: '🧴',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#2563eb'],
    items: ['Bottles', 'Containers', 'Bags', 'Electronics Cases']
  },
  {
    id: 3,
    name: 'Metal',
    rate: 45,
    icon: '🔧',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
    items: ['Iron', 'Steel', 'Aluminum', 'Copper']
  },
  {
    id: 4,
    name: 'Electronics',
    rate: 85,
    icon: '📱',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
    items: ['Mobile Phones', 'Laptops', 'Components', 'Cables']
  },
  {
    id: 5,
    name: 'Glass',
    rate: 8,
    icon: '🥛',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    items: ['Bottles', 'Jars', 'Containers', 'Windows']
  },
  {
    id: 6,
    name: 'Textiles',
    rate: 15,
    icon: '👕',
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
    items: ['Clothes', 'Fabric', 'Shoes', 'Bags']
  }
];

const timeSlots = [
  { id: 1, time: '9:00 AM - 11:00 AM', available: true },
  { id: 2, time: '11:00 AM - 1:00 PM', available: true },
  { id: 3, time: '1:00 PM - 3:00 PM', available: false },
  { id: 4, time: '3:00 PM - 5:00 PM', available: true },
  { id: 5, time: '5:00 PM - 7:00 PM', available: true },
];

const stepTitles = [
  'Select Materials',
  'Schedule Pickup',
  'Pickup Details',
  'Confirmation'
];

export default function SellScreen() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [addressForm, setAddressForm] = useState({
    title: '',
    addressLine: '',
    landmark: '',
    city: '',
    pinCode: ''
  });
  const [useNewAddress, setUseNewAddress] = useState(true);

  const addItem = (category: any) => {
    const existingItem = selectedItems.find(item => item.id === category.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === category.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...category, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.rate * item.quantity), 0);
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item to sell');
      return;
    }
    if (currentStep === 2 && (!selectedDate || !selectedTime)) {
      Alert.alert('Error', 'Please select date and time for pickup');
      return;
    }
    if (currentStep === 3) {
      if (useNewAddress && (!addressForm.addressLine.trim() || !addressForm.city.trim() || !addressForm.pinCode.trim())) {
        Alert.alert('Error', 'Please fill in all required address fields');
        return;
      }
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleOrderSubmission();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOrderSubmission = () => {
    Alert.alert(
      'Success', 
      'Your pickup has been scheduled successfully!',
      [
        { 
          text: 'View Orders', 
          onPress: () => {
            resetForm();
            router.push('/(tabs)/orders');
          }
        },
        {
          text: 'Schedule Another',
          onPress: () => {
            resetForm();
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedItems([]);
    setSelectedDate('');
    setSelectedTime('');
    setAddressForm({
      title: '',
      addressLine: '',
      landmark: '',
      city: '',
      pinCode: ''
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.stepIndicatorGradient}>
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <View style={[
                styles.stepCircle,
                currentStep >= step && styles.stepCircleActive,
                currentStep > step && styles.stepCircleCompleted
              ]}>
                {currentStep > step ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive
                  ]}>
                    {step}
                  </Text>
                )}
              </View>
              {step < 4 && (
                <View style={[
                  styles.stepLine,
                  currentStep > step && styles.stepLineActive
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.stepTitle}>{stepTitles[currentStep - 1]}</Text>
      </LinearGradient>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Sparkles size={24} color="#667eea" />
        <Text style={styles.stepHeaderTitle}>Choose Your Materials</Text>
        <Text style={styles.stepHeaderSubtitle}>Select the scrap materials you want to sell</Text>
      </View>
      
      <View style={styles.categoriesGrid}>
        {scrapCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => addItem(category)}
          >
            <LinearGradient colors={category.gradient} style={styles.categoryGradient}>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryRate}>₹{category.rate}/kg</Text>
              </View>
              <View style={styles.addButtonContainer}>
                <Plus size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {selectedItems.length > 0 && (
        <View style={styles.selectedItemsContainer}>
          <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.selectedItemsCard}>
            <Text style={styles.selectedItemsTitle}>Selected Materials</Text>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.selectedItem}>
                <View style={styles.selectedItemLeft}>
                  <Text style={styles.selectedItemIcon}>{item.icon}</Text>
                  <View>
                    <Text style={styles.selectedItemName}>{item.name}</Text>
                    <Text style={styles.selectedItemRate}>₹{item.rate}/kg</Text>
                  </View>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}kg</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </LinearGradient>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Clock size={24} color="#667eea" />
        <Text style={styles.stepHeaderTitle}>Schedule Pickup</Text>
        <Text style={styles.stepHeaderSubtitle}>Choose your preferred date and time</Text>
      </View>
      
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  selectedDate === dateStr && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <LinearGradient 
                  colors={selectedDate === dateStr ? ['#667eea', '#764ba2'] : ['#ffffff', '#f8fafc']}
                  style={styles.dateCardGradient}
                >
                  <Text style={[
                    styles.dateText,
                    selectedDate === dateStr && styles.dateTextSelected
                  ]}>
                    {dateStr}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Select Time Slot</Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlot,
                selectedTime === slot.time && styles.timeSlotSelected,
                !slot.available && styles.timeSlotDisabled
              ]}
              onPress={() => slot.available && setSelectedTime(slot.time)}
              disabled={!slot.available}
            >
              <LinearGradient 
                colors={selectedTime === slot.time ? ['#667eea', '#764ba2'] : ['#ffffff', '#f8fafc']}
                style={styles.timeSlotGradient}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTime === slot.time && styles.timeSlotTextSelected,
                  !slot.available && styles.timeSlotTextDisabled
                ]}>
                  {slot.time}
                </Text>
                {!slot.available && (
                  <Text style={styles.unavailableText}>Unavailable</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <MapPin size={24} color="#667eea" />
        <Text style={styles.stepHeaderTitle}>Pickup Details</Text>
        <Text style={styles.stepHeaderSubtitle}>Where should we pick up your materials?</Text>
      </View>
      
      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.addressCard}>
        <View style={styles.addressTabs}>
          <TouchableOpacity
            style={[styles.addressTab, useNewAddress && styles.addressTabActive]}
            onPress={() => setUseNewAddress(true)}
          >
            <Text style={[styles.addressTabText, useNewAddress && styles.addressTabTextActive]}>
              New Address
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addressTab, !useNewAddress && styles.addressTabActive]}
            onPress={() => setUseNewAddress(false)}
          >
            <Text style={[styles.addressTabText, !useNewAddress && styles.addressTabTextActive]}>
              Saved Address
            </Text>
          </TouchableOpacity>
        </View>

        {useNewAddress ? (
          <View style={styles.addressForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Home, Office"
                value={addressForm.title}
                onChangeText={(text) => setAddressForm(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address Line <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="House/Flat no, Street name"
                value={addressForm.addressLine}
                onChangeText={(text) => setAddressForm(prev => ({ ...prev, addressLine: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Landmark</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nearby landmark"
                value={addressForm.landmark}
                onChangeText={(text) => setAddressForm(prev => ({ ...prev, landmark: text }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>City <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="City"
                  value={addressForm.city}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>PIN Code <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  value={addressForm.pinCode}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, pinCode: text }))}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.savedAddresses}>
            <TouchableOpacity style={styles.savedAddressCard}>
              <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.savedAddressGradient}>
                <View style={styles.savedAddressContent}>
                  <Text style={styles.savedAddressTitle}>Home</Text>
                  <Text style={styles.savedAddressText}>
                    123, Green Valley Apartment, Sector 21, Pune - 411001
                  </Text>
                </View>
                <View style={styles.radioButton}>
                  <View style={styles.radioSelected} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <TouchableOpacity style={styles.photoUploadCard}>
        <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.photoUploadGradient}>
          <Camera size={32} color="#667eea" />
          <Text style={styles.photoUploadTitle}>Add Photos (Optional)</Text>
          <Text style={styles.photoUploadSubtitle}>Help us identify your materials better</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <CheckCircle size={24} color="#10b981" />
        <Text style={styles.stepHeaderTitle}>Order Summary</Text>
        <Text style={styles.stepHeaderSubtitle}>Review your pickup details</Text>
      </View>
      
      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Materials</Text>
        {selectedItems.map((item) => (
          <View key={item.id} style={styles.summaryItem}>
            <Text style={styles.summaryItemName}>
              {item.icon} {item.name} ({item.quantity}kg)
            </Text>
            <Text style={styles.summaryItemAmount}>
              ₹{item.rate * item.quantity}
            </Text>
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Estimated Total</Text>
          <Text style={styles.summaryTotalAmount}>₹{getTotalAmount()}</Text>
        </View>
      </LinearGradient>

      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Pickup Information</Text>
        <View style={styles.summaryDetail}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.summaryDetailText}>{selectedDate} • {selectedTime}</Text>
        </View>
        <View style={styles.summaryDetail}>
          <MapPin size={16} color="#6b7280" />
          <Text style={styles.summaryDetailText}>
            {useNewAddress 
              ? `${addressForm.addressLine}, ${addressForm.city} - ${addressForm.pinCode}`
              : '123, Green Valley Apartment, Sector 21, Pune - 411001'
            }
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1e293b" barStyle="light-content" />
      
      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {selectedItems.length > 0 && (
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Estimated Earnings</Text>
              <View style={styles.totalAmount}>
                <IndianRupee size={20} color="#10b981" />
                <Text style={styles.totalValue}>{getTotalAmount()}</Text>
              </View>
            </View>
            
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                  <ArrowLeft size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.nextButtonGradient}>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 4 ? 'Confirm Pickup' : 'Continue'}
                  </Text>
                  {currentStep === 4 ? (
                    <Zap size={20} color="white" />
                  ) : (
                    <ArrowRight size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  stepIndicatorContainer: {
    paddingTop: 60,
  },
  stepIndicatorGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'white',
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Bold',
  },
  stepNumberActive: {
    color: '#667eea',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter-ExtraBold',
    marginTop: 12,
    marginBottom: 8,
  },
  stepHeaderSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  categoryContent: {
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryRate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-SemiBold',
  },
  addButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItemsContainer: {
    marginTop: 32,
  },
  selectedItemsCard: {
    borderRadius: 20,
    padding: 20,
  },
  selectedItemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  selectedItemRate: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    minWidth: 50,
    textAlign: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  datesContainer: {
    marginHorizontal: -8,
  },
  dateCard: {
    marginHorizontal: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateCardSelected: {
    shadowOpacity: 0.2,
  },
  dateCardGradient: {
    borderRadius: 16,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  dateTextSelected: {
    color: 'white',
  },
  timeSlotsContainer: {
    gap: 12,
  },
  timeSlot: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeSlotSelected: {
    shadowOpacity: 0.2,
  },
  timeSlotDisabled: {
    opacity: 0.6,
  },
  timeSlotGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  timeSlotTextDisabled: {
    color: '#9ca3af',
  },
  unavailableText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  addressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  addressTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  addressTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addressTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
  },
  addressTabTextActive: {
    color: '#111827',
  },
  addressForm: {
    gap: 20,
  },
  formGroup: {
    marginBottom: 4,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  savedAddresses: {
    gap: 12,
  },
  savedAddressCard: {
    borderRadius: 16,
  },
  savedAddressGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  savedAddressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  photoUploadCard: {
    borderRadius: 20,
  },
  photoUploadGradient: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  photoUploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
  },
  photoUploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemName: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  summaryItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Inter-Bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  summaryTotalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
    fontFamily: 'Inter-ExtraBold',
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  summaryDetailText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
    fontFamily: 'Inter-ExtraBold',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previousButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonGradient: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
});