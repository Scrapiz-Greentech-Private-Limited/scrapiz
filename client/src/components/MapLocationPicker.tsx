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
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { X, MapPin, Navigation, Search } from 'lucide-react-native';
import {
  DEFAULT_MAP_STYLE,
  MAP_STYLES,
  getIndiaBounds,
  MAPBOX_API_KEY,
  buildGeocodingUrl,
  buildReverseGeocodingUrl,
  MAP_SETTINGS,
  DEFAULT_CENTER,
} from '../config/mapConfig';

// Initialize MapLibre - IMPORTANT: Must be done before any MapLibre components


// Build the style URL directly to ensure it's correct

MapboxGL.setAccessToken(MAPBOX_API_KEY);

interface KrutrimAutocompleteResult {
  place_id: string;
  description: string;
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

// Your component interfaces (unchanged)
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
  initialLocation?: { latitude: number; longitude: number };
}

export default function MapLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
}: MapLocationPickerProps) {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KrutrimAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); // Modal fix (KEEP THIS)
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
    initialLocation ? [initialLocation.longitude, initialLocation.latitude] : DEFAULT_CENTER
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<[number, number]>(selectedCoords);

  // --- REFS ---
  // 5. UPDATE REFS TO USE MAPBOX TYPES
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // --- EFFECTS ---

  // 6. MODAL FIX (KEEP THIS)
  // This waits for the modal animation to finish before rendering the map
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsMapReady(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsMapReady(false);
    }
  }, [visible]);

  // Debounced search (Updated to use local bounds)
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

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  // --- API FUNCTIONS ---

  // 7. SEARCH LOCATION (Updated for Krutrim)
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const url = buildGeocodingUrl(query, {
        proximity: selectedCoords,
        limit: 5,
        bbox: getIndiaBounds(), // Use Mumbai-specific bounds
      });
      const response = await fetch(url);
      const data = await response.json();

      // Krutrim's response is in a 'predictions' array
      if (data.predictions) {
        setSearchResults(data.predictions);
        setShowResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Krutrim Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 8. REVERSE GEOCODE (Updated for Krutrim)
  const reverseGeocode = async (latitude: number, longitude: number): Promise<KrutrimReverseGeocodeResult | null> => {
    try {
      const url = buildReverseGeocodingUrl(longitude, latitude);
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0] as KrutrimReverseGeocodeResult;
        setSearchQuery(result.formatted_address);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Krutrim Reverse geocoding error:', error);
      return null;
    }
  };

  // --- HANDLER FUNCTIONS ---

  // 9. HANDLE RESULT SELECT (IMPORTANT - KRUTRIM API LIMITATION)
  const handleResultSelect = (result: KrutrimAutocompleteResult) => {
    setSearchQuery(result.description);
    setShowResults(false);
    Keyboard.dismiss();

    // !!! IMPORTANT LIMITATION !!!
    // Krutrim's Autocomplete API does NOT return coordinates, only a 'place_id'.
    // To move the map, you would need to make a SECOND API call
    // to their "Place Details" API using result.place_id.
    //
    // For now, this function just fills the search bar.
    console.warn("Krutrim Autocomplete selected. A 'Place Details' API call is needed to get coordinates.");
  };

  // 10. HANDLE USE CURRENT LOCATION (No changes needed, but uses our new reverseGeocode)
  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];

      setSelectedCoords(coords);
      setMarkerCoords(coords);

      cameraRef.current?.flyTo(coords, MAP_SETTINGS.animationDuration);
      await reverseGeocode(coords[1], coords[0]);

    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 11. HANDLE MAP PRESS (Updated to use new Mapbox types)
  const handleMapPress = async (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as [number, number];
      setMarkerCoords(coords);
      setSelectedCoords(coords);
      await reverseGeocode(coords[1], coords[0]);
    }
  };

  // 12. HANDLE CONFIRM LOCATION (Updated for Krutrim response)
  const handleConfirmLocation = async () => {
    const [longitude, latitude] = markerCoords;
    
    // Run reverse geocode one last time to get full details
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
      
      // Helper function to find parts of the address
      const find = (type: string) => components.find(c => c.types.includes(type))?.long_name;

      locationResult.address = result.formatted_address;
      locationResult.city = find('locality') || find('administrative_area_level_3') || 'Unknown';
      locationResult.state = find('administrative_area_level_1') || 'Unknown';
      locationResult.pincode = find('postal_code') || '000000';
      locationResult.area = find('sublocality_level_1') || find('neighborhood') || 'Unknown';
    }

    onLocationSelect(locationResult);
    onClose();
  };

  // --- RENDER ---
  
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header (Unchanged) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><X size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar (Unchanged) */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#16a34a" />}
          </View>
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleUseCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <Navigation size={20} color="#16a34a" />
            )}
          </TouchableOpacity>
        </View>

        {/* 13. SEARCH RESULTS (Updated for Krutrim response) */}
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
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultText} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.resultsList}
            />
          </View>
        )}

        {/* 14. MAP (Updated to Mapbox component) */}
        <View style={styles.mapContainer}>
          {isMapReady ? (
            <MapboxGL.MapView
              ref={mapRef}
              style={styles.map}
              styleURL={DEFAULT_MAP_STYLE}
              onPress={handleMapPress}
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
              <MapboxGL.PointAnnotation
                id="selected-location"
                coordinate={markerCoords}
              >
                {/* Your custom marker view */}
                <View style={styles.markerContainer}>
                  <View style={styles.marker}>
                    <MapPin size={24} color="#ffffff" fill="#16a34a" />
                  </View>
                </View>
              </MapboxGL.PointAnnotation>
            </MapboxGL.MapView>
          ) : (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}
        </View>

        {/* Confirm Button (Unchanged) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// 15. STYLES (Added mapLoadingContainer)
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  gpsButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  resultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 100,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 300,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  resultSubtext: { // This is no longer used, but fine to keep
    fontSize: 13,
    color: '#6b7280',
  },
  mapContainer: {
    flex: 1,
  },
  mapLoadingContainer: { // Added for the modal fix
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
