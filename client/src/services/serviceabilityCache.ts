import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceableCity } from '../api/apiService';

/**
 * Interface for cached serviceability data
 */
export interface CachedServiceData {
  cities: ServiceableCity[];
  pincodes: string[];
  timestamp: number;
}

/**
 * Storage key for cached serviceability data
 */
const CACHE_KEY = '@scrapiz_serviceability_cache';

/**
 * Cache expiration time in milliseconds (24 hours)
 */
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Service for managing cached serviceability data
 * Provides offline support for serviceability checks with 24-hour cache expiration
 */
export class CacheService {
  /**
   * Get cached serviceability data
   * @returns Cached data or null if cache is empty or invalid
   */
  static async getCachedData(): Promise<CachedServiceData | null> {
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cachedString) {
        console.log('📦 Cache miss: No cached data found');
        return null;
      }

      const cachedData: CachedServiceData = JSON.parse(cachedString);
      
      // Validate cache structure
      if (!cachedData.cities || !cachedData.pincodes || !cachedData.timestamp) {
        console.warn('⚠️ Cache corrupted: Missing required fields');
        await CacheService.clearCache();
        return null;
      }

      console.log('📦 Cache hit:', {
        cities: cachedData.cities.length,
        pincodes: cachedData.pincodes.length,
        age: Date.now() - cachedData.timestamp,
      });

      return cachedData;
    } catch (error) {
      console.error('❌ Failed to read cache:', error);
      // Clear corrupted cache
      await CacheService.clearCache();
      return null;
    }
  }

  /**
   * Store serviceability data in cache
   * @param data - Serviceability data to cache
   */
  static async setCachedData(data: CachedServiceData): Promise<void> {
    try {
      // Validate input data
      if (!data.cities || !Array.isArray(data.cities)) {
        throw new Error('Invalid cache data: cities must be an array');
      }
      if (!data.pincodes || !Array.isArray(data.pincodes)) {
        throw new Error('Invalid cache data: pincodes must be an array');
      }
      if (!data.timestamp || typeof data.timestamp !== 'number') {
        throw new Error('Invalid cache data: timestamp must be a number');
      }

      const cacheString = JSON.stringify(data);
      await AsyncStorage.setItem(CACHE_KEY, cacheString);
      
      console.log('✅ Cache updated:', {
        cities: data.cities.length,
        pincodes: data.pincodes.length,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to write cache:', error);
      throw error;
    }
  }

  /**
   * Check if cached data is still valid (not expired)
   * @returns true if cache exists and is not expired, false otherwise
   */
  static async isCacheValid(): Promise<boolean> {
    try {
      const cachedData = await CacheService.getCachedData();
      
      if (!cachedData) {
        return false;
      }

      const age = Date.now() - cachedData.timestamp;
      const isValid = age < CACHE_EXPIRATION_MS;

      if (!isValid) {
        console.log('⏰ Cache expired:', {
          age: Math.round(age / 1000 / 60 / 60) + ' hours',
          maxAge: '24 hours',
        });
      }

      return isValid;
    } catch (error) {
      console.error('❌ Failed to check cache validity:', error);
      return false;
    }
  }

  /**
   * Clear all cached serviceability data
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache age in milliseconds
   * @returns Age of cache in milliseconds, or null if cache doesn't exist
   */
  static async getCacheAge(): Promise<number | null> {
    try {
      const cachedData = await CacheService.getCachedData();
      
      if (!cachedData) {
        return null;
      }

      return Date.now() - cachedData.timestamp;
    } catch (error) {
      console.error('❌ Failed to get cache age:', error);
      return null;
    }
  }

  /**
   * Refresh cache with new data from API
   * @param cities - Array of serviceable cities
   * @param pincodes - Array of serviceable pincodes
   */
  static async refreshCache(
    cities: ServiceableCity[],
    pincodes: string[]
  ): Promise<void> {
    const cacheData: CachedServiceData = {
      cities,
      pincodes,
      timestamp: Date.now(),
    };

    await CacheService.setCachedData(cacheData);
  }
}
