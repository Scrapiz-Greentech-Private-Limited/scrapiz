# Google OAuth Troubleshooting Guide

## Current Errors

### Error 1: 500 Internal Server Error
```
Internal Server Error: /api/authentication/google-login
[04/Nov/2025 12:14:17] "POST /api/authentication/google-login HTTP/1.0" 500 40
```

### Error 2: Unmatched Route
```
Page could not be found. com.scrapiz.app://oauthredirect
```

## Root Causes & Solutions

### Issue 1: Missing Web Client ID

**Problem:** The backend needs a **Web Application Client ID** to verify ID tokens, but it's not configured.

**Solution:**

#### Step 1: Get Web Client ID from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. You should see 3 OAuth 2.0 Client IDs:
   - **iOS** (ends with `.apps.googleusercontent.com`)
   - **Android** (ends with `.apps.googleusercontent.com`)
   - **Web application** (ends with `.apps.googleusercontent.com`)

5. If you don't have a Web Client ID, create one:
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: `Scrapiz Web Client`
   - Authorized redirect URIs: Leave empty (not needed for mobile)
   - Click **Create**
   - Copy the **Client ID**

#### Step 2: Add Web Client ID to Frontend

Update `client/.env.local`:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

**Replace `YOUR_WEB_CLIENT_ID` with the actual Web Client ID from Google Cloud Console.**

#### Step 3: Add to EC2 Backend Environment

SSH into your EC2 instance:
```bash
ssh your-ec2-instance
```

Add to your backend `.env` file:
```bash
# Navigate to your backend directory
cd /path/to/your/backend

# Edit .env file
nano .env

# Add this line (use the SAME Web Client ID):
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

If using Docker, update `docker-compose.yml`:
```yaml
services:
  api:
    environment:
      - GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Then restart:
```bash
docker-compose restart api
# or
sudo systemctl restart your-backend-service
```

### Issue 2: OAuth Redirect Configuration

**Problem:** The redirect URI `com.scrapiz.app://oauthredirect` is not properly configured.

**Solution:**

#### Option A: Update Google Cloud Console (Recommended)

1. Go to Google Cloud Console → Credentials
2. Click on your **iOS Client ID**
3. Under **Bundle ID**, ensure it matches: `com.scrapiz.app`
4. Click on your **Android Client ID**
5. Under **Package name**, ensure it matches: `com.scrapiz.app`
6. Click **Save**

#### Option B: Update app.json (If needed)

The scheme is already correct in `app.json`:
```json
"scheme": "com.scrapiz.app"
```

But ensure it's consistent everywhere:
```json
{
  "expo": {
    "scheme": "com.scrapiz.app",
    "ios": {
      "bundleIdentifier": "com.scrapiz.app"
    },
    "android": {
      "package": "com.scrapiz.app"
    }
  }
}
```

### Issue 3: Backend Error Logging

**Problem:** The backend catches exceptions but doesn't log them, making debugging hard.

**Solution:** Update `server/authentication/views/oauth.py` on EC2:

```python
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
    
    # In development, return the actual error
    return Response(
        {'error': f'Authentication error: {str(e)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

This will show you the exact error in the logs.

## Complete Setup Checklist

### Frontend (Client)

- [ ] `.env.local` has all 3 client IDs:
  ```bash
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
  ```

- [ ] `app.json` has correct scheme:
  ```json
  "scheme": "com.scrapiz.app"
  ```

- [ ] Restart Expo dev server:
  ```bash
  npm start -- --clear
  ```

### Backend (EC2)

- [ ] `.env` has Web Client ID:
  ```bash
  GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
  ```

- [ ] Python package installed:
  ```bash
  pip install google-auth
  ```

- [ ] Backend restarted:
  ```bash
  docker-compose restart api
  # or
  sudo systemctl restart your-service
  ```

- [ ] Check logs for errors:
  ```bash
  docker-compose logs -f api
  # or
  tail -f /var/log/your-app.log
  ```

### Google Cloud Console

- [ ] OAuth consent screen configured
- [ ] 3 OAuth Client IDs created:
  - iOS (with Bundle ID: `com.scrapiz.app`)
  - Android (with Package name: `com.scrapiz.app`)
  - Web application

- [ ] All Client IDs are from the **same project**

## Testing Steps

1. **Clear app data:**
   ```bash
   # On Android
   adb shell pm clear com.scrapiz.app
   
   # On iOS
   # Delete app and reinstall
   ```

2. **Start fresh:**
   ```bash
   cd client
   npm start -- --clear
   ```

3. **Test Google Sign-In:**
   - Open app
   - Click "Sign in with Google"
   - Select Google account
   - Should redirect back to app
   - Should show as authenticated

4. **Check logs:**
   - **Frontend:** Check Expo console for errors
   - **Backend:** Check EC2 logs for 500 errors

## Common Issues

### Issue: "Invalid token: Token audience does not match client ID"

**Cause:** The Web Client ID in backend doesn't match the one used to generate the token.

**Fix:** Ensure the `GOOGLE_CLIENT_ID` in backend `.env` matches the `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in frontend `.env.local`.

### Issue: "GOOGLE_CLIENT_ID not configured"

**Cause:** Environment variable not set on EC2.

**Fix:** Add to `.env` file and restart backend.

### Issue: "Page could not be found"

**Cause:** OAuth redirect URI mismatch.

**Fix:** 
1. Ensure `scheme` in `app.json` is `com.scrapiz.app`
2. Rebuild app: `expo prebuild --clean`
3. Reinstall app on device

### Issue: 403 Forbidden on /api/authentication/user

**Cause:** JWT token not being sent or invalid.

**Fix:** This is expected before login. After Google sign-in succeeds, this should work.

## Verification Commands

### Check Frontend Environment Variables
```bash
cd client
cat .env.local
```

### Check Backend Environment Variables (EC2)
```bash
ssh your-ec2-instance
cat /path/to/backend/.env | grep GOOGLE
```

### Check Backend Logs (EC2)
```bash
# Docker
docker-compose logs -f api | grep -i google

# Systemd
journalctl -u your-service -f | grep -i google
```

### Test Backend Endpoint Directly
```bash
curl -X POST http://13.204.50.150/api/authentication/google-login \
  -H "Content-Type: application/json" \
  -H "x-auth-app: Scrapiz#0nn\$(tab!z" \
  -d '{"id_token": "test_token"}'
```

Expected response (with invalid token):
```json
{"error": "Invalid token: ..."}
```

If you get:
```json
{"error": "GOOGLE_CLIENT_ID not configured"}
```
Then the environment variable is missing.

## Quick Fix Summary

1. **Get Web Client ID** from Google Cloud Console
2. **Add to frontend** `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
   ```
3. **Add to backend** `.env` on EC2:
   ```
   GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID
   ```
4. **Restart both**:
   - Frontend: `npm start -- --clear`
   - Backend: `docker-compose restart api`
5. **Test** Google sign-in

## Need More Help?

If issues persist, provide:
1. Full backend error logs from EC2
2. Frontend console logs
3. Screenshot of Google Cloud Console credentials page
