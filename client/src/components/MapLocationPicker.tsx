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
  getIndiaBounds,
  MAPBOX_API_KEY,
  buildGeocodingUrl,
  buildReverseGeocodingUrl,
  MAP_SETTINGS,
  DEFAULT_CENTER,
} from '../config/mapConfig';

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

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsMapReady(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsMapReady(false);
    }
  }, [visible]);

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
      const url = buildGeocodingUrl(query, {
        proximity: selectedCoords,
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
      console.error('Krutrim Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<KrutrimReverseGeocodeResult | null> => {
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

  const handleResultSelect = (result: KrutrimAutocompleteResult) => {
    setSearchQuery(result.description);
    setShowResults(false);
    Keyboard.dismiss();
    console.warn(
      "Krutrim Autocomplete selected. A 'Place Details' API call is needed to get coordinates."
    );
  };

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

  const handleMapPress = async (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as [number, number];
      setMarkerCoords(coords);
      setSelectedCoords(coords);
      await reverseGeocode(coords[1], coords[0]);
    }
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

    onLocationSelect(locationResult);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              placeholderTextColor="#9ca3af"
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

        {/* Map Container - Now the results will push the map down */}
        <View style={styles.mapWrapper}>
          {/* Search Results - No longer absolute positioned */}
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
                    <View style={styles.resultIconContainer}>
                      <MapPin size={18} color="#16a34a" />
                    </View>
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultText} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
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
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <MapPin size={24} color="#ffffff" fill="#16a34a" />
                    </View>
                    <View style={styles.markerShadow} />
                  </View>
                </MapboxGL.PointAnnotation>
              </MapboxGL.MapView>
            ) : (
              <View style={styles.mapLoadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.addressPreview}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.addressText} numberOfLines={1}>
              {searchQuery || 'Tap on map to select location'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !searchQuery && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmLocation}
            disabled={!searchQuery}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
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
    borderBottomColor: '#f3f4f6',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  mapWrapper: {
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
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
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#f0fdf4',
  },
  markerShadow: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#000',
    opacity: 0.2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});