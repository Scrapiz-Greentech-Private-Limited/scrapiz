/**
 * Utility to check if sell screen gating should be enforced
 * This allows backend control over whether users need to pass serviceability checks
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface AppConfig {
  enforce_sell_screen_gate?: boolean;
  maintenance_mode?: boolean;
  min_app_version?: string;
  enable_location_skip?: boolean;
}

/**
 * Check if sell screen gating is enforced from backend
 * @returns true if gating should be enforced, false otherwise
 * @default true (fail closed - enforce by default if API fails)
 */
export const isSellScreenGateEnforced = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/content/app-config/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch app config, defaulting to enforced');
      return true; // Fail closed - enforce by default
    }

    const config: AppConfig = await response.json();
    
    // If the field is not set, default to true (enforced)
    const shouldEnforce = config.enforce_sell_screen_gate !== false;
    
    console.log('📋 Sell screen gate enforcement:', shouldEnforce);
    return shouldEnforce;
  } catch (error) {
    console.error('Error checking sell screen enforcement:', error);
    // On network error, default to enforced (fail closed)
    return true;
  }
};

/**
 * Cache the enforcement status to avoid repeated API calls
 */
let cachedEnforcementStatus: boolean | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const isSellScreenGateEnforcedCached = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Return cached value if still valid
  if (
    cachedEnforcementStatus !== null &&
    cacheTimestamp !== null &&
    now - cacheTimestamp < CACHE_DURATION_MS
  ) {
    return cachedEnforcementStatus;
  }
  
  // Fetch fresh value
  const isEnforced = await isSellScreenGateEnforced();
  cachedEnforcementStatus = isEnforced;
  cacheTimestamp = now;
  
  return isEnforced;
};

/**
 * Clear the enforcement status cache
 * Useful when you want to force a fresh check
 */
export const clearEnforcementCache = (): void => {
  cachedEnforcementStatus = null;
  cacheTimestamp = null;
};
