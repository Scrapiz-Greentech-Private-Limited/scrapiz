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
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { X, MapPin, Navigation, Search, Plus, Crosshair } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  DEFAULT_MAP_STYLE,
  getIndiaBounds,
  MAPBOX_API_KEY,
  buildGeocodingUrl,
  buildReverseGeocodingUrl,
  MAP_SETTINGS,
  DEFAULT_CENTER,
  KRUTRIM_API_KEY,
  MAP_STYLES,
} from '../config/mapConfig';

MapboxGL.setAccessToken(MAPBOX_API_KEY);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KrutrimAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
    initialLocation ? [initialLocation.longitude, initialLocation.latitude] : DEFAULT_CENTER
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<[number, number]>(selectedCoords);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<[number, number] | null>(null);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasTriggeredGPS = useRef(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsMapReady(true), 300);
      // Get user's current location for search bias
      getCurrentUserLocation();
      return () => clearTimeout(timer);
    } else {
      // Complete modal state cleanup when modal closes
      setIsMapReady(false);
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setShowActionMenu(false);
      setIsSearching(false);
      setIsLoadingLocation(false);
      
      // Reset marker coordinates to initial position
      const initialCoords: [number, number] = initialLocation 
        ? [initialLocation.longitude, initialLocation.latitude] 
        : DEFAULT_CENTER;
      setMarkerCoords(initialCoords);
      setSelectedCoords(initialCoords);
      
      // Reset GPS trigger flag when modal closes
      hasTriggeredGPS.current = false;
      
      // Clear any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = undefined;
      }
    }
  }, [visible, initialLocation]);

  // Auto-trigger GPS when autoOpenGPS is true
  useEffect(() => {
    if (visible && autoOpenGPS && isMapReady && !hasTriggeredGPS.current) {
      hasTriggeredGPS.current = true;
      handleUseCurrentLocation();
    }
  }, [visible, autoOpenGPS, isMapReady]);

  const getCurrentUserLocation = async () => {
    try {
      // Check permission status first
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Only request if not already granted
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = newStatus;
      }
      
      if (finalStatus === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentUserLocation([position.coords.longitude, position.coords.latitude]);
      } else {
        console.error('Location permission not granted for search bias');
      }
    } catch (error) {
      console.error('Could not get user location for search bias:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length < MAP_SETTINGS.searchMinCharacters) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(searchQuery);
    }, MAP_SETTINGS.searchDebounceMs);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      // Use current user location or marker location for proximity bias
      const proximityCoords = currentUserLocation || markerCoords;
      
      const url = buildGeocodingUrl(query, {
        proximity: proximityCoords,
        limit: 5,
        bbox: getIndiaBounds(),
      });
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions) {
        setSearchResults(data.predictions);
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
    longitude: number
  ): Promise<KrutrimReverseGeocodeResult | null> => {
    // Set loading state to true before async operation starts
    setIsSearching(true);
    
    try {
      const url = buildReverseGeocodingUrl(longitude, latitude);
      const response = await fetch(url);
      
      // Check if response is ok
      if (!response.ok) {
        console.error('Reverse geocoding API error:', response.status, response.statusText);
        setSearchQuery('Location selected - please add details manually');
        return null;
      }
      
      const data = await response.json();

      // Handle null or undefined data
      if (!data || data === null || data === undefined) {
        console.error('Reverse geocoding returned null/undefined response');
        setSearchQuery('Location selected - please add details manually');
        return null;
      }

      // Handle case where results array exists and has data
      if (data.results && data.results.length > 0) {
        const result = data.results[0] as KrutrimReverseGeocodeResult;
        setSearchQuery(result.formatted_address);
        return result;
      }
      
      // Handle case where no results are returned - allow user to proceed with manual entry
      console.error('Reverse geocoding returned no results for coordinates:', latitude, longitude);
      setSearchQuery('Location selected - please add details manually');
      return null;
    } catch (error) {
      // Log geocoding errors to console for debugging
      console.error('Reverse geocoding error:', error);
      
      // Display placeholder text when geocoding fails - allows user to proceed with manual address entry
      setSearchQuery('Location selected - address unavailable');
      return null;
    } finally {
      // Set loading state to false after operation completes (success or error)
      setIsSearching(false);
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
    setSearchQuery(result.description);
    setShowResults(false);
    Keyboard.dismiss();

    // Set loading state to true before async operation starts
    setIsSearching(true);
    
    try {
      // Get place details to get coordinates
      const placeDetails = await getPlaceDetails(result.place_id);
      
      if (placeDetails) {
        const coords: [number, number] = [placeDetails.lng, placeDetails.lat];
        setSelectedCoords(coords);
        setMarkerCoords(coords);
        cameraRef.current?.flyTo(coords, MAP_SETTINGS.animationDuration);
        await reverseGeocode(placeDetails.lat, placeDetails.lng);
      } else {
        console.warn('Could not get coordinates for selected place');
        // Set loading state to false on error
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error selecting result:', error);
      // Set loading state to false on error
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setShowActionMenu(false);
    try {
      // Check current permission status before requesting
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Only request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = newStatus;
      }
      
      // Handle permission denial
      if (finalStatus !== 'granted') {
        console.error('GPS permission denied by user');
        
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Location permission is needed to use this feature. Please enable location access in your device settings.',
          visibilityTime: 5000,
        });
        
        setIsLoadingLocation(false);
        return;
      }

      // Acquire GPS location - wrapped in try-catch for error handling
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        setSelectedCoords(coords);
        setMarkerCoords(coords);
        setCurrentUserLocation(coords);

        cameraRef.current?.flyTo(coords, MAP_SETTINGS.animationDuration);
        await reverseGeocode(coords[1], coords[0]);
      } catch (gpsError: any) {
        // GPS acquisition failed - provide detailed error handling
        console.error('GPS location acquisition error:', gpsError);
        
        // Provide user-friendly error message based on error type
        let errorTitle = 'Location Error';
        let errorMessage = 'Failed to get your current location. Tap to retry or select location manually on the map.';
        
        if (gpsError.message?.includes('Location request failed') || gpsError.message?.includes('Location services')) {
          errorTitle = 'GPS Unavailable';
          errorMessage = 'Could not obtain your location. Please ensure GPS is enabled in your device settings. Tap to retry.';
        } else if (gpsError.message?.includes('timeout') || gpsError.message?.includes('timed out')) {
          errorTitle = 'Location Timeout';
          errorMessage = 'Location request timed out. Please ensure you have a clear view of the sky. Tap to retry.';
        } else if (gpsError.message?.includes('permission')) {
          errorTitle = 'Permission Error';
          errorMessage = 'Location permission error occurred. Please check your device settings. Tap to retry.';
        }
        
        // Display error with retry option
        Toast.show({
          type: 'error',
          text1: errorTitle,
          text2: errorMessage,
          visibilityTime: 6000,
          onPress: () => {
            // Retry GPS acquisition when user taps the toast
            Toast.hide();
            handleUseCurrentLocation();
          },
        });
        
        // Set loading state to false on error
        setIsLoadingLocation(false);
        return;
      }
    } catch (error: any) {
      // Permission-related errors
      console.error('GPS permission error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Failed to request location permission. Please check your device settings.',
        visibilityTime: 5000,
      });
    } finally {
      // Always set loading state to false
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as [number, number];
      setSelectedCoords(coords);
      setMarkerCoords(coords);
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: 300,
      });
      await reverseGeocode(coords[1], coords[0]);
    }
  };

  // Handle map region change to update center pin location
  const handleRegionDidChange = async () => {
    if (!mapRef.current) return;
    
    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords: [number, number] = [center[0], center[1]];
        setMarkerCoords(coords);
        setSelectedCoords(coords);
        // Debounce reverse geocoding
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
          reverseGeocode(coords[1], coords[0]);
        }, 500);
      }
    } catch (error) {
      console.error('Error getting map center:', error);
    }
  };

  const handleRecenterToMarker = () => {
    cameraRef.current?.flyTo(markerCoords, MAP_SETTINGS.animationDuration);
  };

  const handleConfirmLocation = async () => {
    const [longitude, latitude] = markerCoords;

    const result = await reverseGeocode(latitude, longitude);

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

    // In form-populate mode, just return the location data without saving to backend
    // In standalone mode, the parent component handles the backend save
    onLocationSelect(locationResult);
    onClose();
  };

  const dismissResults = () => {
    setShowResults(false);
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select delivery location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Try Powai, Borivali West etc..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#d946ef" />}
          </View>
        </View>

        {/* Map Wrapper */}
        <TouchableWithoutFeedback onPress={dismissResults}>
          <View style={styles.mapWrapper}>
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

            {/* Map */}
            <View style={styles.mapContainer}>
              {isMapReady ? (
                <>
                  <MapboxGL.MapView
                    ref={mapRef}
                    style={styles.map}
                    styleURL={DEFAULT_MAP_STYLE}
                    onPress={handleMapPress}
                    onRegionDidChange={handleRegionDidChange}
                    logoEnabled={false}
                    attributionEnabled={true}
                    attributionPosition={{ bottom: 8, left: 8 }}
                  >
                    <MapboxGL.Camera
                      ref={cameraRef}
                      centerCoordinate={selectedCoords}
                      zoomLevel={MAP_SETTINGS.defaultZoom}
                      animationMode="flyTo"
                      animationDuration={MAP_SETTINGS.animationDuration}
                    />
                  </MapboxGL.MapView>

                  {/* Center Pin Marker - Fixed in center */}
                  <View style={styles.centerMarkerContainer} pointerEvents="none">
                    <View style={styles.pinTooltip}>
                      <Text style={styles.tooltipText}>Order will be delivered here</Text>
                      <Text style={styles.tooltipSubtext}>Move the pin to change location</Text>
                      <View style={styles.tooltipArrow} />
                    </View>
                    <View style={styles.pinMarker}>
                      <MapPin size={36} color="#ef4444" fill="#ef4444" strokeWidth={2} />
                    </View>
                    <View style={styles.pinShadow} />
                  </View>

                  {/* Use Current Location Button */}
                  <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={handleUseCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? (
                      <ActivityIndicator size="small" color="#d946ef" />
                    ) : (
                      <Navigation size={18} color="#d946ef" />
                    )}
                    <Text style={styles.currentLocationText}>Use Current Location</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.mapLoadingContainer}>
                  <ActivityIndicator size="large" color="#d946ef" />
                  <Text style={styles.loadingText}>Loading map...</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.addressContainer}>
            <MapPin size={20} color="#111827" />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {searchQuery ? searchQuery.split(',')[0] : 'Select Location'}
              </Text>
              <Text style={styles.addressSubtitle} numberOfLines={2}>
                {searchQuery || 'Move the pin to select your delivery location'}
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
              (!searchQuery || saving) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmLocation}
            disabled={!searchQuery || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[
                styles.confirmButtonText,
                !searchQuery && styles.confirmButtonTextDisabled,
              ]}>
                Confirm location
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
                      <Navigation size={20} color="#d946ef" />
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
                          <Plus size={20} color="#d946ef" />
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
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginRight: -40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  mapWrapper: {
    flex: 1,
  },
  resultsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    maxHeight: 300,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  mapContainer: {
    flex: 1,
    position: 'relative',
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
  // Center Pin Marker (Fixed in center of screen)
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -80,
    alignItems: 'center',
    zIndex: 10,
  },
  pinTooltip: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
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
  pinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: '#000000',
    opacity: 0.2,
    marginTop: 2,
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
    color: '#d946ef',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  changeButton: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d946ef',
    paddingTop: 2,
  },
  confirmButton: {
    backgroundColor: '#d946ef',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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