/**
 * Auth Guard Hook
 * 
 * Provides utilities for protecting actions and routes that require authentication.
 * Instead of blocking the entire app, this hook enables contextual authentication
 * where guests can browse freely and are only prompted to auth when needed.
 * 
 * Features:
 * - `guardedAction`: Execute a callback only if authenticated, otherwise redirect to login
 * - `requireAuth`: Simple check that redirects if not authenticated
 * - Supports return URL for seamless post-auth navigation
 * 
 * @see https://docs.scrapiz.com/guest-auth-redesign for full documentation
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * Options for guarded actions
 */
interface AuthGuardOptions {
    /** Path to return to after successful authentication */
    returnPath?: string;
    /** Optional callback to execute after authentication */
    onAuthenticated?: () => void;
    /** Whether this action requires authentication (defaults to true) */
    requireAuth?: boolean;
}

/**
 * Return type for the useAuthGuard hook
 */
interface UseAuthGuardReturn {
    /** Wraps an action with authentication check */
    guardedAction: (action: () => void | Promise<void>, options?: AuthGuardOptions) => boolean;
    /** Simple auth check that redirects if not authenticated */
    requireAuth: (returnPath?: string) => boolean;
    /** Current authentication status */
    isAuthenticated: boolean;
    /** Whether the user is a guest (not authenticated and not loading) */
    isGuest: boolean;
    /** Whether auth status is still being determined */
    isLoading: boolean;
}

/**
 * Hook for protecting actions that require authentication
 * 
 * @returns Object with auth guard utilities and status
 * 
 * @example
 * ```typescript
 * const { guardedAction, isGuest, isAuthenticated } = useAuthGuard();
 * 
 * // Protect an action
 * const handleConfirmOrder = () => {
 *   guardedAction(
 *     () => submitOrder(),
 *     { returnPath: '/(tabs)/sell?step=3' }
 *   );
 * };
 * 
 * // Simple auth check
 * const handleProfileEdit = () => {
 *   if (requireAuth('/(tabs)/profile')) {
 *     // User is authenticated, proceed
 *     router.push('/profile/edit');
 *   }
 *   // If not authenticated, user is already redirected to login
 * };
 * ```
 */
export const useAuthGuard = (): UseAuthGuardReturn => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    // Computed guest state
    const isGuest = !isAuthenticated && !isLoading;

    /**
     * Executes an action if authenticated, otherwise redirects to login
     * 
     * @param action - The action to execute if authenticated
     * @param options - Configuration options
     * @returns true if action was executed, false if redirected to login
     */
    const guardedAction = useCallback(
        (
            action: () => void | Promise<void>,
            options: AuthGuardOptions = {}
        ): boolean => {
            const { returnPath, requireAuth: shouldRequireAuth = true } = options;

            // If auth not required or user is authenticated, execute action
            if (!shouldRequireAuth || isAuthenticated) {
                action();
                return true;
            }

            // User is a guest and action requires auth - redirect to login
            const encodedReturnPath = returnPath
                ? encodeURIComponent(returnPath)
                : encodeURIComponent('/(tabs)/home');

            console.log('🔒 Auth guard triggered, redirecting to login', { returnPath });
            router.push(`/(auth)/login?returnTo=${encodedReturnPath}`);
            return false;
        },
        [isAuthenticated, router]
    );

    /**
     * Simple authentication check with redirect
     * 
     * @param returnPath - Path to return to after login (optional)
     * @returns true if authenticated, false if redirected to login
     */
    const requireAuth = useCallback(
        (returnPath?: string): boolean => {
            if (isAuthenticated) {
                return true;
            }

            const encodedReturnPath = returnPath
                ? encodeURIComponent(returnPath)
                : encodeURIComponent('/(tabs)/home');

            console.log('🔒 Auth required, redirecting to login', { returnPath });
            router.push(`/(auth)/login?returnTo=${encodedReturnPath}`);
            return false;
        },
        [isAuthenticated, router]
    );

    return {
        guardedAction,
        requireAuth,
        isAuthenticated,
        isGuest,
        isLoading,
    };
};

/**
 * Helper type for components that need auth context
 */
export type AuthGuardContext = ReturnType<typeof useAuthGuard>;

export default useAuthGuard;
