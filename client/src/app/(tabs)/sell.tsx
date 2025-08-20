import React, { useEffect, useState } from 'react';
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
  ColorValue,
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
import { AuthService, AddressSummary, ProductSummary } from '../../api/apiService';

const { width } = Dimensions.get('window');


const stepTitles = [
  'Select Materials',
  'Pickup Details',
  'Confirmation'
];

export default function SellScreen() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Array<{ id: number; name: string; rate: number; icon: string; quantity: number }>>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const [creatingAddress, setCreatingAddress] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    phone_number: '',
    room_number: '',
    street: '',
    area: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    delivery_suggestion: ''
  });
  
  const [editAddressForm, setEditAddressForm] = useState({
    name: '',
    phone_number: '',
    room_number: '',
    street: '',
    area: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    delivery_suggestion: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoadingAddresses(true);
      try {
        const prods = await AuthService.getProducts();
        setProducts(prods);
        const list = await AuthService.getAddresses();
        setAddresses(list);
        if (list.length > 0) {
          setSelectedAddressId(list[0].id);
        }
      } catch (e: any) {
        // ignore silently here; user may not be logged in on this screen yet
      } finally {
        setLoadingAddresses(false);
      }
    };
    load();
  }, []);

  const addItem = (product: ProductSummary) => {
    const rate = product.max_rate ?? product.min_rate ?? 0;
    const existingItem = selectedItems.find(item => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { id: product.id, name: product.name, rate, icon: '♻️', quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    const updated: Array<{ id: number; name: string; rate: number; icon: string; quantity: number }> = [];
    for (const item of selectedItems) {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > 0) {
          updated.push({ ...item, quantity: newQuantity });
        }
      } else {
        updated.push(item);
      }
    }
    setSelectedItems(updated);
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
    if (currentStep === 2) {
      if (useNewAddress) {
        if (!newAddressForm.street.trim() || !newAddressForm.city.trim() || !newAddressForm.pincode.trim()) {
          Alert.alert('Error', 'Please fill in street, city and pincode');
          return;
        }
      } else {
        if (!selectedAddressId) {
          Alert.alert('Error', 'Please select a saved address');
          return;
        }
      }
    }
    
    if (currentStep < 3) {
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
    const itemsPayload = selectedItems.map(i => ({ product_id: i.id, quantity: i.quantity }));
    const addressId = useNewAddress ? undefined : selectedAddressId || undefined;
    AuthService.createOrder(itemsPayload, addressId)
      .then((res) => {
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
      })
      .catch((e: any) => {
        Alert.alert('Error', e.message || 'Failed to create order');
      });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedItems([]);
    setSelectedDate('');
    setSelectedTime('');
    setNewAddressForm({
      name: '',
      phone_number: '',
      room_number: '',
      street: '',
      area: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      delivery_suggestion: ''
    });
  };

  const handleCreateAddress = async () => {
    if (!newAddressForm.name.trim()) {
      Alert.alert('Error', 'Please enter address name');
      return;
    }
    setCreatingAddress(true);
    try {
      const payload = {
        name: newAddressForm.name.trim(),
        phone_number: newAddressForm.phone_number.trim(),
        room_number: newAddressForm.room_number.trim(),
        street: newAddressForm.street.trim(),
        area: newAddressForm.area.trim(),
        city: newAddressForm.city.trim(),
        state: newAddressForm.state.trim(),
        country: newAddressForm.country.trim() || 'India',
        pincode: parseInt(newAddressForm.pincode, 10) || 0,
        delivery_suggestion: newAddressForm.delivery_suggestion.trim(),
      };
      const created = await AuthService.createAddress(payload);
      const list = await AuthService.getAddresses();
      setAddresses(list);
      setUseNewAddress(false);
      setSelectedAddressId(created.id);
      Alert.alert('Success', 'Address saved');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save address');
    } finally {
      setCreatingAddress(false);
    }
  };

  const beginEditAddress = (addr: AddressSummary) => {
    setEditingAddressId(addr.id);
    setEditAddressForm({
      name: addr.name || '',
      phone_number: addr.phone_number || '',
      room_number: addr.room_number || '',
      street: addr.street || '',
      area: addr.area || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'India',
      pincode: String(addr.pincode || ''),
      delivery_suggestion: addr.delivery_suggestion || '',
    });
  };

  const saveEditAddress = async () => {
    if (!editingAddressId) return;
    try {
      const payload: any = { ...editAddressForm };
      if (typeof payload.pincode === 'string') payload.pincode = parseInt(payload.pincode, 10) || 0;
      const updated = await AuthService.updateAddress(editingAddressId, payload);
      const list = await AuthService.getAddresses();
      setAddresses(list);
      setEditingAddressId(null);
      Alert.alert('Success', 'Address updated');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update address');
    }
  };

  const deleteAddress = async (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await AuthService.deleteAddress(id);
          const list = await AuthService.getAddresses();
          setAddresses(list);
          if (selectedAddressId === id) setSelectedAddressId(list[0]?.id ?? null);
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to delete address');
        }
      }}
    ]);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.stepIndicatorGradient}>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((step) => (
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
              {step < 3 && (
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
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.categoryCard}
            onPress={() => addItem(product)}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.categoryGradient}>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryIcon}>♻️</Text>
                <Text style={styles.categoryName}>{product.name}</Text>
                <Text style={styles.categoryRate}>₹{product.min_rate}-{product.max_rate}/kg</Text>
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

      {/* Removed time slot step to keep 3-step flow */}
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
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Home / Office"
                value={newAddressForm.name}
                onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={newAddressForm.phone_number}
                onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, phone_number: text }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.formLabel}>Room/Flat</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="101"
                  value={newAddressForm.room_number}
                  onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, room_number: text }))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.formLabel}>Street <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Street"
                  value={newAddressForm.street}
                  onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, street: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Area</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Area"
                value={newAddressForm.area}
                onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, area: text }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.formLabel}>City <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="City"
                  value={newAddressForm.city}
                  onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, city: text }))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.formLabel}>PIN Code <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  value={newAddressForm.pincode}
                  onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, pincode: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Delivery Suggestion</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Any delivery notes"
                value={newAddressForm.delivery_suggestion}
                onChangeText={(text) => setNewAddressForm(prev => ({ ...prev, delivery_suggestion: text }))}
              />
            </View>

            <TouchableOpacity onPress={handleCreateAddress} disabled={creatingAddress} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{creatingAddress ? 'Saving...' : 'Save Address'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.savedAddresses}>
            {loadingAddresses ? (
              <Text>Loading addresses...</Text>
            ) : addresses.length ? (
              addresses.map((addr) => (
                <TouchableOpacity key={addr.id} style={styles.savedAddressCard} onPress={() => setSelectedAddressId(addr.id)}>
                  <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.savedAddressGradient}>
                    <View style={styles.savedAddressContent}>
                      <Text style={styles.savedAddressTitle}>{addr.name} • {addr.phone_number}</Text>
                      <Text style={styles.savedAddressText}>
                        {addr.room_number}, {addr.street}, {addr.area}, {addr.city}, {addr.state}, {addr.country} - {addr.pincode}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {selectedAddressId === addr.id ? <View style={styles.radioSelected} /> : null}
                    </View>
                  </LinearGradient>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
                    <TouchableOpacity onPress={() => beginEditAddress(addr)} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#eef2ff', borderRadius: 8 }}>
                      <Text style={{ color: '#4338ca', fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAddress(addr.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                      <Text style={{ color: '#b91c1c', fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No saved addresses. Create a new one.</Text>
            )}

            {editingAddressId && (
              <View style={{ marginTop: 16 }}>
                <LinearGradient colors={['#ffffff', '#f8fafc']} style={{ borderRadius: 16, padding: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Edit Address</Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput style={styles.formInput} value={editAddressForm.name} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, name: t }))} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput style={styles.formInput} value={editAddressForm.phone_number} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, phone_number: t }))} />
                  </View>
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
                      <Text style={styles.formLabel}>Room/Flat</Text>
                      <TextInput style={styles.formInput} value={editAddressForm.room_number} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, room_number: t }))} />
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
                      <Text style={styles.formLabel}>Street</Text>
                      <TextInput style={styles.formInput} value={editAddressForm.street} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, street: t }))} />
                    </View>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Area</Text>
                    <TextInput style={styles.formInput} value={editAddressForm.area} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, area: t }))} />
                  </View>
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
                      <Text style={styles.formLabel}>City</Text>
                      <TextInput style={styles.formInput} value={editAddressForm.city} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, city: t }))} />
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
                      <Text style={styles.formLabel}>PIN Code</Text>
                      <TextInput style={styles.formInput} value={editAddressForm.pincode} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, pincode: t }))} keyboardType="numeric" maxLength={6} />
                    </View>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Delivery Suggestion</Text>
                    <TextInput style={styles.formInput} value={editAddressForm.delivery_suggestion} onChangeText={(t) => setEditAddressForm(prev => ({ ...prev, delivery_suggestion: t }))} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                    <TouchableOpacity onPress={() => setEditingAddressId(null)} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveEditAddress} style={{ backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                      <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* <TouchableOpacity style={styles.photoUploadCard}>
        <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.photoUploadGradient}>
          <Camera size={32} color="#667eea" />
          <Text style={styles.photoUploadTitle}>Add Photos (Optional)</Text>
          <Text style={styles.photoUploadSubtitle}>Help us identify your materials better</Text>
        </LinearGradient>
      </TouchableOpacity> */}
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
        {/* <View style={styles.summaryDetail}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.summaryDetailText}>{selectedDate} • {selectedTime}</Text>
        </View> */}
        <View style={styles.summaryDetail}>
          <MapPin size={16} color="#6b7280" />
          <Text style={styles.summaryDetailText}>
            {useNewAddress 
              ? `${newAddressForm.street}, ${newAddressForm.city} - ${newAddressForm.pincode}`
              : (addresses.find(a => a.id === selectedAddressId)
                  ? `${addresses.find(a => a.id === selectedAddressId)!.street}, ${addresses.find(a => a.id === selectedAddressId)!.city} - ${addresses.find(a => a.id === selectedAddressId)!.pincode}`
                  : 'Select an address'
                )
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
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
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
                    {currentStep === 3 ? 'Confirm Pickup' : 'Continue'}
                  </Text>
                  {currentStep === 3 ? (
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