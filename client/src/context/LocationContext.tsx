import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
  isLocationserviceable, 
  isCityServiceable, 
  isPincodeServiceable,
  getCityFromPincode,
  getCityFromPincodeDetails 
} from '../constants/serviceArea';


export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
}

export interface SavedLocation extends LocationData {
  id: string;
  type: 'home' | 'office' | 'other';
  label: string;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  savedLocations: SavedLocation[];
  serviceAvailable: boolean;
  locationSet: boolean; // Renamed from permissionGranted
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  setManualLocation: (location: LocationData) => void;
  saveLocation: (location: SavedLocation) => void;
  removeLocation: (id: string) => void;
  selectLocation: (location: LocationData) => void;
  checkServiceAvailability: () => boolean;
  requestLocationPermission: () => Promise<boolean>;
  validatePincode: (pincode: string) => boolean;
  setLocationFromPincode: (pincode: string) => Promise<boolean>;
}


const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_LOCATION: '@scrapiz_current_location',
  SAVED_LOCATIONS: '@scrapiz_saved_locations',
  SERVICE_AVAILABLE: '@scrapiz_service_available',
  LOCATION_SET: '@scrapiz_location_set', // Renamed from PERMISSION_GRANTED
};
export function LocationProvider({ children }: { children: React.ReactNode }){
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [locationSet, setLocationSet] = useState(false); // Renamed from permissionGranted
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(()=>{
    loadStoredData();
  },[])

  const loadStoredData = async() =>{
    try {
        const [storedLocation, storedSavedLocations, storedServiceAvailable, storedLocationSet] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION),
            AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOCATIONS),
            AsyncStorage.getItem(STORAGE_KEYS.SERVICE_AVAILABLE),
            AsyncStorage.getItem(STORAGE_KEYS.LOCATION_SET),
        ]);
        
        console.log('📦 Loading cached data:', {
          hasStoredLocation: !!storedLocation,
          hasStoredServiceAvailable: !!storedServiceAvailable,
          hasStoredLocationSet: !!storedLocationSet,
        });

        if(storedLocationSet === 'true'){
            setLocationSet(true);
            if(storedLocation){
                const locationData = JSON.parse(storedLocation);
                console.log('✅ Restored location:', locationData.city);
                setCurrentLocation(locationData);
            }
            if (storedSavedLocations) {
              setSavedLocations(JSON.parse(storedSavedLocations));
            }
            if(storedServiceAvailable){
                setServiceAvailable(storedServiceAvailable === 'true')
            }
        }else{
         console.log('🚫 Location not set - clearing cached location');
         await AsyncStorage.multiRemove([
            STORAGE_KEYS.CURRENT_LOCATION,
            STORAGE_KEYS.SERVICE_AVAILABLE,
         ]);
         setCurrentLocation(null);
         setServiceAvailable(false);
         setLocationSet(false);
        }
    } catch (err) {
        console.error('Failed to load location data:', err)
        setLocationSet(false)
    }
  }

  const getCurrentLocation = async() =>{
    setIsLoading(true)
    setError(null)
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if(status !== 'granted'){
            setError('Location permission denied');
            setLocationSet(false);
            await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'false');
             setIsLoading(false);
             return;
        }
        setLocationSet(true)
        await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'true');

        const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        })
        const [geocode]  = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: `${geocode.name || ''}, ${geocode.street || ''}`.trim() || 'Address not available',
        city: geocode.city || geocode.subregion || 'Unknown City',
        state: geocode.region || geocode.isoCountryCode || 'Unknown State',
        pincode: geocode.postalCode || '000000',
        area: geocode.subregion || geocode.district || geocode.name || 'Unknown Area',
      };
      setCurrentLocation(locationData);
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_LOCATION,
        JSON.stringify(locationData)
      )
      const isServiceable = isLocationserviceable(
        position.coords.latitude,
        position.coords.longitude
      )
      setServiceAvailable(isServiceable)
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, isServiceable.toString());
    } catch (error) {
        let errorMessage = 'Failed to get location. Please try again.';
        if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services are unavailable. Please enable them in settings.';
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Location error:', err);
    }finally{
        setIsLoading(false)
    }
  };

  const requestLocationPermission = async():Promise<boolean> =>{
    try {
         const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
      setLocationSet(granted);
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, granted.toString());
      return granted;
    } catch (error) {
    console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const validatePincode = (pincode: string): boolean => {
    return isPincodeServiceable(pincode);
  };

  const setLocationFromPincode = async (pincode: string): Promise<boolean> => {
    try {
      // Validate pincode first
      if (!validatePincode(pincode)) {
        setError('Invalid or unserviceable pin code');
        setServiceAvailable(false);
        return false;
      }

      // Get city details from pincode
      const cityDetails = getCityFromPincodeDetails(pincode);
      if (!cityDetails) {
        setError('Could not determine city from pin code');
        setServiceAvailable(false);
        return false;
      }

      // Create location data from pincode
      const locationData: LocationData = {
        latitude: cityDetails.latitude,
        longitude: cityDetails.longitude,
        address: 'Address to be provided',
        city: cityDetails.name,
        state: cityDetails.state,
        pincode: pincode,
        area: cityDetails.name,
      };

      // Set location and mark service as available
      setCurrentLocation(locationData);
      setServiceAvailable(true);
      setLocationSet(true);
      setError(null);

      // Store in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(locationData)),
        AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'true'),
      ]);

      console.log('✅ Location set from pincode:', { pincode, city: cityDetails.name });
      return true;
    } catch (err) {
      console.error('Error setting location from pincode:', err);
      setError('Failed to set location from pin code');
      return false;
    }
  };

    const checkServiceAvailability = (): boolean => {
    if (currentLocation) {
      return isLocationserviceable(currentLocation.latitude, currentLocation.longitude);
    }
    return false;
  };

   const setManualLocation = async (location: LocationData) => {
    setCurrentLocation(location);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_LOCATION,
      JSON.stringify(location)
    );
  };

    const saveLocation = async (location: SavedLocation) => {
    const updated = [...savedLocations, location];
    setSavedLocations(updated);
    await AsyncStorage.setItem(
      STORAGE_KEYS.SAVED_LOCATIONS,
      JSON.stringify(updated)
    );
  };

    const removeLocation = async (id: string) => {
    const updated = savedLocations.filter(loc => loc.id !== id);
    setSavedLocations(updated);
    await AsyncStorage.setItem(
      STORAGE_KEYS.SAVED_LOCATIONS,
      JSON.stringify(updated)
    );
  };


    const selectLocation = async (location: LocationData) => {
    setCurrentLocation(location);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_LOCATION,
      JSON.stringify(location)
    );
  };


  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        savedLocations,
        serviceAvailable,
        locationSet,
        isLoading,
        error,
        getCurrentLocation,
        setManualLocation,
        saveLocation,
        removeLocation,
        selectLocation,
        checkServiceAvailability,
        requestLocationPermission,
        validatePincode,
        setLocationFromPincode,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
};

export function useLocation() {
    const context =  useContext(LocationContext);
    if(!context){
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
}