import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * CustomMarkerView - Shared marker component for both iOS and Android
 * 
 * Displays a green circular marker with white border and shadow effects.
 * This component is used consistently across both Apple Maps and Mapbox
 * to ensure visual consistency.
 * 
 * Requirements: 3.4, 17.3
 */
export function CustomMarkerView() {
  return (
    <View style={styles.markerOuter}>
      <View style={styles.markerInner} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#16a34a', // Green color matching design system
    borderWidth: 3,
    borderColor: '#ffffff', // White border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // Android shadow
  },
});
