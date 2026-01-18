/**
 * Utility functions for map coordinate conversions and validations
 * 
 * These utilities handle conversions between different coordinate formats
 * used by Apple Maps and Mapbox, as well as validation and formatting.
 */

import { Coordinates, Region } from './types';

 
export function calculateDelta(zoomLevel: number): number {
  return 360 / Math.pow(2, zoomLevel);
}

/**
 * Convert latitude/longitude delta to zoom level
 * 
 * Inverse of calculateDelta - converts Apple Maps delta back to zoom level.
 * 
 * Formula: zoomLevel = log2(360 / delta)
 * 
 * @param delta Delta value from Apple Maps region
 * @returns Zoom level (0-20)
 * 
 * @example
 * calculateZoomLevel(0.0055) // Returns ~16
 * calculateZoomLevel(0.35) // Returns ~10
 */
export function calculateZoomLevel(delta: number): number {
  return Math.log2(360 / delta);
}

export function validateCoordinates(coords: Coordinates): boolean {
  const [lng, lat] = coords;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Format coordinates for display
 * 
 * Formats coordinates to a human-readable string with specified precision
 * 
 * @param coords Coordinates to format [longitude, latitude]
 * @param precision Number of decimal places (default: 6 for ~0.1m accuracy)
 * @returns Formatted string "latitude, longitude"
 * 
 * @example
 * formatCoordinates([72.8777, 19.0760]) // Returns "19.076000, 72.877700"
 * formatCoordinates([72.8777, 19.0760], 4) // Returns "19.0760, 72.8777"
 */
export function formatCoordinates(coords: Coordinates, precision: number = 6): string {
  const [lng, lat] = coords;
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Convert coordinates to Apple Maps region format
 * 
 * Converts [longitude, latitude] tuple and zoom level to Apple Maps Region object
 * 
 * @param coords Coordinates [longitude, latitude]
 * @param zoomLevel Zoom level (0-20)
 * @returns Region object for Apple Maps
 * 
 * @example
 * coordinatesToRegion([72.8777, 19.0760], 16)
 * // Returns { latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.0055, longitudeDelta: 0.0055 }
 */
export function coordinatesToRegion(coords: Coordinates, zoomLevel: number): Region {
  const [lng, lat] = coords;
  const delta = calculateDelta(zoomLevel);
  
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/**
 * Convert Apple Maps region to coordinates and zoom level
 * 
 * Extracts [longitude, latitude] tuple and zoom level from Apple Maps Region
 * 
 * @param region Apple Maps Region object
 * @returns Object with coords and zoomLevel
 * 
 * @example
 * regionToCoordinates({ latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.0055, longitudeDelta: 0.0055 })
 * // Returns { coords: [72.8777, 19.0760], zoomLevel: 16 }
 */
export function regionToCoordinates(region: Region): { coords: Coordinates; zoomLevel: number } {
  return {
    coords: [region.longitude, region.latitude],
    zoomLevel: calculateZoomLevel(region.latitudeDelta),
  };
}

/**
 * Calculate distance between two coordinates in meters
 * 
 * Uses Haversine formula to calculate great-circle distance
 * 
 * @param coords1 First coordinates [longitude, latitude]
 * @param coords2 Second coordinates [longitude, latitude]
 * @returns Distance in meters
 * 
 * @example
 * calculateDistance([72.8777, 19.0760], [72.8780, 19.0762])
 * // Returns ~31.4 (approximately 31 meters)
 */
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Check if two coordinates are significantly different
 * 
 * Determines if the distance between coordinates exceeds a threshold
 * Used to distinguish pan from zoom operations
 * 
 * @param coords1 First coordinates [longitude, latitude]
 * @param coords2 Second coordinates [longitude, latitude]
 * @param threshold Threshold in degrees (default: 0.00002 ≈ 2 meters)
 * @returns true if coordinates differ by more than threshold
 * 
 * @example
 * hasSignificantMovement([72.8777, 19.0760], [72.8777, 19.0760]) // Returns false (same location)
 * hasSignificantMovement([72.8777, 19.0760], [72.8780, 19.0762]) // Returns true (moved ~31m)
 */
export function hasSignificantMovement(
  coords1: Coordinates,
  coords2: Coordinates,
  threshold: number = 0.00002
): boolean {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  
  return (
    Math.abs(lng1 - lng2) > threshold ||
    Math.abs(lat1 - lat2) > threshold
  );
}

/**
 * Clamp coordinates to valid ranges
 * 
 * Ensures coordinates stay within valid bounds by clamping to limits
 * 
 * @param coords Coordinates to clamp [longitude, latitude]
 * @returns Clamped coordinates
 * 
 * @example
 * clampCoordinates([200, 100]) // Returns [180, 90]
 * clampCoordinates([-200, -100]) // Returns [-180, -90]
 */
export function clampCoordinates(coords: Coordinates): Coordinates {
  const [lng, lat] = coords;
  
  return [
    Math.max(-180, Math.min(180, lng)),
    Math.max(-90, Math.min(90, lat)),
  ];
}

/**
 * Round coordinates to specified precision
 * 
 * Rounds coordinates to reduce precision (useful for caching/comparison)
 * 
 * @param coords Coordinates to round [longitude, latitude]
 * @param precision Number of decimal places (default: 6)
 * @returns Rounded coordinates
 * 
 * @example
 * roundCoordinates([72.87771234, 19.07601234]) // Returns [72.877712, 19.076012]
 * roundCoordinates([72.87771234, 19.07601234], 4) // Returns [72.8777, 19.0760]
 */
export function roundCoordinates(coords: Coordinates, precision: number = 6): Coordinates {
  const [lng, lat] = coords;
  const factor = Math.pow(10, precision);
  
  return [
    Math.round(lng * factor) / factor,
    Math.round(lat * factor) / factor,
  ];
}
