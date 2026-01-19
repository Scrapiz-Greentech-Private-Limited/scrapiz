/**
 * MapboxMapView - Android-specific map implementation using @rnmapbox/maps
 * 
 * This component wraps Mapbox GL for Android devices, implementing the unified
 * MapProviderProps interface. It handles coordinate format (uses [lng, lat] directly),
 * camera controls, gesture handlers, and marker rendering.
 * 
 * Requirements: 1.2, 2.4, 2.5, 12.1, 20.3, 20.5
 */

import React, { useRef, useImperativeHandle, useEffect, useState, useMemo } from 'react';
import { Platform, ActivityIndicator, View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MapProviderProps, CameraController, Coordinates } from './types';
import { CustomMarkerView } from './CustomMarkerView';
import { DEFAULT_MAP_STYLE, MAP_SETTINGS } from '../../config/mapConfig';

// Memoized marker component to prevent unnecessary re-renders
const MapMarker = React.memo(({ coordinate }: { coordinate: Coordinates }) => {
  return (
    <MapboxGL.PointAnnotation 
      id="center-marker" 
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.nativeMarker}>
        <View style={styles.nativeMarkerInner} />
      </View>
    </MapboxGL.PointAnnotation>
  );
}, (prevProps, nextProps) => {
  // Only re-render if coordinates changed significantly (>5 meters)
  const changed = Math.abs(prevProps.coordinate[0] - nextProps.coordinate[0]) > 0.00005 ||
                  Math.abs(prevProps.coordinate[1] - nextProps.coordinate[1]) > 0.00005;
  return !changed; // Return true to skip re-render
});

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
  const [currentMarker, setCurrentMarker] = useState<Coordinates>(marker);
  
  // Throttle refs to prevent excessive updates
  const lastCameraChangeRef = useRef<number>(0);
  const cameraChangeThrottleMs = 300; // Increased to 300ms for ultra-smooth performance
  const isUserInteractingRef = useRef<boolean>(false);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout>();

  // Log initial coordinates
  useEffect(() => {
    console.log('🗺️ Mapbox: Initial center prop:', center);
    console.log('🗺️ Mapbox: Initial marker prop:', marker);
    console.log('🗺️ Mapbox: Initial zoom:', zoom);
  }, []);

  // Track when map is fully loaded
  useEffect(() => {
    console.log('🗺️ Mapbox: Map loaded state:', isMapLoaded);
    if (isMapLoaded) {
      console.log('🗺️ Mapbox: Current center after load:', currentCenter);
      console.log('🗺️ Mapbox: Current marker after load:', currentMarker);
    }
    
    // Cleanup on unmount
    return () => {
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, [isMapLoaded]);

  // Update center when prop changes (only if map is loaded AND user not interacting)
  useEffect(() => {
    if (isMapLoaded && center && !isUserInteractingRef.current) {
      console.log('🗺️ Mapbox: Center prop changed to:', center);
      // Don't update if coordinates are very close (user is just panning)
      const distance = Math.sqrt(
        Math.pow(center[0] - currentCenter[0], 2) + 
        Math.pow(center[1] - currentCenter[1], 2)
      );
      
      // Only update if it's a significant change (>0.001 degrees ~100m)
      if (distance > 0.001) {
        console.log('🗺️ Mapbox: Significant center change, updating');
        setCurrentCenter(center);
      }
    }
  }, [center, isMapLoaded]);

  // Update marker when prop changes (only significant changes and user not interacting)
  useEffect(() => {
    if (isMapLoaded && marker && !isUserInteractingRef.current) {
      console.log('🗺️ Mapbox: Marker prop changed to:', marker);
      // Don't update if coordinates are very close
      const distance = Math.sqrt(
        Math.pow(marker[0] - currentMarker[0], 2) + 
        Math.pow(marker[1] - currentMarker[1], 2)
      );
      
      // Only update if it's a significant change (>0.001 degrees ~100m)
      if (distance > 0.001) {
        console.log('🗺️ Mapbox: Significant marker change, updating');
        setCurrentMarker(marker);
      }
    }
  }, [marker, isMapLoaded]);

  // Expose CameraController interface via ref
  useImperativeHandle(cameraRef, () => ({
    setCamera: ({ centerCoordinate, zoomLevel, animationDuration }) => {
      if (!isMapLoaded) {
        console.warn('🗺️ Mapbox: Attempted to set camera before map loaded');
        return;
      }
      
      console.log('🗺️ Mapbox: setCamera called with:', centerCoordinate, 'zoom:', zoomLevel);
      setCurrentCenter(centerCoordinate);
      
      // Build camera config - only include zoom if explicitly provided
      const cameraConfig: any = {
        centerCoordinate,
        animationDuration: animationDuration || 1000,
      };
      
      // Only set zoom if explicitly provided
      if (zoomLevel !== undefined) {
        console.log('🗺️ Mapbox: Setting zoom to:', zoomLevel);
        cameraConfig.zoomLevel = zoomLevel;
        setCurrentZoom(zoomLevel);
      } else {
        console.log('🗺️ Mapbox: No zoom specified, keeping current zoom');
      }
      
      internalCameraRef.current?.setCamera(cameraConfig);
    },

    flyTo: (coords: Coordinates, duration = 1000) => {
      if (!isMapLoaded) {
        console.warn('🗺️ Mapbox: Attempted to flyTo before map loaded');
        return;
      }
      
      console.log('🗺️ Mapbox: flyTo called with:', coords, '(no zoom change)');
      setCurrentCenter(coords);
      // flyTo only changes position, not zoom
      internalCameraRef.current?.flyTo(coords, duration);
    },

    getCenter: async (): Promise<Coordinates> => {
      if (!isMapLoaded || !mapRef.current) {
        return currentCenter;
      }
      
      try {
        const center = await mapRef.current.getCenter();
        console.log('🗺️ Mapbox: getCenter returned:', center);
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
      console.log('🗺️ Mapbox: Map pressed at:', coords);
      onMapPress(coords);
    }
  };

  // Handle camera change during pan/zoom (fires continuously) - OPTIMIZED
  const handleCameraChange = async (state: any) => {
    if (!isMapLoaded || !mapRef.current) return;

    // Mark user as interacting
    isUserInteractingRef.current = true;
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
    }
    
    // Clear interaction flag after 2 seconds of no camera changes
    userInteractionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      console.log('🗺️ Mapbox: User interaction ended');
    }, 2000);

    // Aggressive throttle to prevent performance issues
    const now = Date.now();
    if (now - lastCameraChangeRef.current < cameraChangeThrottleMs) {
      return;
    }
    lastCameraChangeRef.current = now;

    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords = center as Coordinates;
        
        // Always update center and marker - no zoom detection needed
        setCurrentCenter(coords);
        setCurrentMarker(coords);
        onRegionChange(coords);
      }
    } catch (error) {
      // Silently fail during rapid camera changes to prevent console spam
    }
  };

  // Handle map idle (after pan/zoom completes)
  const handleMapIdle = async () => {
    if (!isMapLoaded || !mapRef.current) return;

    try {
      const center = await mapRef.current.getCenter();
      if (center && center.length === 2) {
        const coords = center as Coordinates;
        console.log('🗺️ Mapbox: Map idle at center:', coords);
        setCurrentCenter(coords);
        setCurrentMarker(coords); // Ensure marker is exactly at center
        onRegionChangeEnd(coords);
      }
    } catch (error) {
      console.error('🗺️ Mapbox: Error getting map center on idle:', error);
    }
  };

  // Handle map ready event - Set initial zoom once
  const handleMapReady = () => {
    console.log('🗺️ Mapbox: Map is ready and loaded');
    setIsMapLoaded(true);
    
    // Set initial zoom level once on map load
    setTimeout(() => {
      if (internalCameraRef.current) {
        console.log('🗺️ Mapbox: Setting initial zoom to:', zoom);
        internalCameraRef.current.setCamera({
          centerCoordinate: center,
          zoomLevel: zoom,
          animationDuration: 0, // Instant, no animation
        });
      }
    }, 100);
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
        surfaceView={false} // Android performance optimization
        style={StyleSheet.absoluteFillObject}
        styleURL={DEFAULT_MAP_STYLE}
        onPress={handlePress}
        onDidFinishLoadingMap={handleMapReady}
        onDidFailLoadingMap={handleMapLoadingError}
        onCameraChanged={handleCameraChange}
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
        // Performance optimizations
        localizeLabels={false}
        zoomEnabled={true}
        scrollEnabled={true}
        regionWillChangeDebounceTime={0}
        regionDidChangeDebounceTime={0}
      >
        {/* Camera control - Only controls position, NOT zoom */}
        <MapboxGL.Camera
          ref={internalCameraRef}
          centerCoordinate={currentCenter}
          animationMode="none"
          minZoomLevel={MAP_SETTINGS.minZoom}
          maxZoomLevel={MAP_SETTINGS.maxZoom}
        />

        {/* Native marker that moves with map - ALWAYS visible and synced */}
        {isMapLoaded && <MapMarker coordinate={currentMarker} />}
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
  nativeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nativeMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
