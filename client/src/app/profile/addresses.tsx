import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Plus,
  Home,
  Building,
  MapPin,
  Edit,
  Trash2,
  X,
  Navigation,
} from 'lucide-react-native';

// --- Contexts and Services ---
import { useLocation, SavedLocation } from '../../context/LocationContext';
import { AuthService } from '../../api/apiService';
import MapLocationPicker from '../../components/MapLocationPicker';
import { populateFormFromLocation, LocationResult } from '../../utils/addressHelpers';
import { useTheme } from '../../context/ThemeContext';

// --- Placeholder Types (add your actual types) ---
type AddressSummary = {
  id: number;
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion?: string;
};

type CreateAddressRequest = {
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  delivery_suggestion?: string;
};

type AddressFormData = {
  name: string;
  phone_number: string;
  room_number: string;
  street: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  delivery_suggestion: string;
};

const emptyFormData: AddressFormData = {
  name: '',
  phone_number: '',
  room_number: '',
  street: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  delivery_suggestion: '',
};

export default function AddressesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { saveLocation, removeLocation, getCurrentLocation, currentLocation, isLoading: locationLoading, reloadAddresses } = useLocation();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('other');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // --- Input Refs ---
  const phoneInputRef = useRef<TextInput>(null);
  const roomInputRef = useRef<TextInput>(null);
  const streetInputRef = useRef<TextInput>(null);
  const areaInputRef = useRef<TextInput>(null);
  const cityInputRef = useRef<TextInput>(null);
  const stateInputRef = useRef<TextInput>(null);
  const pincodeInputRef = useRef<TextInput>(null);
  const deliveryInputRef = useRef<TextInput>(null); // Added for last field

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const addressdata = await AuthService.getAddresses();
      setAddresses(addressdata);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to load addresses. Please try again.';
      
      if (error.message?.includes('Network request failed') || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(id);
              await AuthService.deleteAddress(id);
              
              setAddresses((prev) => prev.filter((addr) => addr.id !== id));
              
              // Reload addresses in LocationContext to ensure synchronization
              await reloadAddresses();
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Address deleted successfully.',
              });
            } catch (error: any) {
              console.error('Error deleting address:', error);
              
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete address. Please try again.',
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditModal = (address: AddressSummary) => {
    if (!address) return;
    
    setEditingId(address.id);
    setFormData({
      name: address.name,
      phone_number: address.phone_number,
      room_number: address.room_number,
      street: address.street,
      area: address.area,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode.toString(),
      delivery_suggestion: address.delivery_suggestion || '',
    });

    const lowerName = address.name.toLowerCase();
    if (lowerName.includes('home') || lowerName.includes('house')) {
      setAddressType('home');
    } else if (lowerName.includes('office') || lowerName.includes('work')) {
      setAddressType('office');
    } else {
      setAddressType('other');
    }
    
    setFormErrors({});
    setOpen(true); // Open the modal
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setAddressType('other');
    setOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Name validation (max 50 chars)
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Address name is required';
    } else if (formData.name.length > 50) {
      errors.name = 'Name must be 50 characters or less';
    }

    // Phone number validation (max 13 chars, Indian format)
    if (!formData.phone_number || !formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone_number.replace(/[\s\-()]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone_number = 'Enter a valid 10-digit Indian mobile number';
      } else if (formData.phone_number.length > 13) {
        errors.phone_number = 'Phone number must be 13 characters or less';
      }
    }

    // Room number validation (max 50 chars)
    if (!formData.room_number || !formData.room_number.trim()) {
      errors.room_number = 'House/Flat number is required';
    } else if (formData.room_number.length > 50) {
      errors.room_number = 'Room number must be 50 characters or less';
    }

    // Street validation (max 50 chars)
    if (!formData.street || !formData.street.trim()) {
      errors.street = 'Street is required';
    } else if (formData.street.length > 50) {
      errors.street = 'Street must be 50 characters or less';
    }

    // Area validation (max 50 chars)
    if (!formData.area || !formData.area.trim()) {
      errors.area = 'Area/Locality is required';
    } else if (formData.area.length > 50) {
      errors.area = 'Area must be 50 characters or less';
    }

    // City validation (max 50 chars)
    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City is required';
    } else if (formData.city.length > 50) {
      errors.city = 'City must be 50 characters or less';
    }

    // State validation (max 50 chars)
    if (!formData.state || !formData.state.trim()) {
      errors.state = 'State is required';
    } else if (formData.state.length > 50) {
      errors.state = 'State must be 50 characters or less';
    }

    // Country validation (max 50 chars)
    if (!formData.country || !formData.country.trim()) {
      errors.country = 'Country is required';
    } else if (formData.country.length > 50) {
      errors.country = 'Country must be 50 characters or less';
    }

    // Pincode validation (must be a valid integer, 6 digits for India)
    if (!formData.pincode || !formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else {
      const pincodeNum = parseInt(formData.pincode, 10);
      if (isNaN(pincodeNum)) {
        errors.pincode = 'Pincode must be a number';
      } else if (formData.pincode.length !== 6) {
        errors.pincode = 'Pincode must be 6 digits';
      } else if (pincodeNum < 100000 || pincodeNum > 999999) {
        errors.pincode = 'Enter a valid 6-digit pincode';
      }
    }

    // Delivery suggestion validation (max 500 chars, optional)
    if (formData.delivery_suggestion && formData.delivery_suggestion.length > 500) {
      errors.delivery_suggestion = 'Delivery instructions must be 500 characters or less';
    }

    // If there are errors, show toast with first error
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstError = Object.values(errors)[0];
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: firstError,
      });
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData(emptyFormData);
    setFormErrors({}); // Clear errors on close
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return; // Toast is already shown in validateForm
    }

    try {
      setSaving(true);
      const payload: CreateAddressRequest = {
        name: formData.name,
        phone_number: formData.phone_number,
        room_number: formData.room_number,
        street: formData.street,
        area: formData.area,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: parseInt(formData.pincode, 10),
        delivery_suggestion: formData.delivery_suggestion || '',
      };

      if (editingId !== null) {
        const updated = await AuthService.updateAddress(editingId, payload);
        setAddresses(addresses.map((addr) => (addr.id === updated.id ? updated : addr)));
        
        // Reload addresses in LocationContext to sync changes
        await reloadAddresses();
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Address updated successfully',
        });
      } else {
        const newAddress = await AuthService.createAddress(payload);
        setAddresses([newAddress, ...addresses]);

        // Reload addresses in LocationContext to ensure synchronization
        await reloadAddresses();

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Address added successfully',
        });
      }
      handleClose();
    } catch (error: any) {
      console.error('Address save error:', error);
      
      // Extract error message from response or use default
      let errorMessage = 'Failed to save address. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    // Open map picker instead of directly getting location
    setShowMapPicker(true);
  };

  const handleMapLocationSelect = (location: LocationResult) => {
    try {
      // Populate form fields with location data using helper function
      const updatedFormData = populateFormFromLocation(formData, location);
      setFormData(updatedFormData);
      
      // Close map picker - state cleanup will be handled by MapLocationPicker's useEffect
      setShowMapPicker(false);
      
      Toast.show({
        type: 'success',
        text1: 'Location Selected',
        text2: 'Address fields have been populated',
      });
    } catch (error: any) {
      console.error('Error populating form from location:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to populate address fields. Please try again.',
      });
      
      // Close map picker even on error - state cleanup will be handled by MapLocationPicker's useEffect
      setShowMapPicker(false);
    }
  };

  const getAddressIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('home') || lowerName.includes('house')) {
      return <Home size={20} color={colors.primary} />;
    }
    if (lowerName.includes('office') || lowerName.includes('work')) {
      return <Building size={20} color={colors.info} />;
    }
    return <MapPin size={20} color={colors.textSecondary} />;
  };

  const formatAddress = (addr: AddressSummary) => {
    const parts = [addr.room_number, addr.street, addr.area, addr.city, addr.pincode].filter(
      Boolean
    );
    return parts.join(', ');
  };

  const getDefaultAddress = (): number | null => {
    return addresses.length > 0 ? addresses[0].id : null;
  };

  const isDefaultAddress = (id: number): boolean => {
    return getDefaultAddress() === id;
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Addresses</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading addresses...</Text>
        </View>
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Addresses</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]} onPress={handleOpenAddModal}>
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.addNewCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleOpenAddModal}>
          <View style={[styles.addIconContainer, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
            <Plus size={24} color={colors.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.addNewTitle, { color: colors.text }]}>Add New Address</Text>
            <Text style={[styles.addNewSubtitle, { color: colors.textSecondary }]}>Add a new pickup location</Text>
          </View>
        </TouchableOpacity>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}>
            <Text style={[styles.errorText, { color: isDark ? '#fecaca' : '#b91c1c' }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: isDark ? '#991b1b' : '#fee2e2' }]} onPress={loadAddresses}>
              <Text style={[styles.retryText, { color: isDark ? '#fecaca' : '#b91c1c' }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No addresses yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first pickup address to get started
            </Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => (
              <View key={address.id} style={[styles.addressCard, { backgroundColor: colors.surface }]}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTitleRow}>
                    {getAddressIcon(address.name)}
                    <Text style={[styles.addressName, { color: colors.text }]}>{address.name}</Text>
                    {isDefaultAddress(address.id) && (
                      <View style={[styles.defaultBadge, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                        <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.card }]}
                      onPress={() => handleOpenEditModal(address)}
                    >
                      <Edit size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.card }]}
                      onPress={() => handleDeleteAddress(address.id)}
                      disabled={deletingId === address.id}
                    >
                      {deletingId === address.id ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Trash2 size={16} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.addressText, { color: colors.textSecondary }]}>{formatAddress(address)}</Text>

                {address.phone_number && (
                  <Text style={[styles.phoneText, { color: colors.text }]}>📞 {address.phone_number}</Text>
                )}

                {address.delivery_suggestion && (
                  <Text style={[styles.noteText, { color: colors.info }]}>Note: {address.delivery_suggestion}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#16a34a' : '#bbf7d0' }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>About Addresses</Text>
          <Text style={[styles.infoText, { color: isDark ? '#dcfce7' : '#166534' }]}>
            • You can save multiple pickup addresses for convenience{'\n'}
            • The first address in the list is your default address{'\n'}
            • Edit or delete addresses anytime{'\n'}
            • All addresses are securely stored
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? 'Edit Address' : 'Add New Address'}
            </Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView 
            className='flex-1' 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Address Type Selection */}
            <View className='mb-5'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Address Type</Text>
              <View className='flex-row gap-3'>
                <TouchableOpacity
                  className={clsx(
                    'flex-1 flex-row items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 gap-1.5',
                    addressType === 'home' && 'bg-green-50 border-green-600'
                  )}
                  onPress={() => setAddressType('home')}
                >
                  <Home size={18} color={addressType === 'home' ? '#16a34a' : '#6b7280'} />
                  <Text
                    className={clsx(
                      'text-sm text-gray-500 font-medium',
                      addressType === 'home' && 'text-green-600 font-semibold'
                    )}
                  >
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={clsx(
                    'flex-1 flex-row items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 gap-1.5',
                    addressType === 'office' && 'bg-green-50 border-green-600'
                  )}
                  onPress={() => setAddressType('office')}
                >
                  <Building size={18} color={addressType === 'office' ? '#16a34a' : '#6b7280'} />
                  <Text
                    className={clsx(
                      'text-sm text-gray-500 font-medium',
                      addressType === 'office' && 'text-green-600 font-semibold'
                    )}
                  >
                    Office
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={clsx(
                    'flex-1 flex-row items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 gap-1.5',
                    addressType === 'other' && 'bg-green-50 border-green-600'
                  )}
                  onPress={() => setAddressType('other')}
                >
                  <MapPin size={18} color={addressType === 'other' ? '#16a34a' : '#6b7280'} />
                  <Text
                    className={clsx(
                      'text-sm text-gray-500 font-medium',
                      addressType === 'other' && 'text-green-600 font-semibold'
                    )}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Use Current Location Button */}
            <TouchableOpacity
              className='flex-row items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5'
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <Navigation size={18} color="#16a34a" />
              )}
              <Text className='text-green-600 font-semibold'>Use Current Location</Text>
            </TouchableOpacity>

            {/* Form Fields */}
            <View className='mb-4'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Address Name *</Text>
              <TextInput
                className={clsx(
                  'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                  formErrors.name && 'border-red-500 bg-red-50'
                )}
                placeholder="e.g., Home, Office"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {formErrors.name && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.name}</Text>}
            </View>

            <View className='mb-4'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Phone Number *</Text>
              <TextInput
                ref={phoneInputRef}
                className={clsx(
                  'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                  formErrors.phone_number && 'border-red-500 bg-red-50'
                )}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={formData.phone_number}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone_number: text });
                  if (formErrors.phone_number) {
                    setFormErrors((prev) => ({ ...prev, phone_number: '' }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => roomInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {formErrors.phone_number && (
                <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.phone_number}</Text>
              )}
            </View>

            <View className='mb-4'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>House/Flat Number *</Text>
              <TextInput
                ref={roomInputRef}
                className={clsx(
                  'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                  formErrors.room_number && 'border-red-500 bg-red-50'
                )}
                placeholder="e.g., Flat 101"
                value={formData.room_number}
                onChangeText={(text) => {
                  setFormData({ ...formData, room_number: text });
                  if (formErrors.room_number) {
                    setFormErrors((prev) => ({ ...prev, room_number: '' }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => streetInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {formErrors.room_number && (
                <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.room_number}</Text>
              )}
            </View>

            <View className='mb-4'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Street *</Text>
              <TextInput
                ref={streetInputRef}
                className={clsx(
                  'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                  formErrors.street && 'border-red-500 bg-red-50'
                )}
                placeholder="Enter street name"
                value={formData.street}
                onChangeText={(text) => {
                  setFormData({ ...formData, street: text });
                  if (formErrors.street) {
                    setFormErrors((prev) => ({ ...prev, street: '' }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => areaInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {formErrors.street && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.street}</Text>}
            </View>

            <View className='mb-4'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Area/Locality *</Text>
              <TextInput
                ref={areaInputRef}
                className={clsx(
                  'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                  formErrors.area && 'border-red-500 bg-red-50'
                )}
                placeholder="Enter area"
                value={formData.area}
                onChangeText={(text) => {
                  setFormData({ ...formData, area: text });
                  if (formErrors.area) {
                    setFormErrors((prev) => ({ ...prev, area: '' }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => cityInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {formErrors.area && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.area}</Text>}
            </View>

            <View className='flex-row gap-4 mb-4'>
              <View className='flex-1'>
                <Text className='text-sm font-semibold text-gray-700 mb-2.5'>City *</Text>
                <TextInput
                  ref={cityInputRef}
                  className={clsx(
                    'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                    formErrors.city && 'border-red-500 bg-red-50'
                  )}
                  placeholder="Enter city"
                  value={formData.city}
                  onChangeText={(text) => {
                    setFormData({ ...formData, city: text });
                    if (formErrors.city) {
                      setFormErrors((prev) => ({ ...prev, city: '' }));
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => stateInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {formErrors.city && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.city}</Text>}
              </View>

              <View className='flex-1'>
                <Text className='text-sm font-semibold text-gray-700 mb-2.5'>State *</Text>
                <TextInput
                  ref={stateInputRef}
                  className={clsx(
                    'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                    formErrors.state && 'border-red-500 bg-red-50'
                  )}
                  placeholder="Enter state"
                  value={formData.state}
                  onChangeText={(text) => {
                    setFormData({ ...formData, state: text });
                    if (formErrors.state) {
                      setFormErrors((prev) => ({ ...prev, state: '' }));
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => pincodeInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {formErrors.state && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.state}</Text>}
              </View>
            </View>

            <View className='flex-row gap-4 mb-4'>
              <View className='flex-1'>
                <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Pincode *</Text>
                <TextInput
                  ref={pincodeInputRef}
                  className={clsx(
                    'bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900',
                    formErrors.pincode && 'border-red-500 bg-red-50'
                  )}
                  placeholder="Enter pincode"
                  keyboardType="number-pad"
                  value={formData.pincode}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, pincode: cleaned });
                    if (formErrors.pincode) {
                      setFormErrors((prev) => ({ ...prev, pincode: '' }));
                    }
                  }}
                  maxLength={6}
                  returnKeyType="next"
                  onSubmitEditing={() => deliveryInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {formErrors.pincode && <Text className='text-xs text-red-500 mt-1 ml-1'>{formErrors.pincode}</Text>}
              </View>

              <View className='flex-1'>
                <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Country *</Text>
                <TextInput
                  className='bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900'
                  placeholder="Enter country"
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                  returnKeyType="done"
                />
              </View>
            </View>

            <View className='mb-5'>
              <Text className='text-sm font-semibold text-gray-700 mb-2.5'>Delivery Instructions (Optional)</Text>
              <TextInput
                ref={deliveryInputRef}
                className='bg-gray-50 rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900 h-24 pt-4'
                placeholder="e.g., Ring bell twice, near gate"
                multiline
                numberOfLines={3}
                value={formData.delivery_suggestion}
                onChangeText={(text) =>
                  setFormData({ ...formData, delivery_suggestion: text })
                }
              />
            </View>

            <TouchableOpacity
              className={clsx(
                'bg-green-600 rounded-xl p-4 items-center mt-6 shadow-lg shadow-green-600/30',
                saving && 'opacity-50'
              )}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className='text-base font-semibold text-white'>
                  {editingId ? 'Update Address' : 'Save Address'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Map Location Picker */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        mode="form-populate"
        autoOpenGPS={true}
        initialLocation={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        } : undefined}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addNewCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flex1: {
    flex: 1,
  },
  addNewTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  addNewSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  errorCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  errorText: {
    fontWeight: '600',
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryText: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addressList: {
    marginBottom: 24,
  },
  addressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  defaultBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 55,
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
});

