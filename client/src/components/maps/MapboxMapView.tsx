/**
 * MapboxMapView - Android-specific map implementation using @rnmapbox/maps
 * 
 * This component wraps Mapbox GL for Android devices, implementing the unified
 * MapProviderProps interface. It handles coordinate format (uses [lng, lat] directly),
 * camera controls, gesture handlers, and marker rendering.
 * 
 * Requirements: 1.2, 2.4, 2.5, 12.1, 20.3, 20.5
 */

import React, { useRef, useImperativeHandle, useEffect, useState, useMemo, useCallback } from 'react';
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
  const [surfaceReady, setSurfaceReady] = useState(false); // Track surface lifecycle

  // FIX for Android: Camera key to force remount when coordinates change programmatically
  // Changing the key forces React to unmount/remount the Camera component
  const [cameraKey, setCameraKey] = useState(0);

  // Throttle refs to prevent excessive updates
  const lastCameraChangeRef = useRef<number>(0);
  const cameraChangeThrottleMs = 150; // Reduced for smoother panning (was 300ms)
  const isUserInteractingRef = useRef<boolean>(false);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout>();
  const surfaceRecreationTimeoutRef = useRef<NodeJS.Timeout>();

  // FIX for Android: Lock camera updates from map idle events when programmatically moving
  const lockCameraUntilRef = useRef<number>(0);
  // FIX for Android: Store locked coordinates in a ref (updates synchronously, unlike state)
  const lockedCoordsRef = useRef<Coordinates | null>(null);

  // Log initial coordinates
  useEffect(() => {
    console.log('🗺️ Mapbox: Initial center prop:', center);
    console.log('🗺️ Mapbox: Initial marker prop:', marker);
    console.log('🗺️ Mapbox: Initial zoom:', zoom);
  }, []);

  // FIX #1: Surface lifecycle management - delay rendering until stable
  useEffect(() => {
    // Give Android time to stabilize surface after permission dialogs
    const timer = setTimeout(() => {
      setSurfaceReady(true);
      console.log('🗺️ Mapbox: Surface ready for rendering');
    }, 300);

    return () => clearTimeout(timer);
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
      if (surfaceRecreationTimeoutRef.current) {
        clearTimeout(surfaceRecreationTimeoutRef.current);
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

      // FIX for Android: Lock camera updates from map idle events for 5 seconds
      // This prevents handleMapIdle from overwriting our target coordinates during animation
      if (Platform.OS === 'android') {
        lockCameraUntilRef.current = Date.now() + 5000; // Reduced to 5s
        lockedCoordsRef.current = centerCoordinate;
      }

      // Update state to sync marker
      setCurrentCenter(centerCoordinate);
      setCurrentMarker(centerCoordinate);

      // Build camera config
      const cameraConfig: any = {
        centerCoordinate,
        animationDuration: animationDuration || 500,
      };

      // Only set zoom if explicitly provided
      if (zoomLevel !== undefined) {
        cameraConfig.zoomLevel = zoomLevel;
        setCurrentZoom(zoomLevel);
      } else {
        cameraConfig.zoomLevel = currentZoom;
      }

      // Use flyTo for smoother animation
      if (Platform.OS === 'android') {
        setTimeout(() => {
          internalCameraRef.current?.setCamera(cameraConfig);
        }, 50);
      } else {
        internalCameraRef.current?.setCamera(cameraConfig);
      }
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

      // FIX for Android: Unlock camera when user intentionally taps
      if (Platform.OS === 'android' && lockCameraUntilRef.current > 0) {
        lockCameraUntilRef.current = 0;
        lockedCoordsRef.current = null;
        console.log('🔓 Mapbox: Camera unlocked - user tapped on map');
      }

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

    // Clear camera lock immediately when user starts interacting
    // This allows smooth panning and zooming
    if (Platform.OS === 'android' && lockCameraUntilRef.current > 0) {
      lockCameraUntilRef.current = 0;
      lockedCoordsRef.current = null;
    }

    // Clear interaction flag after 500ms of no camera changes
    userInteractionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 500);

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

        // FIX for Android: Don't update internal state if camera is locked
        // Use lockedCoordsRef (ref, not state) because it updates synchronously
        if (Platform.OS === 'android' && lockCameraUntilRef.current > Date.now() && lockedCoordsRef.current) {
          // Notify parent with our LOCKED coordinates (from ref, guaranteed correct)
          onRegionChangeEnd(lockedCoordsRef.current);
          // Also update marker state to locked coords for visual consistency
          setCurrentMarker(lockedCoordsRef.current);
          return;
        }

        setCurrentCenter(coords);
        setCurrentMarker(coords); // Ensure marker is exactly at center
        onRegionChangeEnd(coords);
      }
    } catch (error) {
      // Silently fail to prevent console spam
    }
  };

  // Handle map ready event - Set initial zoom once
  const handleMapReady = () => {
    console.log('🗺️ Mapbox: Map is ready and loaded');
    setIsMapLoaded(true);

    // FIX #2: Delay initial camera setup to ensure surface is stable
    // FIX for Android: Longer delay and sync marker with center
    const initDelay = Platform.OS === 'android' ? 300 : 150;

    setTimeout(() => {
      if (internalCameraRef.current) {
        console.log('🗺️ Mapbox: Setting initial zoom to:', zoom);
        console.log('🗺️ Mapbox: Setting initial center to:', center);

        // Sync marker with current center on Android
        if (Platform.OS === 'android') {
          setCurrentMarker(center);
        }

        internalCameraRef.current.setCamera({
          centerCoordinate: center,
          zoomLevel: zoom,
          animationDuration: 0, // Instant, no animation
        });
      }
    }, initDelay);
  };

  // Handle map loading error
  const handleMapLoadingError = (error: any) => {
    console.error('🗺️ Mapbox: Map loading error:', error?.message ?? error);
    setIsMapLoaded(false);

    // FIX #3: Attempt surface recreation on error
    if (surfaceRecreationTimeoutRef.current) {
      clearTimeout(surfaceRecreationTimeoutRef.current);
    }

    surfaceRecreationTimeoutRef.current = setTimeout(() => {
      console.log('🗺️ Mapbox: Attempting surface recreation...');
      setSurfaceReady(false);
      setTimeout(() => {
        setSurfaceReady(true);
        console.log('🗺️ Mapbox: Surface recreated');
      }, 500);
    }, 1000);
  };

  // FIX #4: Don't render map until surface is ready
  if (!surfaceReady) {
    return (
      <View style={[style, { backgroundColor: '#f9fafb' }]}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </View>
    );
  }

  return (
    <View style={style}>
      <MapboxGL.MapView
        ref={mapRef}
        surfaceView={false} // Use TextureView instead of SurfaceView for better Fabric lifecycle
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
        {/* Camera control - simplified for smooth user interaction */}
        {/* On Android: Don't bind centerCoordinate to allow free user gestures */}
        <MapboxGL.Camera
          ref={internalCameraRef}
          centerCoordinate={Platform.OS === 'android' ? undefined : currentCenter}
          zoomLevel={currentZoom}
          animationMode="flyTo"
          animationDuration={500}
          minZoomLevel={MAP_SETTINGS.minZoom}
          maxZoomLevel={MAP_SETTINGS.maxZoom}
          defaultSettings={{
            centerCoordinate: currentCenter,
            zoomLevel: currentZoom,
          }}
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
