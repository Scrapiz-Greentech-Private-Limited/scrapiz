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
import { X, MapPin, Navigation, Search, Plus } from 'lucide-react-native';
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
  buildGoogleAutocompletePayload,
  buildGooglePlaceDetailsPayload,
  GOOGLE_API_KEY,
  getSessionToken,
  buildKrutrimAutocompleteUrl,
  buildGoogleReverseGeocodeUrl,
  buildKrutrimPlaceDetailsUrl
} from '../../config/mapConfig';

// Debug: Log Mapbox token (first 20 chars only for security)
console.log('Mapbox Token:', MAPBOX_API_KEY ? `${MAPBOX_API_KEY.substring(0, 20)}...` : 'MISSING');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KrutrimAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedAddressDetails, setSelectedAddressDetails] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const sessionTokenRef = useRef<string>(getSessionToken());
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
    initialLocation ? [initialLocation.longitude, initialLocation.latitude] : DEFAULT_CENTER
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<[number, number]>(selectedCoords);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<[number, number] | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapMountedRef = useRef(false);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasTriggeredGPS = useRef(false);
  const isSelectingFromSearch = useRef(false);
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const previousCenterRef = useRef<[number, number] | null>(null);
  const zoomOnlyTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (visible && !isMapReady) {
        const timer = setTimeout(() => {
        setIsMapReady(true);
        getCurrentUserLocation();
    }, 300);

    return () => clearTimeout(timer);
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
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = newStatus;
      }
      
      if (finalStatus === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setCurrentUserLocation([position.coords.longitude, position.coords.latitude]);
      }
    } catch (error) {
      console.error('Could not get user location for search bias:', error);
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
     }else{
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
    force:boolean = false
  ): Promise<KrutrimReverseGeocodeResult | null> => {
    if (isSelectingFromSearch.current && !force) return null;
  
    
    try {
      // Use Google Geocoding API instead of Krutrim
      const url = buildGoogleReverseGeocodeUrl(latitude, longitude);
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        setSelectedAddress(result.formatted_address);
        setSelectedAddressDetails(result); // Store Google structure
        
        // if (updateSearchBox) {
        //   setSearchQuery(result.formatted_address);
        // }
      } else {
        console.warn('Google Reverse Geocode failed/empty');
        if (updateSearchBox) setSelectedAddress("Pinned Location");
      }
      
      }
    catch (error) {
      console.error('Reverse geocoding error:', error); 
    } finally {
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
  // ✅ Search bar shows what the user tapped from suggestions
  setSearchQuery(result.description);
  setShowResults(false);
  Keyboard.dismiss();

  isSelectingFromSearch.current = true;
  setIsSearching(true);

  try {
    const url = buildKrutrimPlaceDetailsUrl(result.place_id);
    const response = await fetch(url);
    const data = await response.json();
    const locationData = data.result?.geometry?.location;
    const formattedAddress = data.result?.formatted_address || result.description;

    if (locationData) {
      const coords: [number, number] = [locationData.lng, locationData.lat];

      setSelectedCoords(coords);
      setMarkerCoords(coords);
      previousCenterRef.current = coords;

      // ✅ Pickup field gets the detailed address
      setSelectedAddress(formattedAddress);
      setSelectedAddressDetails(data.result);
    if (!mapMountedRef.current) return;
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: MAP_SETTINGS.animationDuration,
      });

      setTimeout(() => {
        isSelectingFromSearch.current = false;
        setIsSearching(false);
      }, MAP_SETTINGS.animationDuration + 800);
    }
  } catch (error) {
    console.error('Error resolving Krutrim place:', error);
    isSelectingFromSearch.current = false;
  } finally {
    setIsSearching(false);
  }
};

 const handleUseCurrentLocation = async () => {
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

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];

      setSelectedCoords(coords);
      setMarkerCoords(coords);
      setCurrentUserLocation(coords);
      previousCenterRef.current = coords;
      if (!mapMountedRef.current) return;
      // Use setCamera for consistent programmatic movement
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: MAP_SETTINGS.animationDuration,
      });

      // Force reverse geocode even though isSelectingFromSearch is true
      await reverseGeocode(coords[1], coords[0], true, true);

      // small delay then allow other handlers again
      setTimeout(() => {
        isSelectingFromSearch.current = false;
      }, MAP_SETTINGS.animationDuration + 500);
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
  const handleMapPress = async (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as [number, number];
      
      isSelectingFromSearch.current = true;
      
      setSelectedCoords(coords);
      setMarkerCoords(coords);
      previousCenterRef.current = coords; // Track this position
      if (!mapMountedRef.current) return;
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: 300,
      });
      await reverseGeocode(coords[1], coords[0]);
      
      setTimeout(() => {
        isSelectingFromSearch.current = false;
      }, 800);
    }
  };

  // IMPROVED: Only update marker position, don't reverse geocode yet
  const handleCameraChanged = async () => {
    if (isSelectingFromSearch.current) {
      return;
    }
    
    if (!mapRef.current) return;
    
    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords: [number, number] = [center[0], center[1]];
        setMarkerCoords(coords);
        setSelectedCoords(coords);
      }
    } catch (error) {
      console.error('Error getting map center:', error);
    }
  };

  // FIX: Detect if this is a zoom-only operation
  const handleMapIdle = async () => {
    if (isSelectingFromSearch.current || isUserTyping) return;
    
    if (!mapRef.current) return;
    
    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords: [number, number] = [center[0], center[1]];
        
        // NEW: Check if center has significantly changed (not just zoom)
        // Reduced threshold from ~11m to ~2m for more precise location
        const hasSignificantMove = !previousCenterRef.current || 
          Math.abs(coords[0] - previousCenterRef.current[0]) > 0.00002 || // ~2 meters
          Math.abs(coords[1] - previousCenterRef.current[1]) > 0.00002;
        
        // Only reverse geocode if the map actually moved (pan), not just zoomed
        if (hasSignificantMove) {
          // Clear existing timeout
          if (regionChangeTimeoutRef.current) {
            clearTimeout(regionChangeTimeoutRef.current);
          }
          
          // Debounce: Wait 600ms after user stops moving map (reduced from 800ms)
          regionChangeTimeoutRef.current = setTimeout(() => {
            // Update both selectedAddress and searchQuery when manually dragging
            reverseGeocode(coords[1], coords[0], true);
            previousCenterRef.current = coords; // Update tracked position
          }, 600);
        }
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

    // Always fetch fresh location data on confirm
    let result = selectedAddressDetails
    if(!result) result = await reverseGeocode(latitude, longitude, false);

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
   
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Pickup location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Container - Full Screen */}
        <View style={styles.mapContainer}>
              <MapboxGL.MapView
                ref={mapRef}
                surfaceView={Platform.OS === "android"}
                style={styles.map}
                styleURL={DEFAULT_MAP_STYLE}
                onPress={handleMapPress}
                onCameraChanged={handleCameraChanged}
                onMapIdle={handleMapIdle}
                logoEnabled={false}
                onDidFinishRenderingMapFully={()=>{
                    mapMountedRef.current = true;
                }}
                attributionEnabled={true}
                attributionPosition={{ bottom: 8, left: 8 }}
                onMapLoadingError={(e)=>{
                   console.error('Mapbox error:', e?.message ?? e);
                }}
              >
                <MapboxGL.Camera
                  ref={cameraRef}
                  centerCoordinate={selectedCoords}
                  zoomLevel={MAP_SETTINGS.defaultZoom}
                  animationMode="flyTo"
                  animationDuration={MAP_SETTINGS.animationDuration}
                />
                <MapboxGL.PointAnnotation id="selected-marker" coordinate={markerCoords}>
          <View style={styles.markerOuter}>
        <View style={styles.markerInner} />
            </View>
            </MapboxGL.PointAnnotation>
              </MapboxGL.MapView>

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

              {/* Center Tooltip Only (no pin marker) */}
              <View style={styles.centerTooltipContainer} pointerEvents="none">
                <View style={styles.pinTooltip}>
                  <Text style={styles.tooltipText}>Pickup point for agent</Text>
                  <Text style={styles.tooltipSubtext}>Move the pin to change location</Text>
                  <View style={styles.tooltipArrow} />
                </View>
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
          
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.addressContainer}>
            <MapPin size={20} color="#111827" />
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
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 16,
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
  // Center Tooltip Only (no pin marker)
  centerTooltipContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -110,
    marginTop: -100,
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
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
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
    color: '#16a34a',
    paddingTop: 2,
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
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
  markerOuter: {
  width: 36,
  height: 36,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
},
markerInner: {
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: '#16a34a',
  borderWidth: 3,
  borderColor: '#ffffff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
}

});