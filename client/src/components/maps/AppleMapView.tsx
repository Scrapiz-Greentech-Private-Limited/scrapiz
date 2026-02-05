/**
 * AppleMapView - iOS-specific map implementation using react-native-maps
 * 
 * This component wraps react-native-maps with PROVIDER_APPLE for iOS devices,
 * implementing the unified MapProviderProps interface. It handles coordinate
 * format conversions (from [lng, lat] to {latitude, longitude}), zoom to delta
 * conversions, camera controls, and marker rendering.
 * 
 * Requirements: 1.1, 15.2, 20.3, 2.4, 2.5, 20.5, 20.6
 */

import React, { useRef, useImperativeHandle, useEffect } from 'react';
import MapView, { Marker, PROVIDER_APPLE, Region } from 'react-native-maps';
import { MapProviderProps, CameraController, Coordinates } from './types';
import { CustomMarkerView } from './CustomMarkerView';
import { coordinatesToRegion } from './utils';

export function AppleMapView({
  center,
  marker,
  zoom,
  onMapPress,
  onRegionChange,
  onRegionChangeEnd,
  cameraRef,
  style,
  initialRegion,
}: MapProviderProps) {
  const mapRef = useRef<MapView>(null);

  // Log initial coordinates
  useEffect(() => {
    console.log('🗺️ Apple Maps: Initial center prop:', center);
    console.log('🗺️ Apple Maps: Initial zoom:', zoom);
    console.log('🗺️ Apple Maps: Initial region prop:', initialRegion);
  }, []);

  // Expose CameraController interface via ref
  // Requirements: 2.4, 2.5, 20.5
  useImperativeHandle(cameraRef, () => ({
    setCamera: ({ centerCoordinate, zoomLevel, animationDuration }) => {
      // Convert [lng, lat] to Apple Maps Region format
      // Requirement: 15.2
      const region = coordinatesToRegion(
        centerCoordinate,
        zoomLevel || zoom
      );

      mapRef.current?.animateToRegion(region, animationDuration || 1000);
    },

    flyTo: (coords: Coordinates, duration = 1000) => {
      // Convert [lng, lat] to Apple Maps Region format
      // Requirement: 15.2
      const region = coordinatesToRegion(coords, zoom);

      mapRef.current?.animateToRegion(region, duration);
    },

    getCenter: async (): Promise<Coordinates> => {
      try {
        const camera = await mapRef.current?.getCamera();
        if (camera && camera.center) {
          // Convert {latitude, longitude} back to [lng, lat]
          // Requirement: 15.2
          return [camera.center.longitude, camera.center.latitude];
        }
        // Fallback to current center if camera unavailable
        return center;
      } catch (error) {
        console.error('Error getting camera center:', error);
        return center;
      }
    },
  }));

  // Handle map press events
  // Requirement: 15.2, 20.6
  const handlePress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    if (coordinate) {
      // Convert {latitude, longitude} to [lng, lat]
      const coords: Coordinates = [coordinate.longitude, coordinate.latitude];
      onMapPress(coords);
    }
  };

  // Handle region change during pan/zoom (fires continuously)
  // Requirement: 15.2, 20.6
  const handleRegionChange = (region: Region) => {
    // Convert {latitude, longitude} to [lng, lat]
    const coords: Coordinates = [region.longitude, region.latitude];
    onRegionChange(coords);
  };

  // Handle region change complete (after pan/zoom completes)
  // Requirement: 15.2, 20.6
  const handleRegionChangeComplete = (region: Region) => {
    // Convert {latitude, longitude} to [lng, lat]
    const coords: Coordinates = [region.longitude, region.latitude];
    onRegionChangeEnd(coords);
  };

  // Calculate initial region from props or center
  const getInitialRegion = (): Region => {
    if (initialRegion) {
      console.log('🗺️ Apple Maps: Using initialRegion prop:', initialRegion);
      return initialRegion;
    }
    const region = coordinatesToRegion(center, zoom);
    console.log('🗺️ Apple Maps: Calculated region from center:', region);
    return region;
  };

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_APPLE}
      style={style}
      initialRegion={getInitialRegion()}
      onPress={handlePress}
      onRegionChange={handleRegionChange}
      onRegionChangeComplete={handleRegionChangeComplete}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onMapReady={() => {
        console.log('Apple Maps ready');
      }}
    >
      {/* Location marker - HIDDEN: Using fixed overlay marker instead */}
      {false && (
        <Marker
          coordinate={{
            latitude: marker[1],
            longitude: marker[0],
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          centerOffset={{ x: 0, y: 0 }}
        >
          <CustomMarkerView />
        </Marker>
      )}
    </MapView>
  );
}
