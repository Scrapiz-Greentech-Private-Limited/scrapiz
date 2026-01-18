/**
 * MapboxMapView - Android-specific map implementation using @rnmapbox/maps
 * 
 * This component wraps Mapbox GL for Android devices, implementing the unified
 * MapProviderProps interface. It handles coordinate format (uses [lng, lat] directly),
 * camera controls, gesture handlers, and marker rendering.
 * 
 * Requirements: 1.2, 2.4, 2.5, 12.1, 20.3, 20.5
 */

import React, { useRef, useImperativeHandle, useEffect } from 'react';
import { Platform } from 'react-native';
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

  // Expose CameraController interface via ref
  useImperativeHandle(cameraRef, () => ({
    setCamera: ({ centerCoordinate, zoomLevel, animationDuration }) => {
      internalCameraRef.current?.setCamera({
        centerCoordinate,
        zoomLevel: zoomLevel || zoom,
        animationDuration: animationDuration || 1000,
      });
    },

    flyTo: (coords: Coordinates, duration = 1000) => {
      internalCameraRef.current?.flyTo(coords, duration);
    },

    getCenter: async (): Promise<Coordinates> => {
      const center = await mapRef.current?.getCenter();
      return center as Coordinates;
    },
  }));

  // Handle map press events
  const handlePress = (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const coords = geometry.coordinates as Coordinates;
      onMapPress(coords);
    }
  };

  // Handle camera changes (continuous during pan/zoom)
  const handleCameraChanged = async () => {
    if (!mapRef.current) return;

    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        onRegionChange(center as Coordinates);
      }
    } catch (error) {
      console.error('Error getting map center during camera change:', error);
    }
  };

  // Handle map idle (after pan/zoom completes)
  const handleMapIdle = async () => {
    if (!mapRef.current) return;

    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        onRegionChangeEnd(center as Coordinates);
      }
    } catch (error) {
      console.error('Error getting map center on idle:', error);
    }
  };

  return (
    <MapboxGL.MapView
      ref={mapRef}
      surfaceView={Platform.OS === 'android'} // Android performance optimization
      style={style}
      styleURL={DEFAULT_MAP_STYLE}
      onPress={handlePress}
      onCameraChanged={handleCameraChanged}
      onMapIdle={handleMapIdle}
      logoEnabled={false}
      attributionEnabled={true}
      attributionPosition={{ bottom: 8, left: 8 }}
      onMapLoadingError={(e) => {
        console.error('Mapbox loading error:', e?.message ?? e);
      }}
    >
      {/* Camera control */}
      <MapboxGL.Camera
        ref={internalCameraRef}
        centerCoordinate={center}
        zoomLevel={zoom}
        animationMode="flyTo"
        animationDuration={1000}
      />

      {/* Location marker */}
      <MapboxGL.PointAnnotation id="selected-marker" coordinate={marker}>
        <CustomMarkerView />
      </MapboxGL.PointAnnotation>
    </MapboxGL.MapView>
  );
}
