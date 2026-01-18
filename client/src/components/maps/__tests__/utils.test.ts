/**
 * Unit tests for map coordinate conversion utilities
 */

import {
  calculateDelta,
  calculateZoomLevel,
  validateCoordinates,
  formatCoordinates,
  coordinatesToRegion,
  regionToCoordinates,
  calculateDistance,
  hasSignificantMovement,
  clampCoordinates,
  roundCoordinates,
} from '../utils';
import { Coordinates, Region } from '../types';

describe('Map Utilities', () => {
  describe('calculateDelta', () => {
    it('should convert zoom level to delta correctly', () => {
      // Zoom level 16 should give delta of ~0.0055
      const delta16 = calculateDelta(16);
      expect(delta16).toBeCloseTo(0.00549316, 5);
      
      // Zoom level 10 should give delta of ~0.3515
      const delta10 = calculateDelta(10);
      expect(delta10).toBeCloseTo(0.3515625, 5);
      
      // Zoom level 0 should give delta of 360
      const delta0 = calculateDelta(0);
      expect(delta0).toBe(360);
    });
  });

  describe('calculateZoomLevel', () => {
    it('should convert delta to zoom level correctly', () => {
      // Delta of ~0.0055 should give zoom level 16
      const zoom1 = calculateZoomLevel(0.00549316);
      expect(zoom1).toBeCloseTo(16, 1);
      
      // Delta of ~0.3515 should give zoom level 10
      const zoom2 = calculateZoomLevel(0.3515625);
      expect(zoom2).toBeCloseTo(10, 1);
      
      // Delta of 360 should give zoom level 0
      const zoom3 = calculateZoomLevel(360);
      expect(zoom3).toBe(0);
    });
    
    it('should be inverse of calculateDelta', () => {
      const originalZoom = 14;
      const delta = calculateDelta(originalZoom);
      const recoveredZoom = calculateZoomLevel(delta);
      expect(recoveredZoom).toBeCloseTo(originalZoom, 10);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(validateCoordinates([72.8777, 19.0760])).toBe(true);
      expect(validateCoordinates([0, 0])).toBe(true);
      expect(validateCoordinates([-180, -90])).toBe(true);
      expect(validateCoordinates([180, 90])).toBe(true);
    });

    it('should reject invalid longitude', () => {
      expect(validateCoordinates([181, 19.0760])).toBe(false);
      expect(validateCoordinates([-181, 19.0760])).toBe(false);
      expect(validateCoordinates([200, 0])).toBe(false);
    });

    it('should reject invalid latitude', () => {
      expect(validateCoordinates([72.8777, 91])).toBe(false);
      expect(validateCoordinates([72.8777, -91])).toBe(false);
      expect(validateCoordinates([0, 100])).toBe(false);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with default precision (6 decimal places)', () => {
      const formatted = formatCoordinates([72.8777, 19.0760]);
      expect(formatted).toBe('19.076000, 72.877700');
    });

    it('should format coordinates with custom precision', () => {
      const formatted = formatCoordinates([72.87771234, 19.07601234], 4);
      expect(formatted).toBe('19.0760, 72.8777');
    });

    it('should maintain 6 decimal places for accuracy requirement', () => {
      const formatted = formatCoordinates([72.87771234, 19.07601234]);
      // Should have exactly 6 decimal places
      const parts = formatted.split(', ');
      expect(parts[0].split('.')[1].length).toBe(6);
      expect(parts[1].split('.')[1].length).toBe(6);
    });
  });

  describe('coordinatesToRegion', () => {
    it('should convert coordinates and zoom to Apple Maps region', () => {
      const coords: Coordinates = [72.8777, 19.0760];
      const zoom = 16;
      const region = coordinatesToRegion(coords, zoom);
      
      expect(region.latitude).toBe(19.0760);
      expect(region.longitude).toBe(72.8777);
      expect(region.latitudeDelta).toBeCloseTo(0.00549316, 5);
      expect(region.longitudeDelta).toBeCloseTo(0.00549316, 5);
    });
  });

  describe('regionToCoordinates', () => {
    it('should convert Apple Maps region to coordinates and zoom', () => {
      const region: Region = {
        latitude: 19.0760,
        longitude: 72.8777,
        latitudeDelta: 0.00549316,
        longitudeDelta: 0.00549316,
      };
      
      const result = regionToCoordinates(region);
      
      expect(result.coords[0]).toBe(72.8777);
      expect(result.coords[1]).toBe(19.0760);
      expect(result.zoomLevel).toBeCloseTo(16, 1);
    });
    
    it('should be inverse of coordinatesToRegion', () => {
      const originalCoords: Coordinates = [72.8777, 19.0760];
      const originalZoom = 14;
      
      const region = coordinatesToRegion(originalCoords, originalZoom);
      const result = regionToCoordinates(region);
      
      expect(result.coords[0]).toBe(originalCoords[0]);
      expect(result.coords[1]).toBe(originalCoords[1]);
      expect(result.zoomLevel).toBeCloseTo(originalZoom, 10);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between two points ~38 meters apart
      const coords1: Coordinates = [72.8777, 19.0760];
      const coords2: Coordinates = [72.8780, 19.0762];
      const distance = calculateDistance(coords1, coords2);
      
      expect(distance).toBeGreaterThan(35);
      expect(distance).toBeLessThan(40);
    });

    it('should return 0 for same coordinates', () => {
      const coords: Coordinates = [72.8777, 19.0760];
      const distance = calculateDistance(coords, coords);
      
      expect(distance).toBe(0);
    });
  });

  describe('hasSignificantMovement', () => {
    it('should detect significant movement above threshold', () => {
      const coords1: Coordinates = [72.8777, 19.0760];
      const coords2: Coordinates = [72.8780, 19.0762];
      
      expect(hasSignificantMovement(coords1, coords2)).toBe(true);
    });

    it('should not detect movement below threshold', () => {
      const coords1: Coordinates = [72.8777, 19.0760];
      const coords2: Coordinates = [72.87770001, 19.07600001];
      
      expect(hasSignificantMovement(coords1, coords2)).toBe(false);
    });

    it('should use default threshold of 0.00002 degrees', () => {
      const coords1: Coordinates = [72.8777, 19.0760];
      const coords2: Coordinates = [72.87771, 19.0760];
      
      // 0.00001 difference is below threshold
      expect(hasSignificantMovement(coords1, coords2)).toBe(false);
      
      const coords3: Coordinates = [72.87773, 19.0760];
      // 0.00003 difference is above threshold
      expect(hasSignificantMovement(coords1, coords3)).toBe(true);
    });
  });

  describe('clampCoordinates', () => {
    it('should clamp longitude to valid range', () => {
      expect(clampCoordinates([200, 0])).toEqual([180, 0]);
      expect(clampCoordinates([-200, 0])).toEqual([-180, 0]);
    });

    it('should clamp latitude to valid range', () => {
      expect(clampCoordinates([0, 100])).toEqual([0, 90]);
      expect(clampCoordinates([0, -100])).toEqual([0, -90]);
    });

    it('should not modify valid coordinates', () => {
      const coords: Coordinates = [72.8777, 19.0760];
      expect(clampCoordinates(coords)).toEqual(coords);
    });
  });

  describe('roundCoordinates', () => {
    it('should round coordinates to default precision (6 decimal places)', () => {
      const coords: Coordinates = [72.87771234, 19.07601234];
      const rounded = roundCoordinates(coords);
      
      expect(rounded[0]).toBeCloseTo(72.877712, 6);
      expect(rounded[1]).toBeCloseTo(19.076012, 6);
    });

    it('should round coordinates to custom precision', () => {
      const coords: Coordinates = [72.87771234, 19.07601234];
      const rounded = roundCoordinates(coords, 4);
      
      expect(rounded[0]).toBe(72.8777);
      expect(rounded[1]).toBe(19.0760);
    });

    it('should maintain 6 decimal places for accuracy requirement', () => {
      const coords: Coordinates = [72.87771234567, 19.07601234567];
      const rounded = roundCoordinates(coords);
      
      // Verify precision is exactly 6 decimal places
      const lng = rounded[0].toString();
      const lat = rounded[1].toString();
      
      if (lng.includes('.')) {
        expect(lng.split('.')[1].length).toBeLessThanOrEqual(6);
      }
      if (lat.includes('.')) {
        expect(lat.split('.')[1].length).toBeLessThanOrEqual(6);
      }
    });
  });
});
