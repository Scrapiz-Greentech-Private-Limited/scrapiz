import React, { useState, useRef } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,Modal,ScrollView,TextInput,ActivityIndicator} from 'react-native';
import { ChevronDown, MapPin, Navigation, Plus, X, Home, Building } from 'lucide-react-native';
import { useLocation, SavedLocation } from '../context/LocationContext';
import MapLocationPicker from './MapLocationPicker';

export default function LocationSelector(){
    const {currentLocation, saveLocation, isLoading, error, getCurrentLocation, selectLocation, savedLocations } = useLocation();
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualAddress, setManualAddress] = useState({
        area: '',
        city: '',
        state: '',
        pincode: '',
        label: 'Other',
        type: 'other' as 'home' | 'office' | 'other',
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const cityInputRef = useRef<TextInput>(null);
    const stateInputRef = useRef<TextInput>(null);
    const pincodeInputRef = useRef<TextInput>(null);

    const handleCurrentLocation = async () => {
        await getCurrentLocation();
        setShowMapPicker(false);
    };

    const handleSelectSavedLocation = (location: any)=>{
        selectLocation(location);
        setShowMapPicker(false);
    }

    const handleManualSubmit = () =>{
        const errors: { [key: string]: string } = {};
        if (!manualAddress.label.trim()) errors.label = 'Label is required';
        if (!manualAddress.area.trim()) errors.area = 'Area is required';
        if (!manualAddress.city.trim()) errors.city = 'City is required';
        if (!manualAddress.state.trim()) errors.state = 'State is required';
        if (!manualAddress.pincode.trim()) errors.pincode = 'Pincode is required';
        else if (!/^\d{6}$/.test(manualAddress.pincode)) errors.pincode = 'Invalid pincode';
        if (Object.keys(errors).length > 0){
            setFormErrors(errors);
            return
        }
        const locationData: SavedLocation = {
        id: Date.now().toString(),
        type: manualAddress.type,
        label: manualAddress.label,
        latitude: 0,
        longitude: 0,
        address: manualAddress.area,
        city: manualAddress.city,
        state: manualAddress.state,
        pincode: manualAddress.pincode,
        area: manualAddress.area,
        };
        saveLocation(locationData);
        selectLocation(locationData)
        setShowManualEntry(false);
        setShowMapPicker(false);
        setManualAddress({ area: '', city: '', state: '', pincode: '', label: 'Other', type: 'other' });
        setFormErrors({});
    };

    const handleMapLocationSelect = (location: any) => {
        const locationData: SavedLocation = {
            id: Date.now().toString(),
            type: 'other',
            label: location.area || location.city,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            city: location.city,
            state: location.state,
            pincode: location.pincode,
            area: location.area,
        };
        saveLocation(locationData);
        selectLocation(locationData);
        setShowMapPicker(false);
    };

    return (
        <>
            {/* Map Location Picker Modal */}
            <MapLocationPicker
                visible={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onLocationSelect={handleMapLocationSelect}
                onUseCurrentLocation={handleCurrentLocation}
                onAddManualAddress={() => setShowManualEntry(true)}
                savedLocations={savedLocations}
                onSelectSavedLocation={handleSelectSavedLocation}
                initialLocation={
                    currentLocation
                        ? {
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }
                        : undefined
                }
            />

            {/* Manual Entry Modal */}
            <Modal
                visible={showManualEntry}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowManualEntry(false)}
            >
                <View className='flex-1 bg-black/50 justify-end'>
                    <View className='bg-white rounded-t-3xl max-h-[80%] pb-10'>
                        {/* Header */}
                        <View className='flex-row justify-between items-center p-5 border-b border-gray-100'>
                            <Text className='text-xl font-bold text-gray-900'>Add New Address</Text>
                            <TouchableOpacity onPress={() => setShowManualEntry(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Manual Entry Form */}
                        <ScrollView className='p-5'>
                            <View className='gap-4'>
                                {/* Label Field */}
                                <Text className='text-sm font-semibold text-gray-700 mb-2'>Label *</Text>
                                <TextInput
                                    style={[styles.formInput, formErrors.label && styles.formInputError]}
                                    placeholder="e.g., Home, Office, Other"
                                    value={manualAddress.label}
                                    onChangeText={(text) => {
                                        setManualAddress({ ...manualAddress, label: text });
                                        if (formErrors.label) {
                                            setFormErrors(prev => ({ ...prev, label: '' }));
                                        }
                                    }}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                />
                                {formErrors.label && <Text className='text-[13px] text-red-500'>{formErrors.label}</Text>}

                                {/* Type Selection */}
                                <Text className='text-sm font-semibold text-gray-700 mb-2'>Type</Text>
                                <View className='flex-row gap-2 mb-2'>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            manualAddress.type === 'home' && styles.typeButtonActive
                                        ]}
                                        onPress={() => setManualAddress({ ...manualAddress, type: 'home' })}
                                    >
                                        <Home size={18} color={manualAddress.type === 'home' ? '#16a34a' : '#6b7280'} />
                                        <Text style={[
                                            styles.typeButtonText,
                                            manualAddress.type === 'home' && styles.typeButtonTextActive
                                        ]}>Home</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            manualAddress.type === 'office' && styles.typeButtonActive
                                        ]}
                                        onPress={() => setManualAddress({ ...manualAddress, type: 'office' })}
                                    >
                                        <Building size={18} color={manualAddress.type === 'office' ? '#16a34a' : '#6b7280'} />
                                        <Text style={[
                                            styles.typeButtonText,
                                            manualAddress.type === 'office' && styles.typeButtonTextActive
                                        ]}>Office</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            manualAddress.type === 'other' && styles.typeButtonActive
                                        ]}
                                        onPress={() => setManualAddress({ ...manualAddress, type: 'other' })}
                                    >
                                        <MapPin size={18} color={manualAddress.type === 'other' ? '#16a34a' : '#6b7280'} />
                                        <Text style={[
                                            styles.typeButtonText,
                                            manualAddress.type === 'other' && styles.typeButtonTextActive
                                        ]}>Other</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text className='text-sm font-semibold text-gray-700 mb-2'>Area/Street *</Text>
                                <TextInput
                                    style={[styles.formInput, formErrors.area && styles.formInputError]}
                                    placeholder="Enter area or street"
                                    value={manualAddress.area}
                                    onChangeText={(text) => {
                                        setManualAddress({ ...manualAddress, area: text });
                                        if (formErrors.area) {
                                            setFormErrors(prev => ({ ...prev, area: '' }));
                                        }
                                    }}
                                    returnKeyType="next"
                                    onSubmitEditing={() => cityInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                                {formErrors.area && <Text className='text-[13px] text-red-500'>{formErrors.area}</Text>}

                                <Text className='text-sm font-semibold text-gray-700 mb-2'>City *</Text>
                                <TextInput
                                    ref={cityInputRef}
                                    style={[styles.formInput, formErrors.city && styles.formInputError]}
                                    placeholder="Enter city"
                                    value={manualAddress.city}
                                    onChangeText={(text) => {
                                        setManualAddress({ ...manualAddress, city: text });
                                        if (formErrors.city) {
                                            setFormErrors(prev => ({ ...prev, city: '' }));
                                        }
                                    }}
                                    returnKeyType="next"
                                    onSubmitEditing={() => stateInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                                {formErrors.city && <Text className='text-[13px] text-red-500'>{formErrors.city}</Text>}

                                <Text className='text-sm font-semibold text-gray-700 mb-2'>State *</Text>
                                <TextInput
                                    ref={stateInputRef}
                                    style={[styles.formInput, formErrors.state && styles.formInputError]}
                                    placeholder="Enter state"
                                    value={manualAddress.state}
                                    onChangeText={(text) => {
                                        setManualAddress({ ...manualAddress, state: text });
                                        if (formErrors.state) {
                                            setFormErrors(prev => ({ ...prev, state: '' }));
                                        }
                                    }}
                                    returnKeyType="next"
                                    onSubmitEditing={() => pincodeInputRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                                {formErrors.state && <Text className='text-[13px] text-red-500'>{formErrors.state}</Text>}

                                <Text className='text-sm font-semibold text-gray-700 mb-2'>Pincode *</Text>
                                <TextInput
                                    ref={pincodeInputRef}
                                    style={[styles.formInput, formErrors.pincode && styles.formInputError]}
                                    placeholder="Enter 6-digit pincode"
                                    value={manualAddress.pincode}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9]/g, '');
                                        setManualAddress({ ...manualAddress, pincode: cleaned });
                                        if (formErrors.pincode) {
                                            setFormErrors(prev => ({ ...prev, pincode: '' }));
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    returnKeyType="done"
                                    onSubmitEditing={handleManualSubmit}
                                />
                                {formErrors.pincode && <Text className='text-[13px] text-red-500'>{formErrors.pincode}</Text>}

                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (!manualAddress.label.trim() ||
                                            !manualAddress.area.trim() ||
                                            !manualAddress.city.trim() ||
                                            !manualAddress.state.trim() ||
                                            !manualAddress.pincode.trim() ||
                                            manualAddress.pincode.length !== 6) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleManualSubmit}
                                    disabled={
                                        !manualAddress.label.trim() ||
                                        !manualAddress.area.trim() ||
                                        !manualAddress.city.trim() ||
                                        !manualAddress.state.trim() ||
                                        !manualAddress.pincode.trim() ||
                                        manualAddress.pincode.length !== 6
                                    }
                                >
                                    <Text className='text-base font-semibold text-white'>Save Location</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className='p-4 items-center'
                                    onPress={() => setShowManualEntry(false)}
                                >
                                    <Text className='text-[15px] font-medium text-gray-500'>Back</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Location Display Button - Opens Map Directly */}
            <TouchableOpacity
                className='py-1 px-0 bg-transparent rounded-none border-0 border-transparent self-start'
                onPress={() => setShowMapPicker(true)}
                activeOpacity={0.8}
            >
                <View className='flex-row items-center gap-1.5 max-w-full pr-2'>
                    <MapPin size={22} color="#ffffff" strokeWidth={2.5} fill="#16a34a" />
                    <View className='flex-shrink mr-1.5 min-w-0'>
                        <Text className='text-lg text-white font-bold tracking-[-0.3px] leading-[22px]' numberOfLines={1}>
                            {currentLocation
                                ? `${currentLocation.area || currentLocation.city || 'Location'}`
                                : 'Select location'}
                        </Text>
                        <Text className='text-[13px] text-white font-normal tracking-[-0.1px] mt-px opacity-90' numberOfLines={1}>
                            {currentLocation
                                ? `${currentLocation.city}, ${currentLocation.state || 'India'}`
                                : 'Choose your delivery location'}
                        </Text>
                    </View>
                    <ChevronDown size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
            </TouchableOpacity>
        </>
    )
}

const styles = StyleSheet.create({
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 15,
    color: '#111827',
  },
  formInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
});