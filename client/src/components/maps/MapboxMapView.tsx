/**
 * MapboxMapView - Android-specific map implementation using @rnmapbox/maps
 * 
 * This component wraps Mapbox GL for Android devices, implementing the unified
 * MapProviderProps interface. It handles coordinate format (uses [lng, lat] directly),
 * camera controls, gesture handlers, and marker rendering.
 * 
 * Requirements: 1.2, 2.4, 2.5, 12.1, 20.3, 20.5
 */

import React, { useRef, useImperativeHandle, useEffect, useState } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MapProviderProps, CameraController, Coordinates } from './types';
import { CustomMarkerView } from './CustomMarkerView';
import { DEFAULT_MAP_STYLE } from '../../config/mapConfig';

export function MapboxMapView({
  center,
  marker,
  zoom,
  onMapPress,
  onRegionChange,
  onRegionChangeEnd,
  cameraRef,
  style,
}: MapProviderProps) {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const internalCameraRef = useRef<MapboxGL.Camera>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<Coordinates>(center);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);

  // Log initial coordinates
  useEffect(() => {
    console.log('🗺️ Mapbox: Initial center prop:', center);
    console.log('🗺️ Mapbox: Initial zoom:', zoom);
  }, []);

  // Track when map is fully loaded
  useEffect(() => {
    console.log('🗺️ Mapbox: Map loaded state:', isMapLoaded);
    if (isMapLoaded) {
      console.log('🗺️ Mapbox: Current center after load:', currentCenter);
    }
  }, [isMapLoaded]);

  // Update center when prop changes (only if map is loaded)
  useEffect(() => {
    if (isMapLoaded && center) {
      setCurrentCenter(center);
    }
  }, [center, isMapLoaded]);

  // Expose CameraController interface via ref
  useImperativeHandle(cameraRef, () => ({
    setCamera: ({ centerCoordinate, zoomLevel, animationDuration }) => {
      if (!isMapLoaded) {
        console.warn('🗺️ Mapbox: Attempted to set camera before map loaded');
        return;
      }
      
      setCurrentCenter(centerCoordinate);
      if (zoomLevel) setCurrentZoom(zoomLevel);
      
      internalCameraRef.current?.setCamera({
        centerCoordinate,
        zoomLevel: zoomLevel || zoom,
        animationDuration: animationDuration || 1000,
      });
    },

    flyTo: (coords: Coordinates, duration = 1000) => {
      if (!isMapLoaded) {
        console.warn('🗺️ Mapbox: Attempted to flyTo before map loaded');
        return;
      }
      
      setCurrentCenter(coords);
      internalCameraRef.current?.flyTo(coords, duration);
    },

    getCenter: async (): Promise<Coordinates> => {
      if (!isMapLoaded || !mapRef.current) {
        return currentCenter;
      }
      
      try {
        const center = await mapRef.current.getCenter();
        return center as Coordinates;
      } catch (error) {
        console.error('🗺️ Mapbox: Error getting center:', error);
        return currentCenter;
      }
    },
  }));

  // Handle map press events
  const handlePress = (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    if (!isMapLoaded) return;
    
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as Coordinates;
      onMapPress(coords);
    }
  };

  // Handle map idle (after pan/zoom completes)
  const handleMapIdle = async () => {
    if (!isMapLoaded || !mapRef.current) return;

    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords = center as Coordinates;
        setCurrentCenter(coords);
        onRegionChangeEnd(coords);
      }
    } catch (error) {
      console.error('🗺️ Mapbox: Error getting map center on idle:', error);
    }
  };

  // Handle map ready event
  const handleMapReady = () => {
    console.log('🗺️ Mapbox: Map is ready and loaded');
    setIsMapLoaded(true);
  };

  // Handle map loading error
  const handleMapLoadingError = (error: any) => {
    console.error('🗺️ Mapbox: Map loading error:', error?.message ?? error);
    setIsMapLoaded(false);
  };

  return (
    <View style={style}>
      <MapboxGL.MapView
        ref={mapRef}
        surfaceView={Platform.OS === 'android'} // Android performance optimization
        style={StyleSheet.absoluteFillObject}
        styleURL={DEFAULT_MAP_STYLE}
        onPress={handlePress}
        onDidFinishLoadingMap={handleMapReady}
        onDidFailLoadingMap={handleMapLoadingError}
        onMapIdle={handleMapIdle}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, left: 8 }}
        compassEnabled={true}
        compassViewPosition={3} // Top right
        compassViewMargins={{ x: 16, y: 100 }}
        scaleBarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Camera control - ALWAYS render to set initial position */}
        <MapboxGL.Camera
          ref={internalCameraRef}
          centerCoordinate={currentCenter}
          zoomLevel={currentZoom}
          animationMode="none"
          defaultSettings={{
            centerCoordinate: currentCenter,
            zoomLevel: currentZoom,
          }}
        />

        {/* Location marker - HIDDEN: Using fixed overlay marker instead */}
        {false && isMapLoaded && (
          <MapboxGL.PointAnnotation id="selected-marker" coordinate={marker}>
            <CustomMarkerView />
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* Loading indicator while map initializes */}
      {!isMapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
