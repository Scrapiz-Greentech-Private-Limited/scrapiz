import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.scrapiz.in/api';

interface VersionCheckResponse {
  force_update: boolean;
  update_url: string;
  min_app_version: string;
  maintenance_mode: boolean;
}

/**
 * Get current app version from Expo config
 */
export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || 
         Constants.manifest?.version || 
         '1.0.0';
};

/**
 * Get platform identifier
 */
export const getPlatform = (): 'ios' | 'android' => {
  return Platform.OS === 'ios' ? 'ios' : 'android';
};

/**
 * Check if app version meets minimum requirements
 * Returns force_update flag and update URL if update is required
 */
export const checkAppVersion = async (): Promise<VersionCheckResponse> => {
  try {
    const appVersion = getAppVersion();
    const platform = getPlatform();
    
    console.log('🔍 Checking app version:', { appVersion, platform });
    
    const response = await fetch(
      `${API_URL}/content/app-config/?app_version=${appVersion}&platform=${platform}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Version check failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Version check response:', data);
    
    return {
      force_update: data.force_update || false,
      update_url: data.update_url || '',
      min_app_version: data.min_app_version || '1.0.0',
      maintenance_mode: data.maintenance_mode || false,
    };
  } catch (error) {
    console.error('❌ Version check error:', error);
    // Fail open - don't block users if version check fails
    return {
      force_update: false,
      update_url: '',
      min_app_version: '1.0.0',
      maintenance_mode: false,
    };
  }
};

/**
 * Compare two semantic versions
 * Returns true if version1 < version2
 */
export const isVersionLessThan = (version1: string, version2: string): boolean => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;
    
    if (v1 < v2) return true;
    if (v1 > v2) return false;
  }
  
  return false;
};
