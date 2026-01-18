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
  Alert,
  TouchableWithoutFeedback,
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
  Edit,
  Trash2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useLocation, SavedLocation } from '../context/LocationContext';
import MapLocationPicker from './MapLocationPicker';
import { AuthService, CreateAddressRequest } from '../api/apiService';
import { useTheme } from '../context/ThemeContext';

interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LocationSelectionModal({
  visible,
  onClose,
}: LocationSelectionModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    currentLocation,
    savedLocations,
    getCurrentLocation,
    selectLocation,
    saveLocation,
    removeLocation,
    isLoading,
    reloadAddresses,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showMapPickerForGPS, setShowMapPickerForGPS] = useState(false);
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SavedLocation | null>(null);
  const [parentModalVisible, setParentModalVisible] = useState(visible);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Sync parent modal visibility with prop, but allow local control
  useEffect(() => {
    setParentModalVisible(visible);
  }, [visible]);
  // Reload addresses when modal becomes visible and cleanup when it closes
  useEffect(() => {
    if (parentModalVisible) {
      console.log('📍 LocationSelectionModal opened - reloading addresses');
      reloadAddresses();
    } else {
      console.log('📍 LocationSelectionModal closed - cleaning up');
      // Clean up modal state when modal closes
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      
      // Don't reset map picker states here - they manage themselves
      
      // Clear any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [parentModalVisible]);

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
      // Use Google Places API (New) with POST request
      const { buildGoogleAutocompletePayload, GOOGLE_API_KEY, getSessionToken } = await import('../config/mapConfig');
      
      const sessionToken = getSessionToken();
      const payload = buildGoogleAutocompletePayload(query, sessionToken, null);

      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.suggestions) {
        const formattedResults = data.suggestions.map((item: any) => ({
          place_id: item.placePrediction.placeId,
          description: item.placePrediction.text.text,
        }));
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
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
    console.log('🗺️ Opening GPS map picker - hiding parent modal');
    // Hide the parent modal temporarily
    setParentModalVisible(false);
    
    // Small delay to ensure parent modal animation completes
    setTimeout(() => {
      console.log('🗺️ Parent modal hidden, opening GPS map picker');
      setShowMapPickerForGPS(true);
    }, 150);
  };

  const handleSelectSavedLocation = (location: SavedLocation) => {
    selectLocation(location);
    onClose();
  };

  const handleSearchResultSelect = (result: any) => {
    console.log('🗺️ Opening search map picker - hiding parent modal');
    // Hide the parent modal temporarily
    setParentModalVisible(false);
    
    // Store the search query and open map picker after parent hides
    setSearchQuery(result.description);
    setSearchResults([]);
    
    setTimeout(() => {
      console.log('🗺️ Parent modal hidden, opening search map picker');
      setShowMapPicker(true);
    }, 150);
  };

  const handleMapLocationConfirm = async (location: any) => {
    try {
      // Don't save here - redirect to addresses screen instead
      setShowMapPickerForGPS(false);
      onClose(); // Close the location selection modal
      
      // Navigate to addresses screen with pre-filled data
      router.push({
        pathname: '/profile/addresses',
        params: {
          prefillLocation: JSON.stringify(location),
          autoOpen: 'true'
        }
      });
      
      Toast.show({
        type: 'info',
        text1: 'Complete Your Address',
        text2: 'Please add phone number and other details',
      });
    } catch (error: any) {
      console.error('Navigation error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to navigate to address form. Please try again.',
      });
      
      // Close map picker on error
      setShowMapPickerForGPS(false);
    }
  };

  const handleMapPickerClose = () => {
    console.log('🗺️ GPS map picker closed - showing parent modal');
    setShowMapPickerForGPS(false);
    // Show parent modal again
    setTimeout(() => {
      setParentModalVisible(true);
    }, 100);
  };

  const handleSearchMapPickerClose = () => {
    console.log('🗺️ Search map picker closed - showing parent modal');
    setShowMapPicker(false);
    // Show parent modal again
    setTimeout(() => {
      setParentModalVisible(true);
    }, 100);
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

  const handleAddressMenu = (location: SavedLocation) => {
    setSelectedAddress(location);
    setShowAddressMenu(true);
  };

  const handleEditAddress = () => {
    setShowAddressMenu(false);
    onClose();
    
    // Navigate to addresses screen - the screen will handle opening the edit modal
    router.push('/profile/addresses');
    
    // Note: You'll need to pass the address ID to the addresses screen
    // This can be done via query params or a global state management solution
  };

  const handleDeleteAddress = async () => {
    if (!selectedAddress) return;
    
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowAddressMenu(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setShowAddressMenu(false);
              
              // Delete from backend
              await AuthService.deleteAddress(selectedAddress.id);
              
              // Remove from LocationContext
              removeLocation(selectedAddress.id);
              
              // Reload addresses to ensure synchronization
              await reloadAddresses();
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Address deleted successfully',
              });
            } catch (error: any) {
              console.error('Error deleting address:', error);
              
              let errorMessage = 'Failed to delete address. Please try again.';
              
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
              });
            }
          },
        },
      ]
    );
  };

  const getLocationIcon = (type: string) => {
    const iconColor = colors.textSecondary;
    switch (type) {
      case 'home':
        return <Home size={20} color={iconColor} />;
      case 'office':
        return <Building size={20} color={iconColor} />;
      default:
        return <MapPin size={20} color={iconColor} />;
    }
  };

  return (
    <>
      <Modal
        visible={parentModalVisible}
        animationType="slide"
        onRequestClose={() => {
          // When user presses back button, close everything
          setParentModalVisible(false);
          onClose();
        }}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => {
              setParentModalVisible(false);
              onClose();
            }} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Enter your location</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search Section */}
            <View style={styles.searchSection}>
              <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Search size={20} color={colors.inputPlaceholder} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Try Powai, Borivali West etc..."
                  placeholderTextColor={colors.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={[styles.searchResults, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.place_id}
                      style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSearchResultSelect(result)}
                    >
                      <View style={[styles.searchResultIcon, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
                        <MapPin size={18} color={colors.primary} />
                      </View>
                      <Text style={[styles.searchResultText, { color: colors.text }]} numberOfLines={2}>
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
                style={[styles.currentLocationButton, { 
                  backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                  borderColor: isDark ? '#16a34a' : '#bbf7d0'
                }]}
                onPress={handleUseCurrentLocation}
                disabled={isLoading}
              >
                <View style={styles.currentLocationContent}>
                  <View style={[styles.currentLocationIconWrapper, { backgroundColor: colors.background }]}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Navigation size={20} color={colors.primary} fill={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.currentLocationText, { color: isDark ? '#86efac' : '#15803d' }]}>
                    Use my current location
                  </Text>
                </View>
                <ChevronRight size={20} color={isDark ? '#86efac' : '#16a34a'} />
              </TouchableOpacity>
            </View>

            {/* Saved Addresses Section */}
            {savedLocations.length > 0 && (
              <View style={styles.savedAddressesSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SAVED ADDRESSES</Text>
                <View style={styles.savedAddressesList}>
                  {savedLocations.map((location) => {
                    const isSelected = currentLocation?.id === location.id;

                    return (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.savedAddressCard,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          isSelected && {
                            borderColor: colors.primary,
                            backgroundColor: isDark ? '#064e3b' : '#f0fdf4'
                          },
                        ]}
                        onPress={() => handleSelectSavedLocation(location)}
                      >
                        <View style={styles.savedAddressIcon}>
                          {getLocationIcon(location.type)}
                        </View>
                        <View style={styles.savedAddressContent}>
                          <View style={styles.savedAddressHeader}>
                            <Text style={[styles.savedAddressLabel, { color: colors.text }]}>
                              {location.label}
                            </Text>
                            {isSelected && (
                              <View style={[styles.currentlySelectedBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.currentlySelectedText}>
                                  CURRENTLY SELECTED
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[styles.savedAddressText, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {location.address}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddressMenu(location);
                          }}
                        >
                          <MoreVertical size={18} color={colors.textSecondary} />
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
                style={[styles.addAddressButton, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }]}
                onPress={handleAddNewAddress}
              >
                <View style={[styles.addAddressIcon, { borderColor: colors.textSecondary }]}>
                  <Plus size={16} color={colors.textSecondary} strokeWidth={2.5} />
                </View>
                <Text style={[styles.addAddressText, { color: colors.textSecondary }]}>Add New Address</Text>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={[styles.infoCard, { 
              backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
              borderColor: isDark ? '#16a34a' : '#bbf7d0'
            }]}>
              <View style={[styles.infoIconWrapper, { backgroundColor: colors.primary }]}>
                <Text style={styles.infoEmoji}>💡</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: isDark ? '#86efac' : '#14532d' }]}>Quick Tip</Text>
                <Text style={[styles.infoText, { color: isDark ? '#86efac' : '#166534' }]}>
                  Save multiple addresses for faster checkout. We'll remember
                  your preferences!
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Map Location Picker Modal - Search Mode */}
      {showMapPicker && (
        <MapLocationPicker
          visible={showMapPicker}
          onClose={handleSearchMapPickerClose}
          onLocationSelect={(location) => {
            selectLocation(location);
            setShowMapPicker(false);
            // Don't reopen parent - user completed the action
          }}
          onUseCurrentLocation={handleUseCurrentLocation}
          onAddManualAddress={() => {}}
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
      )}

      {/* Map Location Picker Modal - GPS Mode */}
      {showMapPickerForGPS && (
        <MapLocationPicker
          visible={showMapPickerForGPS}
          mode="standalone"
          autoOpenGPS={true}
          onClose={handleMapPickerClose}
          onLocationSelect={handleMapLocationConfirm}
          initialLocation={
            currentLocation
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }
              : undefined
          }
        />
      )}
      {/* Address Menu Modal */}
      {showAddressMenu && selectedAddress && (
        <Modal
          visible={showAddressMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddressMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowAddressMenu(false)}>
            <View style={styles.menuOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.menuHeader}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>{selectedAddress.label}</Text>
                    <TouchableOpacity onPress={() => setShowAddressMenu(false)}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleEditAddress}
                  >
                    <Edit size={20} color="#3b82f6" />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Address</Text>
                  </TouchableOpacity>
                  
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDeleteAddress}
                  >
                    <Trash2 size={20} color="#ef4444" />
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Address</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  searchResults: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultText: {
    flex: 1,
    fontSize: 15,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentLocationIconWrapper: {
    width: 40,
    height: 40,
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
  },
  savedAddressesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 12,
    borderWidth: 2,
  },
  savedAddressCardSelected: {
    // Removed - handled inline with dynamic colors
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
  },
  currentlySelectedBadge: {
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
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
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
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});