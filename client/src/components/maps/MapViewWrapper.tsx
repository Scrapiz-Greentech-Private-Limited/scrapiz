/**
 * MapViewWrapper - Platform-agnostic map component wrapper
 * 
 * This component provides a unified interface for map functionality across platforms.
 * It automatically detects the platform (iOS or Android) and routes to the appropriate
 * map provider implementation:
 * - iOS: AppleMapView (using react-native-maps with PROVIDER_APPLE)
 * - Android: MapboxMapView (using @rnmapbox/maps)
 * 
 * All props are forwarded to the selected implementation, ensuring consistent
 * behavior and API across both platforms.
 * 
 * Requirements: 1.1, 1.2, 1.5, 20.7
 */

import React from 'react';
import { Platform } from 'react-native';
import { MapProviderProps } from './types';
import { AppleMapView } from './AppleMapView';
import { MapboxMapView } from './MapboxMapView';

/**
 * MapViewWrapper component
 * 
 * Provides platform-specific map rendering with a unified interface.
 * 
 * @param props - MapProviderProps containing all map configuration and callbacks
 * @returns Platform-specific map view component
 * 
 * @example
 * ```tsx
 * const cameraRef = useRef<CameraController>(null);
 * 
 * <MapViewWrapper
 *   center={[lng, lat]}
 *   marker={[lng, lat]}
 *   zoom={16}
 *   onMapPress={(coords) => console.log('Pressed:', coords)}
 *   onRegionChange={(coords) => console.log('Moving:', coords)}
 *   onRegionChangeEnd={(coords) => console.log('Stopped:', coords)}
 *   cameraRef={cameraRef}
 *   style={{ flex: 1 }}
 * />
 * ```
 */
export function MapViewWrapper(props: MapProviderProps) {
  // Platform detection: iOS uses Apple Maps, Android uses Mapbox
  // Requirement: 1.1, 1.2, 1.5
  if (Platform.OS === 'ios') {
    // Route to Apple Maps for iOS
    // Requirement: 1.1
    return <AppleMapView {...props} />;
  }
  
  // Route to Mapbox for Android (and any other platforms)
  // Requirement: 1.2
  return <MapboxMapView {...props} />;
}
