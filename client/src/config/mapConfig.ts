import MapboxGL from '@rnmapbox/maps';

export const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
export const KRUTRIM_API_KEY = process.env.EXPO_PUBLIC_KRUTRIM_API_KEY || '';
// Map Styles
export const MAP_STYLES = {
  streets: MapboxGL.StyleURL.Street,
  satellite: MapboxGL.StyleURL.Satellite,
  hybrid: MapboxGL.StyleURL.SatelliteStreet,
  outdoor: MapboxGL.StyleURL.Outdoors,
  light: MapboxGL.StyleURL.Light,
  dark: MapboxGL.StyleURL.Dark,
};


export const DEFAULT_MAP_STYLE = MAP_STYLES.streets;

const KRUTRIM_API_URL = 'https://api.olamaps.io/places/v1';



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
    input:query,
    limit: (options?.limit || 5).toString(),
  });

  if (options?.proximity) {
    params.append('location', `${options.proximity[1]},${options.proximity[0]}`);
  }
  if (options?.bbox) {
    params.append('bounds', `${options.bbox[1]},${options.bbox[0]},${options.bbox[3]},${options.bbox[2]}`);
  }

  return `${KRUTRIM_API_URL}/autocomplete?${params.toString()}`;
}

export function buildReverseGeocodingUrl(longitude: number, latitude: number) {
  const params = new URLSearchParams({
    api_key: KRUTRIM_API_KEY,
    latlng: `${latitude},${longitude}`,
  });
  return `${KRUTRIM_API_URL}/reverse-geocode?${params.toString()}`;
}

export const DEFAULT_CENTER: [number, number] = [72.8777, 19.0760]; // Mumbai

export function getIndiaBounds(): [number, number, number, number] {
  return [72.7, 18.8, 73.2, 19.3];
}

export const MAP_SETTINGS = {
  defaultZoom: 13,
  minZoom: 5,
  maxZoom: 18,
  searchMinCharacters: 3,
  searchDebounceMs: 500,
  animationDuration: 1000,
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



export default {
  MAPBOX_API_KEY,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  KRUTRIM_API_URL,
  MAP_SETTINGS,
  KRUTRIM_API_KEY,
  buildGeocodingUrl,
  buildReverseGeocodingUrl,
  isValidCoordinate,
  formatCoordinates,
  calculateDistance,
  isInIndia,
  getIndiaBounds,
};
