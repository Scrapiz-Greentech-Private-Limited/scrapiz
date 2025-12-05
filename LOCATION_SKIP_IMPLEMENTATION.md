# Location Skip Feature - Implementation Summary

## What Was Implemented

A skip feature for the location permission screen that allows testers to bypass location validation and proceed directly to login.

## Changes Made

### 1. Client-Side Changes

**File:** `client/src/app/(auth)/location-permission.tsx`

- Added `ENABLE_LOCATION_SKIP` environment variable check
- Added `canSkip` state to track if skip is available
- Added `checkSkipAvailability()` function that checks:
  - Environment variable first
  - Backend API as fallback
- Added `handleSkip()` function that:
  - Sets default location (Mumbai - 400001)
  - Navigates to login screen
- Added skip button UI (amber/orange colored, only visible when enabled)

**File:** `client/.env`
```env
EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true
```

**File:** `client/.env.example`
```env
EXPO_PUBLIC_ENABLE_LOCATION_SKIP=false
```

### 2. Backend Changes

**File:** `server/content/views.py`

- Added `app_config()` API endpoint
- Returns configuration flags including `enable_location_skip`
- Public endpoint (no authentication required)

**File:** `server/content/urls.py`

- Added route: `GET /api/content/app-config/`

**File:** `server/server/settings.py`

- Added `ENABLE_LOCATION_SKIP` setting
- Added `MIN_APP_VERSION` setting (for future use)
- Added `MAINTENANCE_MODE` setting (for future use)

### 3. Documentation

**File:** `client/LOCATION_SKIP_FEATURE.md`

- Complete feature documentation
- Configuration instructions
- Security considerations
- Troubleshooting guide

## How to Use

### For Testers

1. **Enable skip mode** in `client/.env`:
   ```env
   EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true
   ```

2. **Restart Expo**:
   ```bash
   cd client
   npm start -- --clear
   ```

3. **Use the app**:
   - Navigate to location permission screen
   - See "Skip (Tester Mode)" button
   - Click to bypass location check

### For Backend Control

1. **Enable in Django** (`.env` or environment):
   ```env
   ENABLE_LOCATION_SKIP=True
   ```

2. **Restart Django server**:
   ```bash
   cd server
   python manage.py runserver
   ```

3. **App will check backend** on launch and show skip button if enabled

## API Endpoint

**Endpoint:** `GET /api/content/app-config/`

**Response:**
```json
{
  "enable_location_skip": true,
  "maintenance_mode": false,
  "min_app_version": "1.0.0"
}
```

**Usage:**
- Public endpoint (no auth required)
- Called on location permission screen mount
- Allows dynamic feature toggling without app rebuild

## Security Notes

⚠️ **IMPORTANT:** This feature should **NEVER** be enabled in production.

**Recommendations:**
1. Use separate `.env` files for dev/prod
2. Add build-time checks with `__DEV__` flag
3. Only enable on staging/development servers
4. Add user-specific checks in future (only show for tester accounts)

## Default Behavior

When skip is used:
- **Pincode:** 400001 (Mumbai)
- **City:** Mumbai
- **State:** Maharashtra
- **Service:** Available

This ensures the app functions normally after skipping.

## Testing

### Test Client-Side Skip

```bash
# 1. Enable in .env
echo "EXPO_PUBLIC_ENABLE_LOCATION_SKIP=true" >> client/.env

# 2. Restart Expo
cd client
npm start -- --clear

# 3. Navigate to location permission screen
# 4. Verify skip button appears
# 5. Click and verify navigation to login
```

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

## Files Modified

### Client
- `client/src/app/(auth)/location-permission.tsx` - Added skip functionality
- `client/.env` - Added skip flag
- `client/.env.example` - Added skip flag documentation
- `client/LOCATION_SKIP_FEATURE.md` - Feature documentation

### Server
- `server/content/views.py` - Added app_config endpoint
- `server/content/urls.py` - Added app-config route
- `server/server/settings.py` - Added feature flags

### Documentation
- `LOCATION_SKIP_IMPLEMENTATION.md` - This file

## Future Enhancements

1. **User-specific skip**: Only show for specific tester accounts
2. **Custom default location**: Let testers choose their test location
3. **Admin panel toggle**: UI to enable/disable without editing files
4. **Analytics**: Track skip usage for testing insights
5. **Time-limited skip**: Auto-disable after certain date/time

## Troubleshooting

**Skip button not showing:**
- Check environment variable is set
- Restart Expo with `--clear` flag
- Check backend API response
- Verify console for errors

**Skip not working:**
- Verify LocationContext is initialized
- Check pincode 400001 is in serviceable areas
- Check navigation logic

**Backend API not responding:**
- Verify Django server is running
- Check API URL in fetch call
- Verify CORS settings
- Check Django logs

## Support

For issues or questions:
1. Check `client/LOCATION_SKIP_FEATURE.md` for detailed docs
2. Review console logs for errors
3. Test backend API endpoint directly
4. Verify environment variables are set correctly
