
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface AuthGuardOptions {
    returnPath?: string;
    onAuthenticated?: () => void;
    requireAuth?: boolean;
}

interface UseAuthGuardReturn {
    guardedAction: (action: () => void | Promise<void>, options?: AuthGuardOptions) => boolean;
    requireAuth: (returnPath?: string) => boolean;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
}

export const useAuthGuard = (): UseAuthGuardReturn => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    // Computed guest state - only consider user as guest if not loading AND not authenticated
    const isGuest = !isAuthenticated && !isLoading;
    const guardedAction = useCallback(
        (
            action: () => void | Promise<void>,
            options: AuthGuardOptions = {}
        ): boolean => {
            const { returnPath, requireAuth: shouldRequireAuth = true } = options;

            // If still loading auth state, don't redirect - wait for auth check to complete
            if (isLoading) {
                console.log('🔒 Auth guard: Still loading auth state, waiting...');
                return false;
            }

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
        [isAuthenticated, isLoading, router]
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
