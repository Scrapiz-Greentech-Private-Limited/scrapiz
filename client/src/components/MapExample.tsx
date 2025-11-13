import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import MapLocationPicker from './MapLocationPicker';

/**
 * Example component showing how to use MapLocationPicker
 * Can be used in any screen to allow users to select a location
 */
export default function MapExample() {
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
    // You can now use this location data in your app
    // For example: save to context, send to API, etc.
  };

  return (
    <View style={styles.container}>
      {/* Button to open map */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowMap(true)}
      >
        <MapPin size={20} color="#ffffff" />
        <Text style={styles.buttonText}>Select Location on Map</Text>
      </TouchableOpacity>

      {/* Display selected location */}
      {selectedLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Selected Location:</Text>
          <Text style={styles.locationText}>📍 {selectedLocation.address}</Text>
          <Text style={styles.locationDetail}>
            City: {selectedLocation.city}, {selectedLocation.state}
          </Text>
          <Text style={styles.locationDetail}>
            Pincode: {selectedLocation.pincode}
          </Text>
          <Text style={styles.locationDetail}>
            Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Map Picker Modal */}
      <MapLocationPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          selectedLocation
            ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#15803d',
    marginBottom: 4,
  },
  locationDetail: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
  },
});
