import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ServiceabilityAPI, ServiceableCity } from '../api/apiService';
import { CacheService } from '../services/serviceabilityCache';


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
  reloadAddresses: () => Promise<void>;
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
    initializeCache();
  },[])

  /**
   * Initialize cache on context mount
   * Fetches fresh data from API if cache is expired or empty
   */
  const initializeCache = async () => {
    try {
      const isCacheValid = await CacheService.isCacheValid();
      
      if (!isCacheValid) {
        console.log('🔄 Cache expired or empty, refreshing from API...');
        await refreshCacheFromAPI();
      } else {
        console.log('✅ Cache is valid, using cached data');
      }
    } catch (error) {
      console.error('❌ Failed to initialize cache:', error);
      // Continue without cache - will fall back to API calls
    }
  };

  /**
   * Refresh cache with fresh data from API
   */
  const refreshCacheFromAPI = async () => {
    try {
      const [cities, pincodes] = await Promise.all([
        ServiceabilityAPI.getCities(),
        ServiceabilityAPI.getPincodes(),
      ]);

      await CacheService.refreshCache(cities, pincodes);
      console.log('✅ Cache refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh cache:', error);
      // Don't throw - allow app to continue with API calls
    }
  };

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
            accuracy: Location.Accuracy.Highest,
        })
        const [geocode]  = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      
      // Check serviceability using backend API
      let isServiceable = false;
      let cityName = geocode.city || geocode.subregion || 'Unknown City';
      let cityStatus: 'available' | 'coming_soon' | undefined;
      
      // Use backend API for serviceability check
      try {
        const serviceabilityResponse = await ServiceabilityAPI.checkCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        
        isServiceable = serviceabilityResponse.serviceable;
        cityStatus = serviceabilityResponse.status;
        
        // Use city name from API if available
        if (serviceabilityResponse.city) {
          cityName = serviceabilityResponse.city.name;
        }
        
        console.log('✅ Serviceability check via API:', {
          serviceable: isServiceable,
          city: cityName,
          status: cityStatus,
        });
      } catch (apiError) {
        console.warn('⚠️ API call failed, falling back to cache:', apiError);
        
        // Fallback to cached data
        try {
          const cachedData = await CacheService.getCachedData();
          
          if (cachedData && cachedData.cities.length > 0) {
            // Check if coordinates are within any cached city's radius
            for (const city of cachedData.cities) {
              if (city.status !== 'available') continue;
              
              const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                city.latitude,
                city.longitude
              );
              
              if (distance <= city.radius_km) {
                isServiceable = true;
                cityName = city.name;
                cityStatus = city.status;
                console.log('✅ Serviceability check via cache:', {
                  serviceable: true,
                  city: cityName,
                  status: cityStatus,
                });
                break;
              }
            }
          } else {
            console.warn('⚠️ No cached data available for offline check');
          }
        } catch (cacheError) {
          console.error('❌ Cache fallback failed:', cacheError);
        }
      }
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: `${geocode.name || ''}, ${geocode.street || ''}`.trim() || 'Address not available',
        city: cityName,
        state: geocode.region || geocode.isoCountryCode || 'Unknown State',
        pincode: geocode.postalCode || '000000',
        area: geocode.subregion || geocode.district || geocode.name || 'Unknown Area',
      };
      
      setCurrentLocation(locationData);
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_LOCATION,
        JSON.stringify(locationData)
      )
      
      setServiceAvailable(isServiceable)
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, isServiceable.toString());
    } catch (error) {
        let errorMessage = 'Failed to get location. Please try again.';
        if ((error as any).code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services are unavailable. Please enable them in settings.';
      } else if ((error as any).code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      } else if ((error as any).message) {
        errorMessage = (error as any).message;
      }
      
      setError(errorMessage);
      console.error('Location error:', error);
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

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const validatePincode = (pincode: string): boolean => {
    // Basic format validation
    if (!pincode || !/^[1-9]\d{5}$/.test(pincode.trim())) {
      return false;
    }
    return true;
  };

  const setLocationFromPincode = async (pincode: string): Promise<boolean> => {
    try {
      // Validate pincode format first
      if (!validatePincode(pincode)) {
        setError('Invalid pin code format');
        setServiceAvailable(false);
        return false;
      }

      // Use backend API for serviceability check
      let serviceabilityResponse;
      
      try {
        serviceabilityResponse = await ServiceabilityAPI.checkPincode(pincode);
        console.log('✅ Pincode check via API:', serviceabilityResponse);
      } catch (apiError) {
        console.warn('⚠️ API call failed, falling back to cache:', apiError);
        
        // Fallback to cached data
        try {
          const cachedData = await CacheService.getCachedData();
          
          if (cachedData && cachedData.pincodes.includes(pincode)) {
            // Find the city for this pincode
            const city = cachedData.cities.find(c => 
              c.status === 'available'
            );
            
            if (city) {
              serviceabilityResponse = {
                serviceable: true,
                city: city,
                status: 'available' as const,
              };
              console.log('✅ Pincode check via cache:', serviceabilityResponse);
            } else {
              // Check if it's a coming soon city
              const comingSoonCity = cachedData.cities.find(c => 
                c.status === 'coming_soon'
              );
              
              if (comingSoonCity) {
                serviceabilityResponse = {
                  serviceable: false,
                  city: comingSoonCity,
                  status: 'coming_soon' as const,
                  message: `Service coming soon to ${comingSoonCity.name}`,
                };
                console.log('✅ Coming soon city via cache:', serviceabilityResponse);
              } else {
                setError('Service not available in your area');
                setServiceAvailable(false);
                return false;
              }
            }
          } else {
            setError('Invalid or unserviceable pin code');
            setServiceAvailable(false);
            return false;
          }
        } catch (cacheError) {
          console.error('❌ Cache fallback failed:', cacheError);
          setError('Unable to verify pin code. Please check your internet connection.');
          setServiceAvailable(false);
          return false;
        }
      }

      // Check if city exists in response
      if (!serviceabilityResponse.city) {
        setError('Service not available in your area');
        setServiceAvailable(false);
        return false;
      }

      // Create location data from API response
      const locationData: LocationData = {
        latitude: serviceabilityResponse.city.latitude,
        longitude: serviceabilityResponse.city.longitude,
        address: 'Address to be provided',
        city: serviceabilityResponse.city.name,
        state: serviceabilityResponse.city.state,
        pincode: pincode,
        area: serviceabilityResponse.city.name,
      };

      // Set location data regardless of serviceability status
      setCurrentLocation(locationData);
      setLocationSet(true);

      // Handle based on status
      if (serviceabilityResponse.status === 'coming_soon') {
        // City is coming soon - not serviceable yet
        setServiceAvailable(false);
        setError(serviceabilityResponse.message || `Service coming soon to ${serviceabilityResponse.city.name}`);
        
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(locationData)),
          AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, 'false'),
          AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'true'),
        ]);

        console.log('⏳ Coming soon city from pincode:', { 
          pincode, 
          city: serviceabilityResponse.city.name,
          status: 'coming_soon'
        });
        return false;
      } else if (serviceabilityResponse.serviceable) {
        // City is available and serviceable
        setServiceAvailable(true);
        setError(null);

        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(locationData)),
          AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'true'),
        ]);

        console.log('✅ Location set from pincode:', { 
          pincode, 
          city: serviceabilityResponse.city.name,
          status: 'available'
        });
        return true;
      } else {
        // Not serviceable and not coming soon
        setServiceAvailable(false);
        setError('Service not available in your area');
        
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(locationData)),
          AsyncStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABLE, 'false'),
          AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SET, 'true'),
        ]);

        console.log('❌ Service not available from pincode:', { 
          pincode, 
          city: serviceabilityResponse.city.name 
        });
        return false;
      }
    } catch (err) {
      console.error('Error setting location from pincode:', err);
      setError('Failed to set location from pin code');
      return false;
    }
  };

  const checkServiceAvailability = (): boolean => {
    if (currentLocation) {
      // Rely on the stored serviceAvailable state
      // which is set by API calls in getCurrentLocation and setLocationFromPincode
      return serviceAvailable;
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

  const reloadAddresses = async () => {
    try {
      // Import AuthService dynamically to avoid circular dependencies
      const { AuthService } = await import('../api/apiService');
      
      // Fetch addresses from backend
      const addresses = await AuthService.getAddresses();
      
      // Convert backend addresses to SavedLocation format
      const savedLocs: SavedLocation[] = addresses.map((addr) => {
        // Determine address type from name
        const lowerName = addr.name.toLowerCase();
        let type: 'home' | 'office' | 'other' = 'other';
        if (lowerName.includes('home') || lowerName.includes('house')) {
          type = 'home';
        } else if (lowerName.includes('office') || lowerName.includes('work')) {
          type = 'office';
        }
        
        return {
          id: addr.id.toString(),
          type,
          label: addr.name,
          latitude: 0, // Backend doesn't store coordinates yet
          longitude: 0,
          address: `${addr.room_number}, ${addr.street}, ${addr.area}`,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode.toString(),
          area: addr.area,
        };
      });
      
      // Update state and storage
      setSavedLocations(savedLocs);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_LOCATIONS,
        JSON.stringify(savedLocs)
      );
      
      console.log('✅ Reloaded addresses from backend:', savedLocs.length);
    } catch (error) {
      console.error('Failed to reload addresses:', error);
      // Don't throw - just log the error
    }
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
        reloadAddresses,
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