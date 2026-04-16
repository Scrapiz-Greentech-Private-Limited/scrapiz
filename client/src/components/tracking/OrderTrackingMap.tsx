import React, { useEffect, useMemo, useRef } from 'react';
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
import { Home, Truck, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { MAP_STYLES } from '../../config/mapConfig';
import { TrackingCoordinate, TrackingPhase, TrackingVendorPin } from '../../types/orderTracking';

interface OrderTrackingMapProps {
  pickup: TrackingCoordinate;
  phase: TrackingPhase;
  vendorPins: TrackingVendorPin[];
  acceptedVendorLocation: TrackingCoordinate | null;
  dispatchRadiusKm?: number;
  notifiedVendorCount?: number;
  distanceLabel?: string | null;
  userLocation?: TrackingCoordinate | null;
}

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

    if (matchingPin) {
      return matchingPin;
    }

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

function buildBounds(
  pickup: TrackingCoordinate,
  partnerPins: TrackingVendorPin[],
  userPin: TrackingCoordinate,
  activeVendorLocation: TrackingCoordinate | null
) {
  const points = [
    pickup,
    userPin,
    ...(activeVendorLocation ? [activeVendorLocation] : []),
    ...partnerPins
      .filter((pin) => typeof pin.lat === 'number' && typeof pin.lng === 'number')
      .map((pin) => ({ lat: pin.lat, lng: pin.lng })),
  ];
  if (points.length < 2) {
    return null;
  }

  const lngValues = points.map((point) => point.lng);
  const latValues = points.map((point) => point.lat);

  return {
    ne: [Math.max(...lngValues), Math.max(...latValues)] as [number, number],
    sw: [Math.min(...lngValues), Math.min(...latValues)] as [number, number],
  };
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

function getActivePinStyle(pin: TrackingVendorPin | null) {
  if (pin?.pin_role === 'agent') {
    return styles.partnerMarkerActiveAgent;
  }
  return styles.partnerMarkerActiveVendor;
}

export function OrderTrackingMap({
  pickup,
  phase,
  vendorPins,
  acceptedVendorLocation,
  dispatchRadiusKm = 10,
  notifiedVendorCount = 0,
  distanceLabel,
  userLocation = null,
}: OrderTrackingMapProps) {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.7)).current;
  const allPartnerPins = useMemo(
    () => vendorPins.filter((pin) => typeof pin.lat === 'number' && typeof pin.lng === 'number'),
    [vendorPins]
  );
  const userPin = useMemo(
    () => userLocation || pickup,
    [userLocation, pickup]
  );
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
  const mapboxCurve = useMemo(
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
  const mapboxBounds = useMemo(
    () => buildBounds(pickup, allPartnerPins, userPin, activeVendorLocation),
    [pickup, allPartnerPins, userPin, activeVendorLocation]
  );
  const mapCameraKey = useMemo(() => {
    const parts = [
      pickup.lat.toFixed(6),
      pickup.lng.toFixed(6),
      activeVendorLocation?.lat?.toFixed(6) || 'no-vendor',
      activeVendorLocation?.lng?.toFixed(6) || 'no-vendor',
      userPin?.lat?.toFixed(6) || 'no-user',
      userPin?.lng?.toFixed(6) || 'no-user',
    ];
    return parts.join(':');
  }, [pickup, activeVendorLocation, userPin]);

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

  if (Platform.OS === 'android') {
    const passiveVendorPins = allPartnerPins.filter((pin) => {
      if (pin.lat === undefined || pin.lng === undefined) {
        return false;
      }

      if (!activeVendorPin) {
        return true;
      }

      return !(pin.vendor_id === activeVendorPin.vendor_id && pin.pin_role === activeVendorPin.pin_role);
    });

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
            key={mapCameraKey}
            zoomLevel={activeVendorLocation ? 11.8 : 14.5}
            centerCoordinate={[
              (userPin.lng ?? pickup.lng),
              (userPin.lat ?? pickup.lat),
            ]}
            bounds={
              mapboxBounds
                ? {
                    ne: mapboxBounds.ne,
                    sw: mapboxBounds.sw,
                    paddingTop: 80,
                    paddingBottom: 180,
                    paddingLeft: 56,
                    paddingRight: 56,
                  }
                : undefined
            }
            animationMode="flyTo"
            animationDuration={1200}
          />

          {activeVendorLocation && mapboxCurve ? (
            <MapboxGL.ShapeSource id="tracking-route" shape={mapboxCurve as any}>
              <MapboxGL.LineLayer
                id="tracking-route-line"
                style={{
                  lineColor: colors.primary,
                  lineWidth: 3,
                  lineDasharray: [2, 2],
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineOpacity: 0.9,
                }}
              />
            </MapboxGL.ShapeSource>
          ) : null}

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

          {shouldRenderPickupPin ? (
            <MapboxGL.PointAnnotation id="pickup-marker" coordinate={[pickup.lng, pickup.lat]}>
              <View style={styles.pickupPinWrap}>
                <View style={[styles.pickupPinCore, { backgroundColor: colors.primary }]}>
                  <Home size={14} color="#fff" />
                </View>
              </View>
            </MapboxGL.PointAnnotation>
          ) : null}

          {activeVendorLocation ? (
            <MapboxGL.PointAnnotation
              id="active-vendor-marker"
              coordinate={[activeVendorLocation.lng, activeVendorLocation.lat]}
            >
              <View style={[styles.partnerMarker, getActivePinStyle(activeVendorPin)]}>
                <Truck size={18} color="#fff" />
              </View>
            </MapboxGL.PointAnnotation>
          ) : null}

          {passiveVendorPins.map((vendor) => (
            <MapboxGL.PointAnnotation
              key={`vendor-pin-${vendor.vendor_id}`}
              id={`vendor-pin-${vendor.vendor_id}`}
              coordinate={[vendor.lng, vendor.lat]}
            >
              <View style={[styles.partnerMarker, getPassivePinStyle(vendor), { borderColor: colors.border }]}>
                <Truck size={16} color="#fff" />
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>
      </View>
    );
  }

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
    if (!mapRef.current || !points.length) {
      return;
    }

    mapRef.current.fitToCoordinates(
      points.map((point) => ({ latitude: point.lat, longitude: point.lng })),
      {
        animated: true,
        edgePadding: { top: 80, right: 48, bottom: 220, left: 48 },
      }
    );
  }, [activeVendorLocation, allPartnerPins, pickup, userPin]);

  useEffect(() => {
    if (!activeVendorLocation) {
      return;
    }

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

  const visibleVendorPins = allPartnerPins;

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

        {visibleVendorPins.map((vendor) => {
          const isActive =
            !!activeVendorPin &&
            vendor.vendor_id === activeVendorPin.vendor_id &&
            vendor.pin_role === activeVendorPin.pin_role;

          if (isActive && activeVendorLocation) {
            return null;
          }

          return (
            <Marker
              key={`pin-${vendor.vendor_id}`}
              coordinate={{ latitude: vendor.lat, longitude: vendor.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.partnerMarker, getPassivePinStyle(vendor), { borderColor: colors.border }]}>
                <Truck size={16} color={isDark ? '#e2e8f0' : '#64748b'} />
              </View>
            </Marker>
          );
        })}

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
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 6]}
            />
            <MarkerAnimated coordinate={animatedVendor} anchor={{ x: 0.5, y: 0.5 }} flat>
              <View
                style={[
                  styles.partnerMarker,
                  getActivePinStyle(activeVendorPin),
                  { transform: [{ rotate: `${rotationRef.current}deg` }] },
                ]}
              >
                <Truck size={18} color="#fff" />
              </View>
            </MarkerAnimated>
          </>
        )}
      </MapView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  partnerMarkerActiveVendor: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16a34a',
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  partnerMarkerActiveAgent: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 8,
  },
});
