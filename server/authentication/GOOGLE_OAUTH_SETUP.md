# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Scrapiz App")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - App name: Your app name (e.g., "Scrapiz")
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Save and Continue" (no additional scopes needed)
7. On the Test users page, add test users if needed
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select application type:
   - For mobile apps: Choose "iOS" or "Android"
   - For web: Choose "Web application"
4. Enter a name for your OAuth client
5. Add authorized redirect URIs:
   - For development: `exp://localhost:19000`
   - For production: Your app's custom scheme (e.g., `scrapiz://`)
   - For web: `http://localhost:19006` (development)
6. Click "Create"
7. Copy the **Client ID** - you'll need this for your app

## Step 5: Configure Environment Variables

### Backend (.env)

Add the following to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Frontend (app.json)

Add the following to your `client/app.json` under `expo.extra.env`:

```json
{
  "expo": {
    "extra": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your-google-client-id.apps.googleusercontent.com"
      }
    },
    "scheme": "scrapiz",
    "ios": {
      "bundleIdentifier": "com.yourcompany.scrapiz"
    },
    "android": {
      "package": "com.yourcompany.scrapiz"
    }
  }
}
```

## Step 6: Install Required Packages

### Backend

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

### Frontend

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

## Step 7: Configure Redirect URIs for Different Environments

### Development

- Expo Go: `exp://localhost:19000`
- Custom dev client: `scrapiz://`

### Production

- iOS: `scrapiz://` (matches your bundle identifier)
- Android: `scrapiz://` (matches your package name)
- Web: Your production domain

## Troubleshooting

### "redirect_uri_mismatch" Error

This means the redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Check the redirect URI being used in your app
2. Add it to the authorized redirect URIs in Google Cloud Console
3. Wait a few minutes for changes to propagate

### "invalid_client" Error

This means the client ID is incorrect or not found.

**Solution:**
1. Verify the client ID in your environment variables
2. Make sure you're using the correct client ID for your platform (iOS/Android/Web)
3. Ensure the OAuth client is enabled in Google Cloud Console

### Token Verification Fails

**Solution:**
1. Check that the backend has the correct `GOOGLE_CLIENT_ID`
2. Verify the token hasn't expired (tokens expire after 1 hour)
3. Ensure the audience in the token matches your client ID

### "Access blocked: This app's request is invalid"

This happens when the OAuth consent screen is not properly configured.

**Solution:**
1. Complete all required fields in the OAuth consent screen
2. Add your email as a test user if the app is in testing mode
3. Verify the app is published (or in testing with authorized users)

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file out of version control
2. **Use different client IDs**: Use separate OAuth clients for development and production
3. **Restrict API keys**: Add application restrictions in Google Cloud Console
4. **Monitor usage**: Regularly check the API usage in Google Cloud Console
5. **Rotate credentials**: Periodically rotate your OAuth client secrets

## Testing

1. Start your backend server
2. Start your Expo app
3. Navigate to the login screen
4. Click "Sign in with Google"
5. Complete the Google authentication flow
6. Verify you're redirected back to your app and logged in

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Cloud Console](https://console.cloud.google.com/)
