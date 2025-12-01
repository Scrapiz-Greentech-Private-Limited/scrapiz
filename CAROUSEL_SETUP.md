# Carousel Management System Setup Guide

This guide will help you set up the carousel management system that allows admins to manage carousel images from the admin dashboard.

## Overview

The carousel management system consists of:
- **Backend**: Django app (`content`) with CarouselImage model and REST API
- **Admin Dashboard**: React page for managing carousel images
- **Client App**: Updated Carousel component that fetches images from backend

## Setup Instructions

### 1. Backend Setup (Django)

#### Step 1: Run Database Migrations

```bash
cd server
python manage.py makemigrations content
python manage.py migrate
```

#### Step 2: Verify the Content App

The content app has been added to `INSTALLED_APPS` in `server/server/settings.py`:
```python
INSTALLED_APPS = [
    # ... other apps
    'content',
    # ... rest of apps
]
```

#### Step 3: Verify URL Configuration

The content URLs have been added to `server/server/urls.py`:
```python
urlpatterns = [
    # ... other paths
    path('api/content/', include('content.urls')),
]
```

#### Step 4: Test the API Endpoints

After running migrations, test the endpoints:

**Public endpoint (no auth required):**
```bash
curl http://localhost:8000/api/content/carousel/
```

**Admin endpoints (require authentication):**
```bash
# Create carousel image
curl -X POST http://localhost:8000/api/content/carousel/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Carousel",
    "image_url": "https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/test.png",
    "order": 0,
    "is_active": true
  }'

# Update carousel image
curl -X PATCH http://localhost:8000/api/content/carousel/1/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'

# Delete carousel image
curl -X DELETE http://localhost:8000/api/content/carousel/1/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Reorder carousel images
curl -X POST http://localhost:8000/api/content/carousel/reorder/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orders": [{"id": 1, "order": 0}, {"id": 2, "order": 1}]}'
```

### 2. Admin Dashboard Setup

#### Step 1: Install Dependencies (if needed)

The admin dashboard should already have all required dependencies. If not:

```bash
cd admin-dashboard
npm install
```

#### Step 2: Access Carousel Management

1. Start the admin dashboard:
   ```bash
   npm run dev
   ```

2. Login to the admin dashboard

3. Navigate to **Carousel** in the sidebar (icon: Image)

4. You'll see the carousel management page where you can:
   - Add new carousel images by providing title and S3 URL
   - Toggle images active/inactive
   - Reorder images using up/down arrows
   - Delete images

### 3. Client App Setup

#### Step 1: Verify API Configuration

The client's `AuthService` has been updated with the `getCarouselImages()` method in `client/src/api/apiService.ts`.

#### Step 2: Test the Carousel

1. Start the client app:
   ```bash
   cd client
   npm start
   ```

2. The home screen will now fetch carousel images from the backend
3. If the backend is unavailable, it will fall back to the local images

## Usage Guide

### Adding Carousel Images

1. **Upload Image to S3**:
   - Upload your carousel image to the S3 bucket: `scrapiz-inventory`
   - Recommended size: 1200x600px (2:1 aspect ratio)
   - Get the full S3 URL (e.g., `https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/image.png`)

2. **Add to Admin Dashboard**:
   - Go to Dashboard → Carousel
   - Enter a title (e.g., "Become A Scrap Seller")
   - Paste the S3 URL
   - Click "Add Carousel Image"

3. **Manage Images**:
   - Use the toggle switch to activate/deactivate images
   - Use up/down arrows to reorder images
   - Click the trash icon to delete images

### API Endpoints

#### Public Endpoints (No Authentication)
- `GET /api/content/carousel/` - Get all active carousel images

#### Admin Endpoints (Require Authentication)
- `GET /api/content/carousel/` - Get all carousel images (including inactive)
- `POST /api/content/carousel/` - Create new carousel image
- `PATCH /api/content/carousel/{id}/` - Update carousel image
- `DELETE /api/content/carousel/{id}/` - Delete carousel image
- `POST /api/content/carousel/reorder/` - Reorder carousel images

### Database Schema

**CarouselImage Model:**
```python
{
    "id": int,
    "title": str,           # Title/description
    "image_url": str,       # S3 URL
    "order": int,           # Display order (0, 1, 2, ...)
    "is_active": bool,      # Whether to display
    "created_at": datetime,
    "updated_at": datetime
}
```

## Troubleshooting

### Backend Issues

**Migration errors:**
```bash
cd server
python manage.py migrate --fake content zero
python manage.py migrate content
```

**API not responding:**
- Check if Django server is running
- Verify `content` is in `INSTALLED_APPS`
- Check URL configuration in `server/server/urls.py`

### Admin Dashboard Issues

**Can't see carousel page:**
- Clear browser cache
- Check if you're logged in as admin
- Verify the route exists: `/dashboard/carousel`

**API errors:**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify admin token is valid
- Check browser console for errors

### Client App Issues

**Carousel not loading:**
- Check if backend API is accessible
- Verify `API_CONFIG.BASE_URL` in client config
- The app will fall back to local images if API fails

**Images not displaying:**
- Verify S3 URLs are correct and accessible
- Check image CORS settings on S3
- Ensure images are publicly readable

## Features

✅ **Admin Dashboard**:
- Add carousel images with S3 URLs
- Toggle images active/inactive
- Reorder images with drag-and-drop style controls
- Delete images
- Real-time preview

✅ **Backend API**:
- RESTful API with Django REST Framework
- Public endpoint for active images
- Admin-only endpoints for management
- Automatic ordering system

✅ **Client App**:
- Fetches carousel images from backend
- Falls back to local images if API unavailable
- Smooth carousel transitions
- Auto-play functionality

## Next Steps

1. **Add more carousel images** via the admin dashboard
2. **Set up S3 bucket** with proper CORS configuration
3. **Test the system** end-to-end
4. **Monitor usage** through Django admin panel

## Support

For issues or questions:
- Check Django logs: `server/logs/`
- Check browser console for frontend errors
- Verify API responses with curl or Postman
