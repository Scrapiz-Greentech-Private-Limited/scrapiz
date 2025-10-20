# Scrapiz App - Authentication Flow

## Overview

This React Native app with Expo Router implements a complete authentication system with the following features:

- **Splash Screen**: 2-second loading screen with app branding
- **Login Screen**: Email/password authentication with social login options
- **Register Screen**: User registration with OTP verification
- **Forgot Password**: Password reset with email OTP verification
- **Home Screen**: Welcome screen with logout functionality

## Authentication Flow

### 1. Splash Screen (`/index.tsx`)
- Shows for 2 seconds with app branding
- Automatically redirects to login screen

### 2. Login Screen (`/auth/login.tsx`)
- Email and password input fields
- "Forgot Password?" link
- Social login buttons (Google, Facebook)
- "Sign Up" link to registration
- API integration with proper error handling

### 3. Register Screen (`/auth/register.tsx`)
- **Step 1**: Registration form (name, email, password, confirm password)
- **Step 2**: OTP verification
- Form validation and API integration
- Resend OTP functionality

### 4. Forgot Password Screen (`/auth/forgot-password.tsx`)
- **Step 1**: Email input for password reset
- **Step 2**: OTP verification
- **Step 3**: New password setup
- Complete password reset flow

### 5. Home Screen (`/(tabs)/home.tsx`)
- Welcome message and app features
- Logout functionality
- Beautiful UI with gradient background

## API Integration

### Configuration (`/api/config.ts`)
- Base URL: `http://localhost:8000/api`
- All authentication endpoints defined
- TypeScript interfaces for type safety

#### Frontend Key Header (x-auth-app)
- The backend expects an `x-auth-app` header on every request.
- This app reads the key from `app.json` at `expo.extra.env.EXPO_PUBLIC_FRONTEND_SECRET` (with a fallback to `process.env.EXPO_PUBLIC_FRONTEND_SECRET`).
- Example `app.json`:
  ```json
  {
    "expo": {
      "extra": {
        "env": {
          "EXPO_PUBLIC_API_URL": "http://192.168.1.104:8000/api",
          "EXPO_PUBLIC_FRONTEND_SECRET": "<your-frontend-secret>"
        }Y
      }
    }
  }
  ```
-
The header is automatically injected on every request by the API client.

### API Service (`/api/apiService.ts`)
- Complete authentication service class
- Axios interceptors for token management
- Error handling and AsyncStorage integration
- All endpoints from the backend API

### Endpoints Implemented
- `POST /api/register` - User registration
- `PUT /api/register` - OTP verification
- `POST /api/resendotp` - Resend OTP
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/password-reset-request` - Password reset request
- `POST /api/password-reset` - Password reset
- `POST /api/oauth-login` - OAuth login

## Features

### UI/UX
- Beautiful gradient backgrounds
- Consistent design language
- Loading states and error handling
- Toast notifications for user feedback
- Responsive design with proper spacing

### Security
- JWT token management
- Secure password handling
- OTP verification for registration and password reset
- Input validation and sanitization

### State Management
- React Context for authentication state
- AsyncStorage for persistent login
- Proper navigation flow

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Start the Backend Server**
   ```bash
   cd ../server
   python manage.py runserver
   ```

3. **Start the React Native App**
   ```bash
   cd ../client
   npm start
   ```

4. **Run on Device/Simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web

## File Structure

```
client/src/
├── api/
│   ├── config.ts          # API configuration and types
│   └── apiService.ts      # Authentication API service
├── app/
│   ├── _layout.tsx        # Root layout with AuthProvider
│   ├── index.tsx          # Splash screen
│   ├── (auth)/
│   │   ├── _layout.tsx    # Auth navigation layout
│   │   ├── index.tsx      # Auth redirect
│   │   ├── login.tsx      # Login screen
│   │   ├── register.tsx   # Register screen
│   │   └── forgot-password.tsx # Forgot password screen
│   └── (tabs)/
│       ├── _layout.tsx    # Tabs navigation layout
│       └── home.tsx       # Home screen
└── context/
    └── AuthContext.tsx    # Authentication context
```

## Dependencies

- `expo-router` - Navigation
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage
- `expo-linear-gradient` - Gradient backgrounds
- `react-native-toast-message` - Toast notifications
- `nativewind` - Tailwind CSS for React Native

## Backend Integration

The app is designed to work with the Django backend API documented in `server/EndPoints.md`. Make sure the backend server is running on `http://localhost:8000` before testing the authentication flow.

## Testing the Flow

1. **Registration Flow**:
   - Navigate to Register screen
   - Fill in all fields
   - Submit registration
   - Enter OTP received via email
   - Verify and redirect to home

2. **Login Flow**:
   - Enter email and password
   - Submit login
   - Redirect to home screen

3. **Password Reset Flow**:
   - Navigate to Forgot Password
   - Enter email
   - Enter OTP
   - Set new password
   - Redirect to login

4. **Logout Flow**:
   - Press logout button on home screen
   - Clear authentication state
   - Redirect to login screen
