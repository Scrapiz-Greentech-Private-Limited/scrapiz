/**
 * Guest Order Persistence Utility
 * 
 * Manages the persistence of order state for guest users during the authentication flow.
 * When a guest user starts a sell order and needs to authenticate, this utility
 * saves their order progress to AsyncStorage so it can be restored after login.
 * 
 * Key Features:
 * - 24-hour TTL for saved order state
 * - Type-safe order state interface
 * - Atomic save/load/clear operations
 * 
 * @see https://docs.scrapiz.com/guest-auth-redesign for full documentation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for guest order state
const GUEST_ORDER_KEY = '@scrapiz/guest_order_state';

// Maximum age for saved order state (24 hours in milliseconds)
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Represents the state of an order being created by a guest user
 */
export interface GuestOrderState {
    /** Array of selected items with quantities */
    items: Array<{
        id: number;
        name: string;
        rate: number;
        unit: string;
        quantity: number;
        image?: any;
    }>;
    /** Selected pickup date (ISO string or formatted date string) */
    selectedDate: string;
    /** Selected pickup time slot */
    selectedTime: string;
    /** Current step in the sell flow the user was on */
    currentStep: number;
    /** Whether referral bonus toggle was enabled */
    useReferralBonus?: boolean;
    /** Timestamp when the state was saved */
    savedAt: number;
}

/**
 * Input type for saving guest order state (excludes savedAt which is auto-generated)
 */
export type GuestOrderStateInput = Omit<GuestOrderState, 'savedAt'>;

/**
 * Saves the current order state to AsyncStorage for a guest user
 * 
 * @param state - The order state to save (items, date, time, step)
 * @returns Promise that resolves when save is complete
 * 
 * @example
 * ```typescript
 * await saveGuestOrderState({
 *   items: selectedItems,
 *   selectedDate: '2024-02-15',
 *   selectedTime: '10:00 AM - 12:00 PM',
 *   currentStep: 2,
 * });
 * ```
 */
export const saveGuestOrderState = async (state: GuestOrderStateInput): Promise<void> => {
    try {
        const dataToSave: GuestOrderState = {
            ...state,
            savedAt: Date.now(),
        };

        await AsyncStorage.setItem(GUEST_ORDER_KEY, JSON.stringify(dataToSave));
        console.log('✅ Guest order state saved successfully');
    } catch (error) {
        console.error('❌ Failed to save guest order state:', error);
        // Don't throw - this is a non-critical operation
        // The user can still log in, they'll just need to re-enter their order
    }
};

/**
 * Loads the saved guest order state from AsyncStorage
 * 
 * Automatically checks for expiration and clears expired state.
 * Returns null if no state exists or if the state has expired.
 * 
 * @returns The saved order state or null if none exists/expired
 * 
 * @example
 * ```typescript
 * const savedState = await loadGuestOrderState();
 * if (savedState) {
 *   // Restore items to store
 *   setItems(savedState.items);
 *   setSelectedDate(savedState.selectedDate);
 * }
 * ```
 */
export const loadGuestOrderState = async (): Promise<GuestOrderState | null> => {
    try {
        const data = await AsyncStorage.getItem(GUEST_ORDER_KEY);

        if (!data) {
            console.log('ℹ️ No guest order state found');
            return null;
        }

        const parsed: GuestOrderState = JSON.parse(data);

        // Check if data is expired (older than 24 hours)
        const age = Date.now() - parsed.savedAt;
        if (age > MAX_AGE_MS) {
            console.log('⏰ Guest order state expired, clearing...');
            await clearGuestOrderState();
            return null;
        }

        // Validate that we have items (minimum required for valid state)
        if (!parsed.items || parsed.items.length === 0) {
            console.log('ℹ️ Guest order state has no items, ignoring');
            await clearGuestOrderState();
            return null;
        }

        console.log('✅ Guest order state loaded successfully', {
            itemCount: parsed.items.length,
            ageMinutes: Math.round(age / 60000),
        });

        return parsed;
    } catch (error) {
        console.error('❌ Failed to load guest order state:', error);
        // Clear potentially corrupted data
        await clearGuestOrderState();
        return null;
    }
};

/**
 * Clears the saved guest order state from AsyncStorage
 * 
 * Should be called after:
 * - Successfully restoring state after login
 * - Order submission completion
 * - Manual user cancellation
 * 
 * @returns Promise that resolves when clear is complete
 */
export const clearGuestOrderState = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(GUEST_ORDER_KEY);
        console.log('🧹 Guest order state cleared');
    } catch (error) {
        console.error('❌ Failed to clear guest order state:', error);
        // Don't throw - this is a non-critical operation
    }
};

/**
 * Checks if there is a valid (non-expired) guest order state saved
 * 
 * Useful for checking if we should restore state without fully loading it.
 * 
 * @returns true if valid state exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (await hasGuestOrderState()) {
 *   // Show "Continue your order?" prompt
 * }
 * ```
 */
export const hasGuestOrderState = async (): Promise<boolean> => {
    const state = await loadGuestOrderState();
    return state !== null && state.items.length > 0;
};

/**
 * Gets the age of the saved guest order state in minutes
 * 
 * @returns Age in minutes, or null if no state exists
 */
export const getGuestOrderStateAge = async (): Promise<number | null> => {
    try {
        const data = await AsyncStorage.getItem(GUEST_ORDER_KEY);
        if (!data) return null;

        const parsed: GuestOrderState = JSON.parse(data);
        const ageMs = Date.now() - parsed.savedAt;
        return Math.round(ageMs / 60000);
    } catch {
        return null;
    }
};
