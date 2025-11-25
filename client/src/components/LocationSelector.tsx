import React, { useState, useRef } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,Modal,ScrollView,TextInput,ActivityIndicator} from 'react-native';
import { ChevronDown, MapPin, Navigation, Plus, X, Home, Building } from 'lucide-react-native';
import { useLocation, SavedLocation } from '../context/LocationContext';
import MapLocationPicker from './MapLocationPicker';
import LocationSelectionModal from './LocationSelectionModal';

export default function LocationSelector(){
    const {currentLocation, saveLocation, isLoading, error, getCurrentLocation, selectLocation, savedLocations } = useLocation();
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [showModal, setShowModal] = useState(false);
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
      <TouchableOpacity
        className='py-1 px-0 bg-transparent rounded-none border-0 border-transparent self-start'
        onPress={() => setShowModal(true)}
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

      <LocationSelectionModal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}

