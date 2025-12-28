/**
 * App Rating Service
 * 
 * Handles API calls for the in-app review system.
 * Requirements: 6.1
 */

import axios from 'axios';
import { API_CONFIG } from '../api/config';
import { SecureStorageService } from './secureStorage';

// API Response Interfaces
export interface EligibilityResponse {
  success: boolean;
  is_eligible: boolean;
  completed_orders_count: number;
  last_order_rating: number | null;
  prompt_count: number;
  last_prompt_at: string | null;
  has_rated: boolean;
  opted_out: boolean;
  days_since_last_prompt: number | null;
  days_since_low_rating: number | null;
  error?: string;
}

export interface RecordActionResponse {
  success: boolean;
  message?: string;
  prompt_count: number;
  has_rated: boolean;
  opted_out: boolean;
  last_prompt_at: string | null;
  error?: string;
  code?: string;
}

export type RatingAction = 'rated' | 'reminded' | 'opted_out';

// Create axios instance for rating API calls
const ratingApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
ratingApiClient.interceptors.request.use(
  async (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    const token = await SecureStorageService.getAuthToken();
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * App Rating Service
 * 
 * Provides methods to check eligibility and record user actions
 * for the in-app rating prompt system.
 */
export class AppRatingService {
  /**
   * Check if the current user is eligible for an app rating prompt.
   * 
   * @returns Promise<EligibilityResponse> - Eligibility data including all conditions
   * @throws Error if the API call fails
   */
  static async checkEligibility(): Promise<EligibilityResponse> {
    try {
      const response = await ratingApiClient.get<EligibilityResponse>(
        '/feedback/rating-prompt/eligibility/'
      );
      return response.data;
    } catch (error: any) {
      // Return a fail-safe response on error (don't show prompt)
      console.error('AppRatingService.checkEligibility error:', error);
      return {
        success: false,
        is_eligible: false,
        completed_orders_count: 0,
        last_order_rating: null,
        prompt_count: 0,
        last_prompt_at: null,
        has_rated: false,
        opted_out: false,
        days_since_last_prompt: null,
        days_since_low_rating: null,
        error: error.response?.data?.error || error.message || 'Failed to check eligibility'
      };
    }
  }

  /**
   * Record a user action on the rating prompt.
   * 
   * @param action - The action taken: 'rated', 'reminded', or 'opted_out'
   * @returns Promise<RecordActionResponse> - Updated prompt state
   * @throws Error if the API call fails
   */
  static async recordAction(action: RatingAction): Promise<RecordActionResponse> {
    try {
      const response = await ratingApiClient.post<RecordActionResponse>(
        '/feedback/rating-prompt/record-action/',
        { action }
      );
      return response.data;
    } catch (error: any) {
      console.error('AppRatingService.recordAction error:', error);
      throw new Error(
        error.response?.data?.error || error.message || 'Failed to record action'
      );
    }
  }
}
