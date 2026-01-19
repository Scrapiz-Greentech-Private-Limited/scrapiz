import MapboxGL from '@rnmapbox/maps';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
export const KRUTRIM_API_KEY = process.env.EXPO_PUBLIC_KRUTRIM_API_KEY || '';
export const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

export const getSessionToken = () => uuidv4();

// Map Styles
export const MAP_STYLES = {
  streets: MapboxGL.StyleURL.Street,
  satellite: MapboxGL.StyleURL.Satellite,
  hybrid: MapboxGL.StyleURL.SatelliteStreet,
  outdoor: MapboxGL.StyleURL.Outdoors,
  light: MapboxGL.StyleURL.Light,
  dark: MapboxGL.StyleURL.Dark,
  customURL: 'mapbox://styles/ayaanamjad/cmidipsmh002e01qx1erzb28k',
  // Custom navigation style for better map visibility
  navigation: 'mapbox://styles/mapbox/navigation-day-v1',
  navigationNight: 'mapbox://styles/mapbox/navigation-night-v1',
};

export const DEFAULT_MAP_STYLE = MAP_STYLES.hybrid;

const KRUTRIM_API_URL = 'https://api.olamaps.io/places/v1';

// Mumbai/Bhayandar area bounds
export function getLocalBounds(center?: [number, number]): [number, number, number, number] {
  if (center) {
    // Create a 200m box around the center point (reduced from 20km)
    const latOffset = 0.0018; // ~200m
    const lonOffset = 0.0018; // ~200m
    return [
      center[0] - lonOffset, // min longitude
      center[1] - latOffset, // min latitude
      center[0] + lonOffset, // max longitude
      center[1] + latOffset, // max latitude
    ];
  }
  // Default: Bhayandar/Mumbai area
  return [72.7, 18.8, 73.2, 19.4];
}

// India bounds
export function getIndiaBounds(): [number, number, number, number] {
  return [68.7, 8.4, 97.25, 37.6];
}

export function buildGeocodingUrl(
  query: string,
  options?: {
    limit?: number;
    proximity?: [number, number];
    bbox?: [number, number, number, number];
  }
): string {
  const params = new URLSearchParams({
    api_key: KRUTRIM_API_KEY,
    input: query,
    limit: (options?.limit || 5).toString(),
  });

  // Add proximity bias for better local results
  if (options?.proximity) {
    params.append('location', `${options.proximity[1]},${options.proximity[0]}`);
  }

  // Use local bounds for better search results
  if (options?.bbox) {
    params.append('bounds', `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]}`);
  } else if (options?.proximity) {
    // If no bbox provided but have proximity, create local bounds
    const localBounds = getLocalBounds(options.proximity);
    params.append('bounds', `${localBounds[1]},${localBounds[0]},${localBounds[3]},${localBounds[2]}`);
  }

  return `${KRUTRIM_API_URL}/autocomplete?${params.toString()}`;
}

export function buildKrutrimAutocompleteUrl(query: string) {
  return `${KRUTRIM_API_URL}/autocomplete?input=${encodeURIComponent(query)}&api_key=${KRUTRIM_API_KEY}`;
}
export function buildKrutrimPlaceDetailsUrl(placeId: string) {
  return `${KRUTRIM_API_URL}/details?place_id=${placeId}&api_key=${KRUTRIM_API_KEY}`;
}
export function buildGoogleReverseGeocodeUrl(latitude: number, longitude: number) {
  return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
}
export function buildGoogleAutocompletePayload(
  query: string,
  sessionToken: string,
  userLocation?: { lat: number; lng: number } | number[] | null
) {
  let lat, lng;
  if (Array.isArray(userLocation)) {
    [lng, lat] = userLocation;
  } else if (userLocation && 'lat' in userLocation) {
    lat = userLocation.lat;
    lng = userLocation.lng;
  }

  const payload: any = {
    input: query,
    sessionToken: sessionToken,
    includedRegionCodes: ['in'], // Restrict to India
  };

  // Add location bias if available
  if (lat && lng) {
    payload.locationBias = {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: 5000.0, // 5km radius
      },
    };
  }

  return payload;
}

export function buildGoogleGeocodeUrl(lat: number, lng: number) {
  return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
}

export function buildGooglePlaceDetailsPayload(sessionToken: string) {
  return {
    sessionToken: sessionToken,
  };
}

export function buildReverseGeocodingUrl(longitude: number, latitude: number) {
  const params = new URLSearchParams({
    api_key: KRUTRIM_API_KEY,
    latlng: `${latitude},${longitude}`,
  });
  return `${KRUTRIM_API_URL}/reverse-geocode?${params.toString()}`;
}

// Default center - Mumbai, Maharashtra (Bandra area - central Mumbai location)
// Coordinates: Longitude 72.8295°E, Latitude 19.0596°N
// Format: [longitude, latitude] - Mapbox/GeoJSON standard
export const DEFAULT_CENTER: [number, number] = [72.8295, 19.0596];

console.log('📍 Map Config: DEFAULT_CENTER set to Mumbai:', DEFAULT_CENTER);

export const MAP_SETTINGS = {
  defaultZoom: 18, // Increased from 16 for rooftop-level precision
  minZoom: 10, // Prevent zooming out too far
  maxZoom: 20, // Maximum detail level
  searchMinCharacters: 3,
  searchDebounceMs: 500,
  animationDuration: 1000,
  // Search radius in km (reduced from 20km to 0.2km = 200m)
  searchRadius: 0.2,
};

export function isValidCoordinate(longitude: number, latitude: number): boolean {
  return (
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  longitude: number,
  latitude: number,
  precision: number = 6
): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if location is within India bounds (approximate)
 */
export function isInIndia(longitude: number, latitude: number): boolean {
  return (
    longitude >= 68.7 &&
    longitude <= 97.25 &&
    latitude >= 8.4 &&
    latitude <= 37.6
  );
}

/**
 * Check if location is within search radius of a center point
 */
export function isWithinSearchRadius(
  centerCoord: [number, number],
  targetCoord: [number, number],
  radiusKm: number = MAP_SETTINGS.searchRadius
): boolean {
  const distance = calculateDistance(centerCoord, targetCoord);
  return distance <= radiusKm;
}

export default {
  MAPBOX_API_KEY,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  KRUTRIM_API_URL,
  MAP_SETTINGS,
  KRUTRIM_API_KEY,
  GOOGLE_API_KEY,
  buildGeocodingUrl,
  buildReverseGeocodingUrl,
  buildGoogleAutocompletePayload,
  buildGooglePlaceDetailsPayload,
  isValidCoordinate,
  formatCoordinates,
  calculateDistance,
  isInIndia,
  getIndiaBounds,
  getLocalBounds,
  isWithinSearchRadius,
};