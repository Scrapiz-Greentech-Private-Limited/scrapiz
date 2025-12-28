/**
 * useAppRating Hook
 * 
 * Manages the in-app rating prompt flow for the Scrapiz app.
 * 
 * Requirements: 1.5, 6.2, 7.2
 * - Platform check (Android only)
 * - Session-level caching to avoid redundant API calls
 * - Session-level lock to prevent multiple prompts
 */

import { useState, useCallback, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { AppRatingService, EligibilityResponse } from '../services/appRatingService';

// Module-level session lock (resets only on app restart)
// This prevents multiple prompts during navigation between screens within the same session
let promptShownThisSession = false;

// Module-level eligibility cache (resets only on app restart)
// This avoids redundant API calls during the same session (Requirement 6.2)
let cachedEligibility: EligibilityResponse | null = null;

export interface AppRatingState {
  isEligible: boolean;
  loading: boolean;
  error: string | null;
  showBottomSheet: boolean;
}

export interface UseAppRatingReturn {
  state: AppRatingState;
  checkEligibility: () => Promise<boolean>;
  showRatingPrompt: () => void;
  handleRateNow: () => Promise<void>;
  handleRemindLater: () => Promise<void>;
  handleNeverAskAgain: () => Promise<void>;
  dismissBottomSheet: () => void;
}

/**
 * Hook for managing the in-app rating prompt flow.
 * 
 * Features:
 * - Module-level promptShownThisSession flag for session lock (Requirement 7.2)
 * - Platform check (Android only) (Requirement 1.5)
 * - Session-level caching to avoid redundant API calls (Requirement 6.2)
 */
export function useAppRating(): UseAppRatingReturn {
  const [state, setState] = useState<AppRatingState>({
    isEligible: false,
    loading: false,
    error: null,
    showBottomSheet: false,
  });

  // Track if we're currently checking eligibility to prevent duplicate calls
  const isCheckingRef = useRef(false);

  /**
   * Check if the user is eligible for an app rating prompt.
   * 
   * Returns false immediately if:
   * - Platform is not Android (Requirement 1.5)
   * - Prompt has already been shown this session (Requirement 7.2)
   * - Cached eligibility exists and is not eligible
   * 
   * @returns Promise<boolean> - Whether the user is eligible
   */
  const checkEligibility = useCallback(async (): Promise<boolean> => {
    // Platform check - only show on Android (Requirement 1.5)
    if (Platform.OS !== 'android') {
      setState(prev => ({ ...prev, isEligible: false, loading: false }));
      return false;
    }

    // Session lock check - don't show if already shown this session (Requirement 7.2)
    if (promptShownThisSession) {
      setState(prev => ({ ...prev, isEligible: false, loading: false }));
      return false;
    }

    // Use cached eligibility if available (Requirement 6.2)
    if (cachedEligibility !== null) {
      const isEligible = cachedEligibility.is_eligible;
      setState(prev => ({ ...prev, isEligible, loading: false }));
      return isEligible;
    }

    // Prevent duplicate API calls
    if (isCheckingRef.current) {
      return false;
    }

    isCheckingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await AppRatingService.checkEligibility();
      
      // Cache the response for the session (Requirement 6.2)
      cachedEligibility = response;

      const isEligible = response.is_eligible;
      setState(prev => ({
        ...prev,
        isEligible,
        loading: false,
        error: response.error || null,
      }));

      return isEligible;
    } catch (error: any) {
      console.error('useAppRating.checkEligibility error:', error);
      setState(prev => ({
        ...prev,
        isEligible: false,
        loading: false,
        error: error.message || 'Failed to check eligibility',
      }));
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  /**
   * Show the rating prompt bottom sheet.
   * Sets the session lock to prevent multiple prompts (Requirement 7.2).
   */
  const showRatingPrompt = useCallback(() => {
    // Set session lock when showing the prompt (Requirement 7.2)
    promptShownThisSession = true;
    setState(prev => ({ ...prev, showBottomSheet: true }));
  }, []);

  /**
   * Dismiss the bottom sheet without recording any action.
   */
  const dismissBottomSheet = useCallback(() => {
    setState(prev => ({ ...prev, showBottomSheet: false }));
  }, []);

  /**
   * Handle "Rate Now" button press.
   * Triggers the In-App Review API and records the action.
   * Falls back to opening Play Store listing if API is unavailable (Requirement 1.4).
   */
  const handleRateNow = useCallback(async () => {
    setState(prev => ({ ...prev, showBottomSheet: false }));

    try {
      // Record the action first
      await AppRatingService.recordAction('rated');
      
      // Invalidate cache since state has changed
      cachedEligibility = null;

      // Check if StoreReview is available
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        // Trigger the native in-app review dialog
        await StoreReview.requestReview();
      } else {
        // Fallback: Open Play Store listing (Requirement 1.4)
        const storeUrl = await StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        }
      }
    } catch (error: any) {
      console.error('useAppRating.handleRateNow error:', error);
      // Fail silently - don't disrupt user experience
    }
  }, []);

  /**
   * Handle "Remind Me Later" button press.
   * Increments prompt count and updates last_prompt_at timestamp.
   * Also handles dismiss gesture (Requirement 2.3).
   */
  const handleRemindLater = useCallback(async () => {
    setState(prev => ({ ...prev, showBottomSheet: false }));

    try {
      await AppRatingService.recordAction('reminded');
      
      // Invalidate cache since state has changed
      cachedEligibility = null;
    } catch (error: any) {
      console.error('useAppRating.handleRemindLater error:', error);
      // Fail silently - don't disrupt user experience
    }
  }, []);

  /**
   * Handle "Never Ask Again" button press.
   * Sets opted_out to true, permanently disabling prompts (Requirement 3.1).
   */
  const handleNeverAskAgain = useCallback(async () => {
    setState(prev => ({ ...prev, showBottomSheet: false }));

    try {
      await AppRatingService.recordAction('opted_out');
      
      // Invalidate cache since state has changed
      cachedEligibility = null;
    } catch (error: any) {
      console.error('useAppRating.handleNeverAskAgain error:', error);
      // Fail silently - don't disrupt user experience
    }
  }, []);

  return {
    state,
    checkEligibility,
    showRatingPrompt,
    handleRateNow,
    handleRemindLater,
    handleNeverAskAgain,
    dismissBottomSheet,
  };
}

/**
 * Reset the session lock and cache.
 * This is primarily for testing purposes.
 */
export function resetAppRatingSession(): void {
  promptShownThisSession = false;
  cachedEligibility = null;
}

/**
 * Check if the prompt has been shown this session.
 * This is primarily for testing purposes.
 */
export function hasPromptBeenShownThisSession(): boolean {
  return promptShownThisSession;
}
