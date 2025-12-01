# Carousel Management - Quick Start

## 🚀 Quick Setup (3 Steps)

### 1. Run Database Migration
```bash
cd server
python manage.py makemigrations content
python manage.py migrate
```

### 2. Start the Servers
```bash
# Terminal 1 - Backend
cd server
python manage.py runserver

# Terminal 2 - Admin Dashboard
cd admin-dashboard
npm run dev

# Terminal 3 - Client App
cd client
npm start
```

### 3. Add Carousel Images

1. **Login to Admin Dashboard**: http://localhost:3000/dashboard
2. **Navigate to Carousel**: Click the "Carousel" icon in the sidebar
3. **Add Image**:
   - Title: "Become A Scrap Seller"
   - S3 URL: `https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/your-image.png`
   - Click "Add Carousel Image"

## 📱 How It Works

```
┌─────────────────┐
│  Admin uploads  │
│  S3 URL via     │──┐
│  Dashboard      │  │
└─────────────────┘  │
                     │
                     ▼
              ┌──────────────┐
              │   Django     │
              │   Backend    │
              │  (Database)  │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Client App  │
              │  Fetches &   │
              │  Displays    │
              └──────────────┘
```

## 🎯 Key Features

✅ **Admin Dashboard** (`/dashboard/carousel`):
- Add carousel images with S3 URLs
- Toggle active/inactive
- Reorder with ▲▼ buttons
- Delete images
- Live preview

✅ **Backend API** (`/api/content/carousel/`):
- Public endpoint for active images
- Admin endpoints for management
- Automatic ordering

✅ **Client App** (Home screen):
- Auto-fetches from backend
- Falls back to local images
- Smooth transitions

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/content/carousel/` | No | Get active images |
| GET | `/api/content/carousel/` | Admin | Get all images |
| POST | `/api/content/carousel/` | Admin | Create image |
| PATCH | `/api/content/carousel/{id}/` | Admin | Update image |
| DELETE | `/api/content/carousel/{id}/` | Admin | Delete image |
| POST | `/api/content/carousel/reorder/` | Admin | Reorder images |

## 🖼️ Image Guidelines

- **Recommended Size**: 1200x600px (2:1 ratio)
- **Format**: PNG or JPG
- **Max Size**: 2MB
- **Upload to**: S3 bucket `scrapiz-inventory`

## 🔧 Files Created

### Backend (Django)
```
server/content/
├── __init__.py
├── admin.py          # Django admin config
├── apps.py           # App config
├── models.py         # CarouselImage model
├── serializers.py    # DRF serializers
├── views.py          # API viewsets
├── urls.py           # URL routing
├── tests.py          # Unit tests
└── migrations/
    ├── __init__.py
    └── 0001_initial.py
```

### Admin Dashboard
```
admin-dashboard/src/
├── app/dashboard/carousel/
│   └── page.tsx      # Carousel management UI
└── services/
    └── content.ts    # API service
```

### Client App
```
client/src/
├── components/
│   └── Carousel.tsx  # Updated to fetch from backend
└── api/
    └── apiService.ts # Added getCarouselImages()
```

## 🐛 Troubleshooting

**Migration Error?**
```bash
python manage.py migrate --fake content zero
python manage.py migrate content
```

**Can't see Carousel page?**
- Clear browser cache
- Check if logged in as admin
- Verify URL: `/dashboard/carousel`

**Images not loading?**
- Check S3 URL is correct
- Verify image is publicly accessible
- Check browser console for errors

## 📚 Full Documentation

See `CAROUSEL_SETUP.md` for detailed setup instructions and troubleshooting.

## ✅ Verification Checklist

- [ ] Backend migration completed
- [ ] Django server running
- [ ] Admin dashboard accessible
- [ ] Carousel page visible in navigation
- [ ] Can add carousel images
- [ ] Can toggle active/inactive
- [ ] Can reorder images
- [ ] Client app displays carousel
- [ ] Images load from backend

## 🎉 You're Done!

The carousel management system is now fully integrated. Admins can manage carousel images from the dashboard, and the client app will automatically display them!
