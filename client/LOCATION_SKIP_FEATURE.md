# Location Skip Feature for Testers

## Overview

This feature allows testers and developers to bypass the location permission screen and proceed directly to the login screen. This is useful for:

- **Testing**: Quickly test features without entering a pincode every time
- **Development**: Speed up the development workflow
- **Demo**: Show the app without location restrictions

## How It Works

The skip feature can be enabled in two ways:

### 1. Environment Variable (Client-Side)

Set the environment variable in `client/.env`:

```env
EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true
```

**Pros:**
- Simple and fast
- No backend changes needed
- Works offline

**Cons:**
- Requires app rebuild to change
- Can't be toggled remotely

### 2. Backend API Flag (Dynamic)

The app also checks the backend API for the skip flag:

**Endpoint:** `GET /api/content/app-config/`

**Response:**
```json
{
  "enable_location_skip": true,
  "maintenance_mode": false,
  "min_app_version": "1.0.0"
}
```

**Pros:**
- Can be toggled without app rebuild
- Centralized control
- Can enable/disable for specific users (future enhancement)

**Cons:**
- Requires network connection
- Needs backend configuration

## Configuration

### Client Configuration

1. **Enable via Environment Variable:**
   ```env
   EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true
   ```

2. **Restart Expo:**
   ```bash
   cd client
   npm start -- --clear
   ```

### Backend Configuration

1. **Add to Django Settings** (`server/server/settings.py`):
   ```python
   # Testing/Development Features
   ENABLE_LOCATION_SKIP = os.environ.get('ENABLE_LOCATION_SKIP', 'False') == 'True'
   ```

2. **Set Environment Variable** (`.env` or server config):
   ```env
   ENABLE_LOCATION_SKIP=True
   ```

3. **Restart Django Server:**
   ```bash
   cd server
   python manage.py runserver
   ```

## User Experience

When the skip feature is enabled:

1. User sees the normal location permission screen
2. Below the "Use my current location" button, a new button appears:
   - **Text:** "Skip (Tester Mode)"
   - **Color:** Amber/Orange (to indicate it's a testing feature)
   - **Icon:** Skip forward icon

3. When clicked:
   - Sets a default location (Mumbai - 400001)
   - Navigates directly to login screen
   - No pincode validation required

## Default Location

When skipped, the app sets:
- **Pincode:** 400001
- **City:** Mumbai
- **State:** Maharashtra
- **Service:** Available

This ensures the app works normally after skipping.

## Security Considerations

⚠️ **Important:** This feature should **NEVER** be enabled in production builds.

**Recommendations:**

1. **Use separate environment files:**
   - `.env.development` - Skip enabled
   - `.env.production` - Skip disabled

2. **Add build-time checks:**
   ```javascript
   if (__DEV__ && ENABLE_LOCATION_SKIP) {
     // Show skip button
   }
   ```

3. **Backend validation:**
   - Only enable on staging/development servers
   - Never enable on production API

## Testing

### Test the Feature

1. **Enable skip mode:**
   ```bash
   # In client/.env
   EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true
   ```

2. **Restart app:**
   ```bash
   npm start -- --clear
   ```

3. **Navigate to location permission screen**

4. **Verify skip button appears**

5. **Click skip button**

6. **Verify navigation to login screen**

### Test Backend API

```bash
# Test the endpoint
curl http://localhost:8000/api/content/app-config/

# Expected response:
{
  "enable_location_skip": true,
  "maintenance_mode": false,
  "min_app_version": "1.0.0"
}
```

## Future Enhancements

Possible improvements:

1. **User-specific skip:**
   - Check if user is a tester (via backend)
   - Only show skip for specific user IDs

2. **Custom default location:**
   - Allow testers to set their preferred test location
   - Store in AsyncStorage

3. **Skip counter:**
   - Track how many times skip was used
   - Send analytics to understand testing patterns

4. **Admin panel toggle:**
   - Add UI in admin dashboard to enable/disable
   - No need to edit environment variables

## Troubleshooting

### Skip button not showing

1. Check environment variable is set correctly
2. Restart Expo with `--clear` flag
3. Check backend API response
4. Verify no console errors

### Skip not working

1. Check LocationContext is properly initialized
2. Verify default pincode (400001) is in serviceable areas
3. Check navigation logic in router

### Backend API not responding

1. Verify Django server is running
2. Check URL in fetch call matches your API URL
3. Verify CORS settings allow the request
4. Check Django logs for errors

## Code References

- **Client:** `client/src/app/(auth)/location-permission.tsx`
- **Backend:** `server/content/views.py` (app_config function)
- **URLs:** `server/content/urls.py`
- **Environment:** `client/.env` and `client/.env.example`
