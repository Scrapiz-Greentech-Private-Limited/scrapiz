export const API_URL = "http://localhost:3000/api";

export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION_EMAIL: "/auth/resend-verification-email",
    CHANGE_PASSWORD: "/auth/change-password",
} as const;

// Default headers for API requests
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// Helper function to create authorization header with token
export const createAuthHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
});