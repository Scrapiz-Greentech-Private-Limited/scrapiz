import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  MapPin,
  Navigation,
  Search,
  ChevronRight,
  Home,
  Building,
  MoreVertical,
  X,
  Plus,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useLocation, SavedLocation } from '../context/LocationContext';
import MapLocationPicker from './MapLocationPicker';
import { AuthService, CreateAddressRequest } from '../api/apiService';

interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LocationSelectionModal({
  visible,
  onClose,
}: LocationSelectionModalProps) {
  const router = useRouter();
  const {
    currentLocation,
    savedLocations,
    getCurrentLocation,
    selectLocation,
    saveLocation,
    isLoading,
    reloadAddresses,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showMapPickerForGPS, setShowMapPickerForGPS] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Reload addresses when modal becomes visible and cleanup when it closes
  useEffect(() => {
    if (visible) {
      console.log('📍 LocationSelectionModal opened - reloading addresses');
      reloadAddresses();
    } else {
      // Clean up modal state when modal closes
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setShowMapPicker(false);
      setShowMapPickerForGPS(false);
      
      // Clear any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const searchLocation = async (query: string) => {
    setIsSearching(true);
    try {
      // Integrate with your Krutrim/OLA Maps API search here
      // Using the same logic from MapLocationPicker
      const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
        query
      )}&api_key=${process.env.EXPO_PUBLIC_KRUTRIM_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.predictions) {
        setSearchResults(data.predictions);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
      // Optionally show a toast for search errors
      Toast.show({
        type: 'error',
        text1: 'Search Error',
        text2: 'Failed to search locations. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    // Open MapLocationPicker in GPS mode instead of directly getting location
    setShowMapPickerForGPS(true);
  };

  const handleSelectSavedLocation = (location: SavedLocation) => {
    selectLocation(location);
    onClose();
  };

  const handleSearchResultSelect = (result: any) => {
    // Open map picker with this location
    setSearchQuery(result.description);
    setSearchResults([]);
    setShowMapPicker(true);
  };

  const handleMapLocationConfirm = async (location: any) => {
    try {
      setSaving(true);
      
      // Construct address payload with all required fields
      const addressPayload: CreateAddressRequest = {
        name: 'Current Location',
        phone_number: '', // Will be filled by user later if needed
        room_number: '',
        street: location.address.split(',')[0] || '',
        area: location.area,
        city: location.city,
        state: location.state,
        country: 'India',
        pincode: parseInt(location.pincode) || 0,
        delivery_suggestion: '',
      };

      // Save to backend via AuthService and get the response with address ID
      const savedAddress = await AuthService.createAddress(addressPayload);
      
      // Update LocationContext with the new location
      selectLocation(location);
      
      // Reload addresses from backend to ensure synchronization
      await reloadAddresses();
      
      // Close all modals
      setShowMapPickerForGPS(false);
      onClose();

      Toast.show({
        type: 'success',
        text1: 'Location Saved',
        text2: 'Your location has been saved successfully',
      });
    } catch (error: any) {
      console.error('Address save error:', error);
      
      // Extract error message from response or use default
      let errorMessage = 'Failed to save address. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewAddress = () => {
    // Clean up modal state before navigation
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowMapPicker(false);
    setShowMapPickerForGPS(false);
    
    // Close modal first
    onClose();
    
    // Navigate to addresses screen
    router.push('/profile/addresses');
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home size={20} color="#374151" />;
      case 'office':
        return <Building size={20} color="#374151" />;
      default:
        return <MapPin size={20} color="#374151" />;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter your area or apartment name</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search Section */}
            <View style={styles.searchSection}>
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
                {isSearching && (
                  <ActivityIndicator size="small" color="#16a34a" />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.place_id}
                      style={styles.searchResultItem}
                      onPress={() => handleSearchResultSelect(result)}
                    >
                      <View style={styles.searchResultIcon}>
                        <MapPin size={18} color="#16a34a" />
                      </View>
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {result.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Use Current Location Button */}
            <View style={styles.currentLocationSection}>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleUseCurrentLocation}
                disabled={isLoading}
              >
                <View style={styles.currentLocationContent}>
                  <View style={styles.currentLocationIconWrapper}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : (
                      <Navigation size={20} color="#16a34a" fill="#16a34a" />
                    )}
                  </View>
                  <Text style={styles.currentLocationText}>
                    Use my current location
                  </Text>
                </View>
                <ChevronRight size={20} color="#16a34a" />
              </TouchableOpacity>
            </View>

            {/* Saved Addresses Section */}
            {savedLocations.length > 0 && (
              <View style={styles.savedAddressesSection}>
                <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
                <View style={styles.savedAddressesList}>
                  {savedLocations.map((location) => {
                    const isSelected =
                      currentLocation?.latitude === location.latitude &&
                      currentLocation?.longitude === location.longitude;

                    return (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.savedAddressCard,
                          isSelected && styles.savedAddressCardSelected,
                        ]}
                        onPress={() => handleSelectSavedLocation(location)}
                      >
                        <View style={styles.savedAddressIcon}>
                          {getLocationIcon(location.type)}
                        </View>
                        <View style={styles.savedAddressContent}>
                          <View style={styles.savedAddressHeader}>
                            <Text style={styles.savedAddressLabel}>
                              {location.label}
                            </Text>
                            {isSelected && (
                              <View style={styles.currentlySelectedBadge}>
                                <Text style={styles.currentlySelectedText}>
                                  CURRENTLY SELECTED
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={styles.savedAddressText}
                            numberOfLines={1}
                          >
                            {location.address}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={() => {
                            // Handle menu options (edit, delete)
                          }}
                        >
                          <MoreVertical size={18} color="#6b7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Add New Address Button */}
            <View style={styles.addAddressSection}>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={handleAddNewAddress}
              >
                <View style={styles.addAddressIcon}>
                  <Plus size={16} color="#6b7280" strokeWidth={2.5} />
                </View>
                <Text style={styles.addAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <Text style={styles.infoEmoji}>💡</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Quick Tip</Text>
                <Text style={styles.infoText}>
                  Save multiple addresses for faster checkout. We'll remember
                  your preferences!
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Map Location Picker Modal - Search Mode */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(location) => {
          // Handle location selection from map
          selectLocation(location);
          setShowMapPicker(false);
          onClose();
        }}
        onUseCurrentLocation={handleUseCurrentLocation}
        onAddManualAddress={() => {
          // Handle manual address entry
        }}
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

      {/* Map Location Picker Modal - GPS Mode */}
      <MapLocationPicker
        visible={showMapPickerForGPS}
        onClose={() => setShowMapPickerForGPS(false)}
        onLocationSelect={handleMapLocationConfirm}
        mode="standalone"
        autoOpenGPS={true}
        saving={saving}
        initialLocation={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }
            : undefined
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  currentLocationSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentLocationIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15803d',
  },
  savedAddressesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  savedAddressesList: {
    gap: 8,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  savedAddressCardSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  savedAddressIcon: {
    paddingTop: 2,
    marginRight: 12,
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  savedAddressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currentlySelectedBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentlySelectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  savedAddressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  addAddressSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  addAddressIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    gap: 12,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    backgroundColor: '#16a34a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14532d',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});