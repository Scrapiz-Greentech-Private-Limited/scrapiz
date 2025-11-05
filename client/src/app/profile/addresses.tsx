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
  // Removed unused StyleSheet import
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
} from 'lucide-react-native'; // Assuming lucide-react-native
import clsx from 'clsx'; // For conditional class names

// --- Contexts and Services ---
import { useLocation, SavedLocation } from '../../context/LocationContext';
import { AuthService } from '../../api/apiService'; // Assumed path

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
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { saveLocation, removeLocation, getCurrentLocation, currentLocation, isLoading: locationLoading } = useLocation();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('other');

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
    } catch (error) {
      setError('Failed to load addresses. Please try again.');
      console.error('Error fetching addresses:', error);
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
              // Also remove from context
              removeLocation(id.toString());
              
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Address updated successfully',
        });
      } else {
        const newAddress = await AuthService.createAddress(payload);
        setAddresses([newAddress, ...addresses]);

        // Also save to Location Context for quick access
        const savedLoc: SavedLocation = {
          id: newAddress.id.toString(),
          type: addressType,
          label: newAddress.name,
          latitude: 0, // Note: You'll need to geocode this address if you need lat/lng
          longitude: 0,
          address: `${newAddress.room_number}, ${newAddress.street}`,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode.toString(),
          area: newAddress.area,
        };
        saveLocation(savedLoc);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Address added successfully',
        });
      }
      handleClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save address',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      if (currentLocation) {
        setFormData({
          ...formData,
          area: currentLocation.area || '',
          city: currentLocation.city || '',
          state: currentLocation.state || '',
          pincode: currentLocation.pincode || '',
          street: currentLocation.street || '',
          room_number: formData.room_number || '', // Keep existing fields
          name: formData.name || '',
          phone_number: formData.phone_number || '',
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Location details filled',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to get current location',
      });
    }
  };

  const getAddressIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('home') || lowerName.includes('house')) {
      return <Home size={20} color="#16a34a" />;
    }
    if (lowerName.includes('office') || lowerName.includes('work')) {
      return <Building size={20} color="#3b82f6" />;
    }
    return <MapPin size={20} color="#6b7280" />;
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
      <View className='flex-1 bg-slate-50'>
        <View className='bg-white pt-[60px] px-5 pb-5 flex-row items-center justify-between shadow-lg shadow-black/10'>
          <TouchableOpacity className='w-10 h-10 rounded-full bg-gray-100 justify-center items-center' onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text className='text-xl font-semibold text-gray-900 font-inter-semibold'>Addresses</Text>
          <View className='w-10 h-10' />
        </View>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className='mt-3 text-base text-gray-500 font-inter-regular'>Loading addresses...</Text>
        </View>
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View className='flex-1 bg-slate-50'>
      <View className='bg-white pt-[60px] px-5 pb-5 flex-row items-center justify-between shadow-lg shadow-black/10'>
        <TouchableOpacity className='w-10 h-10 rounded-full bg-gray-100 justify-center items-center' onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className='text-xl font-semibold text-gray-900 font-inter-semibold'>Addresses</Text>
        <TouchableOpacity className='w-10 h-10 rounded-full bg-green-50 justify-center items-center' onPress={handleOpenAddModal}>
          <Plus size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <TouchableOpacity className='bg-white rounded-2xl p-5 flex-row items-center mb-6 border-2 border-gray-200 border-dashed' onPress={handleOpenAddModal}>
          <View className='w-12 h-12 rounded-full bg-green-50 justify-center items-center mr-4'>
            <Plus size={24} color="#16a34a" />
          </View>
          <View className='flex-1'>
            <Text className='text-base font-semibold text-gray-900 font-inter-semibold mb-1'>Add New Address</Text>
            <Text className="text-sm text-gray-500 font-inter-regular">Add a new pickup location</Text>
          </View>
        </TouchableOpacity>

        {error && (
          <View className='bg-red-50 rounded-2xl p-5 flex-row items-center justify-between mb-4'>
            <Text className='text-red-700 font-semibold flex-1'>{error}</Text>
            <TouchableOpacity className='bg-red-100 p-2 rounded-lg ml-2' onPress={loadAddresses}>
              <Text className='text-red-700 font-semibold text-sm'>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && !error ? (
          <View className='items-center p-10 my-5'>
            <MapPin size={48} color="#d1d5db" />
            <Text className='text-lg font-semibold text-gray-700 mt-4 mb-2'>No addresses yet</Text>
            <Text className='text-sm text-gray-500 text-center leading-5'>
              Add your first pickup address to get started
            </Text>
          </View>
        ) : (
          <View className='mb-6'>
            {addresses.map((address) => (
              <View key={address.id} className='bg-white rounded-2xl p-5 mb-4 shadow-md shadow-black/10'>
                <View className='flex-row justify-between items-start mb-3'>
                  <View className='flex-row items-center flex-1'>
                    {getAddressIcon(address.name)}
                    <Text className='text-base font-semibold text-gray-900 ml-2'>{address.name}</Text>
                    {isDefaultAddress(address.id) && (
                      <View className='bg-green-100 rounded-xl px-2 py-1 ml-3'>
                        <Text className='text-[10px] font-semibold text-green-600'>Default</Text>
                      </View>
                    )}
                  </View>
                  <View className='flex-row gap-2'>
                    <TouchableOpacity
                      className='w-8 h-8 rounded-full bg-gray-100 justify-center items-center'
                      onPress={() => handleOpenEditModal(address)}
                    >
                      <Edit size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className='w-8 h-8 rounded-full bg-gray-100 justify-center items-center'
                      onPress={() => handleDeleteAddress(address.id)}
                      disabled={deletingId === address.id}
                    >
                      {deletingId === address.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 size={16} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text className='text-sm text-gray-500 leading-5 mb-3'>{formatAddress(address)}</Text>

                {address.phone_number && (
                  <Text className='text-sm text-gray-700 font-medium mb-3'>📞 {address.phone_number}</Text>
                )}

                {address.delivery_suggestion && (
                  <Text className='text-sm text-blue-600 italic'>Note: {address.delivery_suggestion}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View className='bg-green-50 rounded-2xl p-5 border border-green-200'>
          <Text className='text-base font-semibold text-green-600 mb-2'>About Addresses</Text>
          <Text className='text-sm text-green-800 leading-5'>
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
        transparent={false} // Full screen modal
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          className='flex-1 bg-white'
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className='flex-row justify-between items-center px-5 py-4 border-b border-gray-100 pt-[55px]'>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <X size={24} color="#111827" />
            </TouchableOpacity>
            <Text className='text-xl font-bold text-gray-900'>
              {editingId ? 'Edit Address' : 'Add New Address'}
            </Text>
            <View className="w-10" />
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
      <Toast />
    </View>
  );
}

