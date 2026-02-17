import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { X, MapPin, Navigation, Search, Plus, ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  MAP_SETTINGS,
  DEFAULT_CENTER,
  KRUTRIM_API_KEY,
  GOOGLE_API_KEY,
  getSessionToken,
  buildKrutrimAutocompleteUrl,
  buildGoogleReverseGeocodeUrl,
  buildKrutrimPlaceDetailsUrl
} from '../config/mapConfig';
import { MapViewWrapper } from './maps/MapViewWrapper';
import { CameraController, Coordinates } from './maps/types';

interface KrutrimAutocompleteResult {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
}

interface KrutrimAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface KrutrimReverseGeocodeResult {
  formatted_address: string;
  address_components: KrutrimAddressComponent[];
  place_id: string;
}

interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  area: string;
}

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationResult) => void;
  onUseCurrentLocation?: () => void;
  onAddManualAddress?: () => void;
  savedLocations?: any[];
  onSelectSavedLocation?: (location: any) => void;
  initialLocation?: { latitude: number; longitude: number };
  mode?: 'standalone' | 'form-populate';
  autoOpenGPS?: boolean;
  saving?: boolean;
}
interface GoogleAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export default function MapLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  onUseCurrentLocation,
  onAddManualAddress,
  savedLocations = [],
  onSelectSavedLocation,
  initialLocation,
  mode = 'standalone',
  autoOpenGPS = false,
  saving = false,
}: MapLocationPickerProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KrutrimAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedAddressDetails, setSelectedAddressDetails] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [permissionSettled, setPermissionSettled] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const sessionTokenRef = useRef<string>(getSessionToken());
  const [selectedCoords, setSelectedCoords] = useState<Coordinates>(() => {
    if (initialLocation) {
      console.log('🗺️ Using initialLocation:', initialLocation);
      return [initialLocation.longitude, initialLocation.latitude];
    }
    console.log('🗺️ Using DEFAULT_CENTER (Mumbai/Thane):', DEFAULT_CENTER);
    return DEFAULT_CENTER;
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<Coordinates>(() => {
    if (initialLocation) {
      return [initialLocation.longitude, initialLocation.latitude];
    }
    return DEFAULT_CENTER;
  });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<Coordinates | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [lastCameraUpdate, setLastCameraUpdate] = useState(0);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false); // Track surface stability

  const cameraRef = useRef<CameraController>(null);
  const mapMountedRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasTriggeredGPS = useRef(false);
  const isSelectingFromSearch = useRef(false);
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const previousCenterRef = useRef<Coordinates | null>(null);
  const previousZoomRef = useRef<number>(MAP_SETTINGS.defaultZoom);
  const cameraUpdateThrottleRef = useRef<NodeJS.Timeout>();
  const lastReverseGeocodeRef = useRef<number>(0);

  // FIX for Android: Track where we want the camera to go
  const targetCoordsRef = useRef<Coordinates | null>(null);
  const targetSetTimeRef = useRef<number>(0);

  // FIX for Android: Block geocoding for a period after GPS geocoding is done
  // This prevents subsequent idle events from overwriting the correct address
  const geocodingBlockedUntilRef = useRef<number>(0);

  // Set map as mounted when component mounts
  useEffect(() => {
    if (visible) {
      console.log('🗺️ MapLocationPicker visible - initializing map');
      // Increased delay for Android to ensure proper initialization
      const timer = setTimeout(() => {
        console.log('🗺️ Setting map as mounted and ready');
        mapMountedRef.current = true;
        setIsMapReady(true);

        // FIX: Wait for surface to stabilize before marking ready
        setTimeout(() => {
          setSurfaceReady(true);
          console.log('🗺️ Surface ready for interaction');
        }, 400);

        // Get user location after map is ready
        setTimeout(() => {
          getCurrentUserLocation();
        }, 600);
      }, Platform.OS === 'android' ? 800 : 500);

      return () => {
        console.log('🗺️ MapLocationPicker cleanup');
        clearTimeout(timer);
        if (regionChangeTimeoutRef.current) clearTimeout(regionChangeTimeoutRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        mapMountedRef.current = false;
        setSurfaceReady(false);
      };
    } else {
      console.log('🗺️ MapLocationPicker not visible - resetting state');
      mapMountedRef.current = false;
      setIsMapReady(false);
      setSurfaceReady(false);
      hasTriggeredGPS.current = false; // Reset GPS trigger flag
    }
  }, [visible]);

  useEffect(() => {
    if (visible && autoOpenGPS && isMapReady && !hasTriggeredGPS.current) {
      hasTriggeredGPS.current = true;
      handleUseCurrentLocation();
    }
  }, [visible, autoOpenGPS, isMapReady]);

  const getCurrentUserLocation = async () => {
    try {
      // Guard: don't update state if component has unmounted
      if (!mapMountedRef.current) return;

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        if (!mapMountedRef.current) return; // Re-check after async gap
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus === 'granted') {
        if (!mapMountedRef.current) return; // Re-check after async gap
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation, // Highest possible accuracy
          timeInterval: 1000,
          distanceInterval: 0,
        });
        // Final guard before setting state
        if (!mapMountedRef.current) return;
        const coords: Coordinates = [position.coords.longitude, position.coords.latitude];
        console.log('🗺️ User location for search bias:', coords, 'accuracy:', position.coords.accuracy, 'm');
        setCurrentUserLocation(coords);
      }
    } catch (error) {
      // Only log if component is still mounted (avoids NPE on destroyed context)
      if (mapMountedRef.current) {
        console.error('Could not get user location for search bias:', error);
      }
    }
  };

  // IMPROVED: Debounced search with proper cleanup
  useEffect(() => {
    if (searchQuery.trim().length < MAP_SETTINGS.searchMinCharacters) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(searchQuery);
    }, MAP_SETTINGS.searchDebounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // IMPROVED: Throttled search function (prevents rapid successive calls)
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      const url = buildKrutrimAutocompleteUrl(query);
      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        setSearchResults(data.predictions.map((item: any) => ({
          place_id: item.place_id,
          description: item.description,
          structured_formatting: item.structured_formatting,
        })));
        setShowResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Geocoding search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number,
    updateSearchBox: boolean = true,
    force: boolean = false
  ): Promise<KrutrimReverseGeocodeResult | null> => {
    if (isSelectingFromSearch.current && !force) return null;

    // Prevent multiple simultaneous reverse geocode calls
    if (isReverseGeocoding && !force) {
      console.log('🔄 Skipping reverse geocode - already in progress');
      return null;
    }

    // Throttle reverse geocode calls - minimum 2 seconds between calls
    const now = Date.now();
    if (!force && now - lastReverseGeocodeRef.current < 2000) {
      console.log('🔄 Skipping reverse geocode - throttled');
      return null;
    }
    lastReverseGeocodeRef.current = now;

    setIsReverseGeocoding(true);

    try {
      // Use Google Geocoding API with result_type and location_type filters for rooftop precision
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=street_address|premise|subpremise&location_type=ROOFTOP|RANGE_INTERPOLATED&key=${GOOGLE_API_KEY}`;
      console.log('🏢 Requesting rooftop-level address for:', { latitude, longitude });

      const response = await fetch(url);
      const data = await response.json();

      console.log('🏢 Google Geocode response status:', data.status);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Prioritize results by location_type accuracy
        const rooftopResult = data.results.find((r: any) => r.geometry?.location_type === 'ROOFTOP');
        const rangeResult = data.results.find((r: any) => r.geometry?.location_type === 'RANGE_INTERPOLATED');
        const result = rooftopResult || rangeResult || data.results[0];

        console.log('🏢 Found address with location_type:', result.geometry?.location_type);
        console.log('🏢 Address:', result.formatted_address);

        if (updateSearchBox) {
          setSelectedAddress(result.formatted_address);
        }
        setSelectedAddressDetails(result); // Store Google structure

        return result;
      }

      // Fallback: Try without filters to get any nearby address
      // This handles ZERO_RESULTS, and also any other non-OK status
      console.log('🏢 No rooftop result (status:', data.status, '), trying broader search...');
      const fallbackUrl = buildGoogleReverseGeocodeUrl(latitude, longitude);
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();

      console.log('🏢 Fallback geocode response status:', fallbackData.status);

      if (fallbackData.status === 'OK' && fallbackData.results && fallbackData.results.length > 0) {
        const result = fallbackData.results[0];
        console.log('🏢 Fallback address found:', result.formatted_address);

        if (updateSearchBox) {
          setSelectedAddress(result.formatted_address);
        }
        setSelectedAddressDetails(result);
        return result;
      }

      console.warn('🏢 Google Reverse Geocode failed/empty. Status:', fallbackData.status);
      if (updateSearchBox) setSelectedAddress("Pinned Location");
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      if (updateSearchBox) setSelectedAddress("Pinned Location");
      return null;
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${KRUTRIM_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.geometry && data.result.geometry.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  };

  const handleResultSelect = async (result: KrutrimAutocompleteResult) => {
    // ✅ Search bar shows what the user tapped from suggestions
    setSearchQuery(result.description);
    setShowResults(false);
    Keyboard.dismiss();

    isSelectingFromSearch.current = true;
    setIsSearching(true);

    try {
      const url = buildKrutrimPlaceDetailsUrl(result.place_id);
      console.log('🔍 Fetching place details from:', url);

      const response = await fetch(url);
      const data = await response.json();
      console.log('📍 Place details response:', data);

      const locationData = data.result?.geometry?.location;
      const formattedAddress = data.result?.formatted_address || result.description;

      if (locationData) {
        const coords: Coordinates = [locationData.lng, locationData.lat];
        console.log('🗺️ Moving map to coordinates:', coords);

        setSelectedCoords(coords);
        setMarkerCoords(coords);
        previousCenterRef.current = coords;

        // ✅ Pickup field gets the detailed address
        setSelectedAddress(formattedAddress);
        setSelectedAddressDetails(data.result);

        if (!mapMountedRef.current) {
          console.warn('🗺️ Map not mounted, skipping camera update');
          return;
        }

        // Wait for map to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // FIX for Android: Set target coordinates and geocoding block
        if (Platform.OS === 'android') {
          geocodingBlockedUntilRef.current = Date.now() + 30000; // 30 second block
          targetCoordsRef.current = coords;
          targetSetTimeRef.current = Date.now();
          console.log('🔒 Geocoding blocked for 30 seconds - search result selected');
          console.log('🎯 Set target coords for search result:', coords);
        }

        // Move to location with default zoom (only when searching)
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: MAP_SETTINGS.defaultZoom,
          animationDuration: MAP_SETTINGS.animationDuration,
        });

        setTimeout(() => {
          isSelectingFromSearch.current = false;
          setIsSearching(false);
        }, MAP_SETTINGS.animationDuration + (Platform.OS === 'android' ? 1200 : 800));
      } else {
        console.error('❌ No location data in place details response');
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Could not find coordinates for this location',
        });
      }
    } catch (error) {
      console.error('❌ Error resolving Krutrim place:', error);
      Toast.show({
        type: 'error',
        text1: 'Search Error',
        text2: 'Failed to load location details',
      });
      isSelectingFromSearch.current = false;
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    // FIX: Don't proceed if surface isn't stable yet
    if (!isMapReady || !mapMountedRef.current || !surfaceReady) {
      console.warn('🗺️ Map not ready yet, waiting...');
      Toast.show({
        type: 'info',
        text1: 'Please wait',
        text2: 'Map is still loading...',
        visibilityTime: 2000,
      });
      return;
    }

    setIsLoadingLocation(true);
    setShowActionMenu(false);

    // mark as selecting so other handlers don't step on us
    isSelectingFromSearch.current = true;

    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = newStatus;
      }

      if (finalStatus !== 'granted') {
        console.error('GPS permission denied by user');
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Location permission is needed to use this feature.',
          visibilityTime: 5000,
        });
        isSelectingFromSearch.current = false;
        setIsLoadingLocation(false);
        return;
      }
      if (finalStatus === 'granted') {
        setPermissionSettled(true);

        // FIX: Give Android time to stabilize after permission grant
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation, // Highest possible accuracy
          timeInterval: 1000,
          distanceInterval: 0,
        });

        const coords: Coordinates = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        console.log('🗺️ Got GPS location:', coords);
        console.log('🗺️ GPS accuracy:', position.coords.accuracy, 'meters');
        console.log('🗺️ GPS altitude:', position.coords.altitude, 'meters');

        setSelectedCoords(coords);
        setMarkerCoords(coords);
        setCurrentUserLocation(coords);
        previousCenterRef.current = coords;

        // FIX for Android: Set geocoding block IMMEDIATELY - before any async operations
        // This ensures map idle events can't overwrite the address while we're geocoding
        if (Platform.OS === 'android') {
          geocodingBlockedUntilRef.current = Date.now() + 30000; // 30 second block
          targetCoordsRef.current = coords;
          targetSetTimeRef.current = Date.now();
          console.log('🔒 Geocoding blocked for 30 seconds - GPS location received');
          console.log('🎯 Set target coords for Android:', coords);
        }

        // Double-check map is mounted before camera update
        if (!mapMountedRef.current) {
          console.warn('🗺️ Map not mounted after GPS, skipping camera update');
          isSelectingFromSearch.current = false;
          setIsLoadingLocation(false);
          return;
        }

        // FIX for Android: Longer delay before camera movement after permission
        const cameraDelay = Platform.OS === 'android' ? 800 : 600;
        await new Promise(resolve => setTimeout(resolve, cameraDelay));

        console.log('🗺️ Setting camera to GPS coords:', coords);

        // Use setCamera for consistent programmatic movement (with default zoom for GPS)
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: MAP_SETTINGS.defaultZoom, // Set zoom for GPS location
          animationDuration: MAP_SETTINGS.animationDuration,
        });

        // FIX for Android: Retry camera movement to ensure it takes effect
        if (Platform.OS === 'android') {
          setTimeout(() => {
            console.log('🗺️ Android: Retrying camera movement to GPS coords:', coords);
            cameraRef.current?.setCamera({
              centerCoordinate: coords,
              zoomLevel: MAP_SETTINGS.defaultZoom,
              animationDuration: 500,
            });
          }, MAP_SETTINGS.animationDuration + 200);
        }

        // Force reverse geocode even though isSelectingFromSearch is true
        await reverseGeocode(coords[1], coords[0], true, true);

        console.log('✅ GPS address set successfully');

        // small delay then allow other handlers again
        setTimeout(() => {
          isSelectingFromSearch.current = false;
        }, MAP_SETTINGS.animationDuration + (Platform.OS === 'android' ? 1500 : 500));
      } catch (gpsError: any) {
        console.error('GPS location acquisition error:', gpsError);
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Failed to get your current location.',
          visibilityTime: 6000,
        });
        isSelectingFromSearch.current = false;
        setIsLoadingLocation(false);
        return;
      }
    } catch (error: any) {
      console.error('GPS permission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Failed to request location permission.',
        visibilityTime: 5000,
      });
      isSelectingFromSearch.current = false;
    } finally {
      setIsLoadingLocation(false);
    }
  };
  const handleMapPress = async (coords: Coordinates) => {
    if (!isMapReady) return;

    isSelectingFromSearch.current = true;

    setSelectedCoords(coords);
    setMarkerCoords(coords);
    previousCenterRef.current = coords;

    if (!mapMountedRef.current) return;

    // FIX for Android: Set target coordinates so handleMapIdle knows where we want to end up
    if (Platform.OS === 'android') {
      targetCoordsRef.current = coords;
      targetSetTimeRef.current = Date.now();
      // Clear geocoding block - user intentionally chose a new location
      geocodingBlockedUntilRef.current = 0;
      console.log('🔓 Geocoding unblocked - user tapped on map');
    }

    // Move camera to pressed location WITHOUT forcing zoom
    cameraRef.current?.setCamera({
      centerCoordinate: coords,
      animationDuration: 300,
      // No zoomLevel - keep current zoom
    });

    await reverseGeocode(coords[1], coords[0]);

    setTimeout(() => {
      isSelectingFromSearch.current = false;
      // Clear target on Android after timeout
      if (Platform.OS === 'android') {
        targetCoordsRef.current = null;
      }
    }, Platform.OS === 'android' ? 1000 : 800);
  };

  // Update marker to follow map center - OPTIMIZED with minimal updates
  const handleCameraChanged = (coords: Coordinates) => {
    if (isSelectingFromSearch.current) {
      return;
    }

    // Clear any active blocks immediately when user interacts
    // This allows smooth panning and zooming
    if (targetCoordsRef.current || geocodingBlockedUntilRef.current > 0) {
      targetCoordsRef.current = null;
      geocodingBlockedUntilRef.current = 0;
    }

    // Update marker position (no throttle for smooth following)
    setMarkerCoords(coords);
    setSelectedCoords(coords);
  };

  // Trigger reverse geocode ONLY when user stops moving the map
  const handleMapIdle = async (coords: Coordinates) => {
    if (isSelectingFromSearch.current || isUserTyping) {
      return; // Silent return for performance
    }

    // FIX for Android: Check if geocoding is blocked (after GPS location was set)
    if (Platform.OS === 'android' && geocodingBlockedUntilRef.current > Date.now()) {
      return; // Silent return for performance
    }

    // FIX for Android: If we have an active target, check if we reached it
    if (targetCoordsRef.current) {
      const target = targetCoordsRef.current;
      const distanceToTarget = Math.sqrt(
        Math.pow(coords[0] - target[0], 2) +
        Math.pow(coords[1] - target[1], 2)
      );

      // ~200 meters threshold - if idle position is far from target, retry camera movement
      if (distanceToTarget > 0.002) {
        const timeSinceTarget = Date.now() - targetSetTimeRef.current;

        // Only retry if we set target recently (within 10 seconds)
        if (timeSinceTarget < 10000) {
          // Map idle at wrong position - retry camera movement

          // Don't update marker to wrong position - keep it at target
          setMarkerCoords(target);
          setSelectedCoords(target);

          // Retry camera movement with more force
          setTimeout(() => {
            cameraRef.current?.setCamera({
              centerCoordinate: target,
              zoomLevel: MAP_SETTINGS.defaultZoom,
              animationDuration: 800,
            });
          }, 200);

          return; // Don't process this idle event - the address is already set correctly
        } else {
          // Target expired, clear it but use the target coords as final position
          // Keep the target position instead of accepting wrong position
          setMarkerCoords(target);
          setSelectedCoords(target);
          previousCenterRef.current = target;
          targetCoordsRef.current = null;
          // Don't trigger reverse geocode - we already have the right address from GPS
          return;
        }
      } else {
        // We reached the target!
        targetCoordsRef.current = null; // Clear target
      }
    }

    // Update marker position to match final map center
    setMarkerCoords(coords);
    setSelectedCoords(coords);

    // Check if center has significantly changed (not just zoom)
    // Threshold: ~50 meters to avoid unnecessary API calls
    const hasSignificantMove = !previousCenterRef.current ||
      Math.abs(coords[0] - previousCenterRef.current[0]) > 0.0005 || // ~50 meters
      Math.abs(coords[1] - previousCenterRef.current[1]) > 0.0005;

    // Only reverse geocode if the map actually moved significantly
    if (hasSignificantMove) {
      // Clear existing timeout
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }

      // Debounce: Wait 600ms after user stops moving map (reduced from 800ms)
      regionChangeTimeoutRef.current = setTimeout(async () => {
        await reverseGeocode(coords[1], coords[0], true);
        previousCenterRef.current = coords; // Update tracked position
      }, 600);
    } // Else: zoom only or small movement - skip geocoding
  };

  const handleRecenterToMarker = () => {
    // Recenter without changing zoom level
    cameraRef.current?.flyTo(markerCoords, MAP_SETTINGS.animationDuration);
  };

  const handleConfirmLocation = async () => {
    const [longitude, latitude] = markerCoords;

    // Always fetch fresh location data on confirm
    let result = selectedAddressDetails
    if (!result) result = await reverseGeocode(latitude, longitude, false);

    let locationResult: LocationResult = {
      latitude,
      longitude,
      address: searchQuery || 'Selected Location',
      city: 'Unknown',
      state: 'Unknown',
      pincode: '000000',
      area: 'Unknown',
    };

    if (result) {
      const components = result.address_components;

      const find = (type: string) =>
        components.find((c) => c.types.includes(type))?.long_name;

      locationResult.address = result.formatted_address;
      locationResult.city =
        find('locality') || find('administrative_area_level_3') || 'Unknown';
      locationResult.state = find('administrative_area_level_1') || 'Unknown';
      locationResult.pincode = find('postal_code') || '000000';
      locationResult.area =
        find('sublocality_level_1') || find('neighborhood') || 'Unknown';
    }

    onLocationSelect(locationResult);
    onClose();
  };

  const dismissResults = () => {
    setShowResults(false);
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Pickup location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Container - Full Screen */}
        <View style={styles.mapContainer}>
          {/* FIX: Only render map after surface is ready AND permission settled */}
          {isMapReady && surfaceReady ? (
            <>
              <MapViewWrapper
                center={selectedCoords}
                marker={markerCoords}
                zoom={MAP_SETTINGS.defaultZoom}
                onMapPress={handleMapPress}
                onRegionChange={handleCameraChanged}
                onRegionChangeEnd={handleMapIdle}
                cameraRef={cameraRef}
                style={styles.map}
              />

              {/* Tooltip above map center - positioned absolutely */}
              <View style={styles.tooltipContainer} pointerEvents="none">
                <View style={styles.pinTooltip}>
                  <Text style={styles.tooltipText}>Pickup point for agent</Text>
                  <Text style={styles.tooltipSubtext}>Move the map to change location</Text>
                  <View style={styles.tooltipArrow} />
                </View>
              </View>

              {/* Search Bar Overlay */}
              <View style={styles.searchOverlay}>
                <View style={styles.searchBar}>
                  <Search size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Try Powai, Borivali West etc..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setIsUserTyping(true);

                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

                      // Mark as "not typing" after 2 seconds of inactivity
                      typingTimeoutRef.current = setTimeout(() => {
                        setIsUserTyping(false);
                      }, 2000);
                    }}
                    onFocus={() => setIsUserTyping(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsUserTyping(false);
                      }, 300);
                    }}
                    autoCorrect={false}
                  />
                  {isSearching && <ActivityIndicator size="small" color="#16a34a" />}
                </View>

                {/* Search Results */}
                {showResults && searchResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.place_id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.resultItem}
                          onPress={() => handleResultSelect(item)}
                        >
                          <MapPin size={18} color="#6b7280" />
                          <Text style={styles.resultText} numberOfLines={2}>
                            {item.description}
                          </Text>
                        </TouchableOpacity>
                      )}
                      style={styles.resultsList}
                      keyboardShouldPersistTaps="handled"
                    />
                  </View>
                )}
              </View>

              {/* Use Current Location Button */}
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <Navigation size={18} color="#16a34a" />
                )}
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.addressContainer}>
            <View style={styles.addressIconContainer}>
              <MapPin size={20} color="#ffffff" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {selectedAddress ? "Pickup Location" : "Select Location"}
              </Text>
              <Text style={styles.addressSubtitle} numberOfLines={2}>
                {selectedAddress || "Move the pin to select your delivery location"}
              </Text>
            </View>
            {searchQuery && (
              <TouchableOpacity onPress={() => setShowActionMenu(!showActionMenu)}>
                <Text style={styles.changeButton}>CHANGE</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              saving && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmLocation}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Set Pickup Location
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Menu Modal */}
        {showActionMenu && (
          <Modal
            visible={showActionMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowActionMenu(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowActionMenu(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.actionMenu}>
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={handleUseCurrentLocation}
                      disabled={isLoadingLocation}
                    >
                      <Navigation size={20} color="#16a34a" />
                      <Text style={styles.actionMenuText}>Use Current Location</Text>
                    </TouchableOpacity>

                    {savedLocations.length > 0 && onSelectSavedLocation && (
                      <>
                        <View style={styles.actionMenuDivider} />
                        <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
                        {savedLocations.map((location) => (
                          <TouchableOpacity
                            key={location.id}
                            style={styles.savedLocationItem}
                            onPress={() => {
                              onSelectSavedLocation(location);
                              setShowActionMenu(false);
                            }}
                          >
                            <MapPin size={18} color="#6b7280" />
                            <View style={styles.savedLocationTextContainer}>
                              <Text style={styles.savedLocationLabel}>{location.label}</Text>
                              <Text style={styles.savedLocationAddress} numberOfLines={1}>
                                {location.city}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </>
                    )}

                    {onAddManualAddress && (
                      <>
                        <View style={styles.actionMenuDivider} />
                        <TouchableOpacity
                          style={styles.actionMenuItem}
                          onPress={() => {
                            setShowActionMenu(false);
                            onAddManualAddress();
                          }}
                        >
                          <Plus size={20} color="#16a34a" />
                          <Text style={styles.actionMenuText}>Add Manual Address</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginRight: -40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f9fafb', // Fallback background color
    minHeight: 300, // Ensure minimum height for Android
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  map: {
    flex: 1,
  },
  // Search Bar Overlay on Map
  searchOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    maxHeight: 300,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  // Tooltip positioned above map center
  tooltipContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -110 }, { translateY: -100 }], // Center and position above marker
    alignItems: 'center',
    zIndex: 5,
  },
  pinTooltip: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipSubtext: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#111827',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  footer: {
    backgroundColor: '#1f2937', // Dark grey background
    borderTopWidth: 1,
    borderTopColor: '#374151',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#374151', // Slightly lighter dark grey for the container
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff', // Bold white
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  addressSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  changeButton: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ade80',
    paddingTop: 2,
    letterSpacing: 0.5,
  },
  confirmButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '800', // Bold white
    color: '#1f2937', // Dark text on white button
    letterSpacing: -0.3,
  },
  confirmButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Action Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionMenuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  savedLocationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  savedLocationTextContainer: {
    flex: 1,
  },
  savedLocationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  savedLocationAddress: {
    fontSize: 12,
    color: '#6b7280',
  },
});