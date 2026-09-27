/**
 * Utility to check if sell screen gating should be enforced
 * This allows backend control over whether users need to pass serviceability checks
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.scrapiz.in/api';

export interface AppConfig {
  enforce_sell_screen_gate?: boolean;
  sell_screen_gate_mode?: 'none' | 'pincode' | 'city';
  pincode_gate_enabled?: boolean;
  city_gate_enabled?: boolean;
  maintenance_mode?: boolean;
  min_app_version?: string;
  enable_location_skip?: boolean;
}

export interface SellScreenGateConfig {
  enforced: boolean;
  mode: 'none' | 'pincode' | 'city';
}

/**
 * Check if sell screen gating is enforced from backend
 * @returns true if gating should be enforced, false otherwise
 * @default true (fail closed - enforce by default if API fails)
 */
export const isSellScreenGateEnforced = async (): Promise<boolean> => {
  const config = await getSellScreenGateConfig();
  return config.enforced;
};

export const getSellScreenGateConfig = async (): Promise<SellScreenGateConfig> => {
  try {
    console.log('🔍 Checking sell screen enforcement from:', `${API_URL}/content/app-config/`);
    
    const response = await fetch(`${API_URL}/content/app-config/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch app config, defaulting to enforced');
      return { enforced: true, mode: 'pincode' }; // Fail closed
    }

    const config: AppConfig = await response.json();
    const mode =
      config.sell_screen_gate_mode ||
      (config.enforce_sell_screen_gate === false ? 'none' : 'pincode');
    const enforced = mode !== 'none';

    console.log('📋 Sell screen gate config:', { enforced, mode });
    return { enforced, mode };
  } catch (error) {
    console.error('Error checking sell screen enforcement:', error);
    return { enforced: true, mode: 'pincode' };
  }
};

/**
 * Cache the enforcement status to avoid repeated API calls
 */
let cachedEnforcementStatus: boolean | null = null;
let cachedGateMode: 'none' | 'pincode' | 'city' | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const isSellScreenGateEnforcedCached = async (): Promise<boolean> => {
  const config = await getSellScreenGateConfigCached();
  return config.enforced;
};

export const getSellScreenGateModeCached = async (): Promise<'none' | 'pincode' | 'city'> => {
  const config = await getSellScreenGateConfigCached();
  return config.mode;
};

export const getSellScreenGateConfigCached = async (): Promise<SellScreenGateConfig> => {
  const now = Date.now();

  if (
    cachedEnforcementStatus !== null &&
    cachedGateMode !== null &&
    cacheTimestamp !== null &&
    now - cacheTimestamp < CACHE_DURATION_MS
  ) {
    return { enforced: cachedEnforcementStatus, mode: cachedGateMode };
  }

  const config = await getSellScreenGateConfig();
  cachedEnforcementStatus = config.enforced;
  cachedGateMode = config.mode;
  cacheTimestamp = now;

  return config;
};

/**
 * Clear the enforcement status cache
 * Useful when you want to force a fresh check
 */
export const clearEnforcementCache = (): void => {
  cachedEnforcementStatus = null;
  cachedGateMode = null;
  cacheTimestamp = null;
};
