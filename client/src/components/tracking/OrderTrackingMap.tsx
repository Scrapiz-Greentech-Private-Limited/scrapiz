import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import MapView, {
  AnimatedRegion,
  Circle,
  Marker,
  MarkerAnimated,
  Polyline,
  Region,
} from 'react-native-maps';
import MapboxGL from '@rnmapbox/maps';
import { Home, Navigation, Truck, User } from 'lucide-react-native';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MAPBOX_API_KEY, MAP_STYLES, calculateDistance } from '../../config/mapConfig';
import { TrackingCoordinate, TrackingPhase, TrackingVendorPin } from '../../types/orderTracking';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteUpdateData {
  instruction: string;
  distanceM: number;
}

interface OrderTrackingMapProps {
  pickup: TrackingCoordinate;
  phase: TrackingPhase;
  vendorPins: TrackingVendorPin[];
  acceptedVendorLocation: TrackingCoordinate | null;
  dispatchRadiusKm?: number;
  notifiedVendorCount?: number;
  distanceLabel?: string | null;
  userLocation?: TrackingCoordinate | null;
  vendorName?: string;
  onRouteUpdate?: (data: RouteUpdateData | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRegion(pickup: TrackingCoordinate): Region {
  return {
    latitude: pickup.lat,
    longitude: pickup.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
}

function calculateBearing(from: TrackingCoordinate, to: TrackingCoordinate) {
  const startLat = (from.lat * Math.PI) / 180;
  const startLng = (from.lng * Math.PI) / 180;
  const endLat = (to.lat * Math.PI) / 180;
  const endLng = (to.lng * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function buildActiveVendor(
  acceptedVendorLocation: TrackingCoordinate | null,
  vendorPins: TrackingVendorPin[]
): TrackingVendorPin | null {
  if (acceptedVendorLocation) {
    const matchingPin = vendorPins.find(
      (pin) =>
        typeof pin.lat === 'number' &&
        typeof pin.lng === 'number' &&
        Math.abs(pin.lat - acceptedVendorLocation.lat) < 0.00001 &&
        Math.abs(pin.lng - acceptedVendorLocation.lng) < 0.00001
    );

    if (matchingPin) return matchingPin;

    return {
      vendor_id: 0,
      name: 'Active Partner',
      pin_role: 'vendor',
      lat: acceptedVendorLocation.lat,
      lng: acceptedVendorLocation.lng,
    };
  }

  return vendorPins.find((pin) => typeof pin.lat === 'number' && typeof pin.lng === 'number') || null;
}

function buildCurvedLineCoordinates(
  start: TrackingCoordinate,
  end: TrackingCoordinate
): [number, number][] {
  const midLng = (start.lng + end.lng) / 2;
  const midLat = (start.lat + end.lat) / 2;
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const offsetScale = Math.min(distance * 0.22, 0.015);
  const curveLng = midLng - (dy / distance) * offsetScale;
  const curveLat = midLat + (dx / distance) * offsetScale;

  return [
    [start.lng, start.lat],
    [curveLng, curveLat],
    [end.lng, end.lat],
  ];
}

function isSameCoordinate(a: TrackingCoordinate, b: TrackingCoordinate) {
  return Math.abs(a.lat - b.lat) < 0.00001 && Math.abs(a.lng - b.lng) < 0.00001;
}

function isAgentPin(pin: TrackingVendorPin) {
  return pin.pin_role === 'agent';
}

function getPassivePinStyle(pin: TrackingVendorPin) {
  return isAgentPin(pin) ? styles.partnerMarkerAgent : styles.partnerMarkerVendor;
}

// ─── Chat bubble vendor marker ─────────────────────────────────────────────────

const ChatBubbleMarker: React.FC<{ name: string; color?: string }> = ({
  name,
  color = '#1D4ED8',
}) => (
  <View style={styles.chatBubbleWrap}>
    <View style={[styles.chatBubble, { backgroundColor: color }]}>
      <Navigation size={12} color="#fff" />
      <Text style={styles.chatBubbleName} numberOfLines={1}>
        {name}
      </Text>
    </View>
    <View style={[styles.chatBubblePointer, { borderTopColor: color }]} />
  </View>
);

// ─── Main component ────────────────────────────────────────────────────────────

export function OrderTrackingMap({
  pickup,
  phase,
  vendorPins,
  acceptedVendorLocation,
  dispatchRadiusKm = 10,
  notifiedVendorCount = 0,
  distanceLabel,
  userLocation = null,
  vendorName,
  onRouteUpdate,
}: OrderTrackingMapProps) {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.7)).current;

  // Route state
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const lastRouteFetchRef = useRef<TrackingCoordinate | null>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const hasInitialFitRef = useRef(false);

  const allPartnerPins = useMemo(
    () => vendorPins.filter((pin) => typeof pin.lat === 'number' && typeof pin.lng === 'number'),
    [vendorPins]
  );
  const userPin = useMemo(() => userLocation || pickup, [userLocation, pickup]);

  const activeVendorPin = useMemo(
    () => buildActiveVendor(acceptedVendorLocation, allPartnerPins),
    [acceptedVendorLocation, allPartnerPins]
  );
  const activeVendorLocation = useMemo(
    () => (activeVendorPin ? { lat: activeVendorPin.lat, lng: activeVendorPin.lng } : null),
    [activeVendorPin]
  );
  const shouldRenderPickupPin = useMemo(
    () => !isSameCoordinate(userPin, pickup),
    [pickup, userPin]
  );

  // Fallback curved line (used while real route loads)
  const fallbackCurve = useMemo(
    () =>
      activeVendorLocation
        ? {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: buildCurvedLineCoordinates(activeVendorLocation, pickup),
            },
            properties: {},
          }
        : null,
    [activeVendorLocation, pickup]
  );

  // ── Pulse animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // ── Mapbox Directions API ────────────────────────────────────────────────────
  const fetchRoute = useCallback(
    async (from: TrackingCoordinate, to: TrackingCoordinate) => {
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${from.lng},${from.lat};${to.lng},${to.lat}` +
          `?access_token=${MAPBOX_API_KEY}&geometries=geojson&overview=full&steps=true&language=en`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.routes?.[0]) {
          const route = data.routes[0];
          setRouteGeoJSON({
            type: 'Feature',
            geometry: route.geometry,
            properties: {},
          });

          const firstStep = route.legs?.[0]?.steps?.[0];
          if (firstStep) {
            const instruction: string = firstStep.maneuver.instruction;
            const distanceM: number = Math.round(firstStep.distance);
            onRouteUpdate?.({ instruction, distanceM });
          }

          lastRouteFetchRef.current = from;
        }
      } catch (err) {
        console.log('[OrderTrackingMap] Directions API error', err);
      }
    },
    [onRouteUpdate]
  );

  // Re-fetch route when vendor moves more than ~80m
  useEffect(() => {
    if (!activeVendorLocation || Platform.OS !== 'android') return;

    const last = lastRouteFetchRef.current;
    let shouldFetch = !last;

    if (last) {
      const movedM =
        calculateDistance(
          [last.lng, last.lat],
          [activeVendorLocation.lng, activeVendorLocation.lat]
        ) * 1000;
      shouldFetch = movedM > 80;
    }

    if (shouldFetch) {
      fetchRoute(activeVendorLocation, pickup);
    }
  }, [activeVendorLocation?.lat, activeVendorLocation?.lng, fetchRoute, pickup]);

  // Smooth camera follow (Android only)
  useEffect(() => {
    if (!activeVendorLocation || Platform.OS !== 'android') return;
    if (!cameraRef.current) return;

    (cameraRef.current as any).setCamera({
      centerCoordinate: [activeVendorLocation.lng, activeVendorLocation.lat],
      zoomLevel: 15,
      animationDuration: 900,
      animationMode: 'easeTo',
    });
  }, [activeVendorLocation?.lat, activeVendorLocation?.lng]);

  // ── Android – MapboxGL ───────────────────────────────────────────────────────

  if (Platform.OS === 'android') {
    const activeRouteShape = routeGeoJSON ?? fallbackCurve;

    return (
      <View style={styles.container}>
        <MapboxGL.MapView
          style={StyleSheet.absoluteFill}
          styleURL={MAP_STYLES.hybrid}
          compassEnabled={false}
          scaleBarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={activeVendorLocation ? 15 : 14.5}
            centerCoordinate={[
              activeVendorLocation?.lng ?? userPin.lng,
              activeVendorLocation?.lat ?? userPin.lat,
            ]}
            animationMode="flyTo"
            animationDuration={1200}
          />

          {/* Route – shadow + solid blue line */}
          {activeRouteShape && (
            <MapboxGL.ShapeSource id="tracking-route" shape={activeRouteShape as any}>
              {/* Glow / shadow */}
              <MapboxGL.LineLayer
                id="tracking-route-glow"
                style={{
                  lineColor: 'rgba(59,130,246,0.22)',
                  lineWidth: 12,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Main blue route */}
              <MapboxGL.LineLayer
                id="tracking-route-line"
                style={{
                  lineColor: '#3B82F6',
                  lineWidth: 5,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineOpacity: 1,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* Customer / User pin */}
          <MapboxGL.PointAnnotation id="user-marker" coordinate={[userPin.lng, userPin.lat]}>
            <View style={styles.userPinBoardWrap}>
              <Animated.View
                style={[
                  styles.userPinBoardPulse,
                  {
                    backgroundColor: 'rgba(37,99,235,0.16)',
                    transform: [{ scale: pulse }],
                  },
                ]}
              />
              <View style={styles.userPinBoard}>
                <User size={16} color="#fff" />
              </View>
            </View>
          </MapboxGL.PointAnnotation>

          {/* Pickup pin */}
          {shouldRenderPickupPin ? (
            <MapboxGL.PointAnnotation id="pickup-marker" coordinate={[pickup.lng, pickup.lat]}>
              <View style={styles.pickupPinWrap}>
                <View style={[styles.pickupPinCore, { backgroundColor: colors.primary }]}>
                  <Home size={14} color="#fff" />
                </View>
              </View>
            </MapboxGL.PointAnnotation>
          ) : null}

          {/* Chat-bubble vendor marker */}
          {activeVendorLocation ? (
            <MapboxGL.PointAnnotation
              id="active-vendor-marker"
              coordinate={[activeVendorLocation.lng, activeVendorLocation.lat]}
            >
              <ChatBubbleMarker
                name={activeVendorPin?.name || vendorName || 'Vendor'}
                color="#1D4ED8"
              />
            </MapboxGL.PointAnnotation>
          ) : null}
        </MapboxGL.MapView>
      </View>
    );
  }

  // ── iOS – react-native-maps ──────────────────────────────────────────────────

  const mapRef = useRef<MapView | null>(null);
  const animatedVendor = useRef(
    new AnimatedRegion({
      latitude: activeVendorLocation?.lat ?? pickup.lat,
      longitude: activeVendorLocation?.lng ?? pickup.lng,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;
  const previousVendorRef = useRef<TrackingCoordinate | null>(activeVendorLocation);
  const rotationRef = useRef(0);

  useEffect(() => {
    const points = [
      pickup,
      userPin,
      ...allPartnerPins.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
      ...(activeVendorLocation ? [activeVendorLocation] : []),
    ];
    if (!mapRef.current || !points.length) return;

    mapRef.current.fitToCoordinates(
      points.map((point) => ({ latitude: point.lat, longitude: point.lng })),
      {
        animated: true,
        edgePadding: { top: 80, right: 48, bottom: 220, left: 48 },
      }
    );
  }, [activeVendorLocation, allPartnerPins, pickup, userPin]);

  useEffect(() => {
    if (!activeVendorLocation) return;
    const previous = previousVendorRef.current;
    if (previous) {
      rotationRef.current = calculateBearing(previous, activeVendorLocation);
    }
    animatedVendor
      .timing({
        toValue: {
          latitude: activeVendorLocation.lat,
          longitude: activeVendorLocation.lng,
          latitudeDelta: 0,
          longitudeDelta: 0,
        },
        duration: 1000,
        useNativeDriver: false,
      } as any)
      .start();
    previousVendorRef.current = activeVendorLocation;
  }, [activeVendorLocation, animatedVendor]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={buildRegion(pickup)}
        moveOnMarkerPress={false}
        rotateEnabled
        pitchEnabled={false}
        toolbarEnabled={false}
        mapPadding={{ top: 40, right: 0, bottom: Platform.OS === 'ios' ? 120 : 100, left: 0 }}
      >
        <Circle
          center={{ latitude: pickup.lat, longitude: pickup.lng }}
          radius={dispatchRadiusKm * 1000}
          strokeColor="rgba(22,163,74,0.32)"
          fillColor="rgba(22,163,74,0.08)"
          strokeWidth={1.5}
        />

        <Marker coordinate={{ latitude: userPin.lat, longitude: userPin.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userPinBoardWrap}>
            <Animated.View
              style={[
                styles.userPinBoardPulse,
                {
                  backgroundColor: 'rgba(37,99,235,0.16)',
                  transform: [{ scale: pulse }],
                },
              ]}
            />
            <View style={styles.userPinBoard}>
              <User size={16} color="#fff" />
            </View>
          </View>
        </Marker>

        {shouldRenderPickupPin ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.pickupPinWrap}>
              <View style={[styles.pickupPinCore, { backgroundColor: colors.primary }]}>
                <Home size={14} color="#fff" />
              </View>
            </View>
          </Marker>
        ) : null}

        {activeVendorLocation && (
          <>
            <Polyline
              coordinates={[
                { latitude: activeVendorLocation.lat, longitude: activeVendorLocation.lng },
                {
                  latitude:
                    (activeVendorLocation.lat + pickup.lat) / 2 +
                    (pickup.lng - activeVendorLocation.lng) * 0.18,
                  longitude:
                    (activeVendorLocation.lng + pickup.lng) / 2 -
                    (pickup.lat - activeVendorLocation.lat) * 0.18,
                },
                { latitude: pickup.lat, longitude: pickup.lng },
              ]}
              strokeColor="#3B82F6"
              strokeWidth={4}
            />
            <MarkerAnimated coordinate={animatedVendor} anchor={{ x: 0.5, y: 1 }} flat>
              <ChatBubbleMarker
                name={activeVendorPin?.name || vendorName || 'Vendor'}
                color="#1D4ED8"
              />
            </MarkerAnimated>
          </>
        )}
      </MapView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Chat bubble marker ──────────────────────────────────────────────────────
  chatBubbleWrap: {
    alignItems: 'center',
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  chatBubbleName: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    maxWidth: 88,
  },
  chatBubblePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  // ── User pin ────────────────────────────────────────────────────────────────
  userPinBoardWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPinBoardPulse: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  userPinBoard: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: '#2563EB',
    borderColor: 'rgba(255,255,255,0.96)',
  },
  // ── Pickup pin ──────────────────────────────────────────────────────────────
  pickupPinWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPinCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // ── Legacy partner marker (iOS passive pins) ────────────────────────────────
  partnerMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  partnerMarkerVendor: {
    backgroundColor: 'rgba(30,41,59,0.86)',
    borderColor: 'rgba(255,255,255,0.92)',
  },
  partnerMarkerAgent: {
    backgroundColor: 'rgba(30,64,175,0.9)',
    borderColor: 'rgba(255,255,255,0.92)',
  },
});
