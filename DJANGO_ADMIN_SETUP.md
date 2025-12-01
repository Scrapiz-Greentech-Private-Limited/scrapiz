# Django Admin Carousel Setup - Quick Guide

## 🚀 Setup Steps

### 1. Run Migrations

```bash
cd server
python manage.py makemigrations content
python manage.py migrate content
```

### 2. Create Superuser (if needed)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 3. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

This will collect the custom CSS and JS files for the admin interface.

### 4. Start Django Server

```bash
python manage.py runserver
```

### 5. Access Django Admin

Open your browser and go to:
```
http://localhost:8000/admin/
```

Login with your superuser credentials.

## 📋 Django Admin Features

### Enhanced Carousel Management

The Django admin now includes:

✅ **Visual Preview**
- Thumbnail preview in list view
- Large preview in detail view
- Automatic image loading

✅ **User-Friendly Interface**
- Clear field labels and help text
- S3 URL guidance
- Image size recommendations
- Inline editing for order and status

✅ **Smart Validation**
- Checks if URL is from S3
- Validates URL format
- Prevents invalid data

✅ **Quick Actions**
- Bulk activate/deactivate
- Bulk delete
- Quick reordering

✅ **Search & Filter**
- Search by title or URL
- Filter by active status
- Filter by creation date

## 🎨 Admin Interface Layout

### List View
```
┌─────────────────────────────────────────────────────────────┐
│ CAROUSEL IMAGES                          [+ Add Carousel]   │
├─────────────────────────────────────────────────────────────┤
│ Search: [________________]  [Go]                            │
│                                                              │
│ Filters:                                                     │
│ ☐ Active                                                    │
│ ☐ Inactive                                                  │
│                                                              │
│ Preview | Title              | Order | Active | Created     │
├─────────────────────────────────────────────────────────────┤
│ [img]   | Become A Seller    |   0   |   ✓   | Dec 1, 2024│
│ [img]   | Refer & Earn       |   1   |   ✓   | Dec 1, 2024│
│ [img]   | Hassle Free        |   2   |   ✓   | Dec 1, 2024│
└─────────────────────────────────────────────────────────────┘
```

### Detail View
```
┌─────────────────────────────────────────────────────────────┐
│ Change Carousel Image                                        │
├─────────────────────────────────────────────────────────────┤
│ Carousel Image Information                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📸 How to Add Carousel Images:                          │ │
│ │ • Upload to S3 bucket: scrapiz-inventory                │ │
│ │ • Copy the full S3 URL                                  │ │
│ │ • Paste URL below                                       │ │
│ │ • Recommended: 1200x600px (2:1 ratio)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Title: [Become A Scrap Seller_________________]             │
│                                                              │
│ Image URL: [https://scrapiz-inventory.s3...___]             │
│                                                              │
│ Image Preview:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │              [Carousel Image Preview]                    │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Display Settings                                             │
│ Order: [0]                                                   │
│ Is Active: ☑                                                │
│                                                              │
│ [Save and add another] [Save and continue] [Save]           │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Example: Adding Your First Carousel

### Step-by-Step

1. **Upload to S3**
   ```
   File: become-seller.png
   Size: 1200x600px
   Bucket: scrapiz-inventory
   Path: carousel/become-seller.png
   ```

2. **Get S3 URL**
   ```
   https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/become-seller.png
   ```

3. **Add in Django Admin**
   - Go to: http://localhost:8000/admin/content/carouselimage/
   - Click: "Add Carousel Image"
   - Fill in:
     - Title: `Become A Scrap Seller`
     - Image URL: `https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/become-seller.png`
     - Order: `0`
     - Is Active: `✓`
   - Click: "Save"

4. **Verify in App**
   - Open the mobile app
   - Go to Home screen
   - Pull down to refresh
   - See your carousel image!

## 🔧 Customization

### Custom CSS Location
```
server/content/static/admin/css/carousel_admin.css
```

### Custom JS Location
```
server/content/static/admin/js/carousel_admin.js
```

### Modify Admin Behavior
Edit: `server/content/admin.py`

## 🐛 Troubleshooting

### Static Files Not Loading

```bash
# Collect static files again
python manage.py collectstatic --noinput

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Admin Not Showing Carousel Section

```bash
# Check if content app is in INSTALLED_APPS
# server/server/settings.py should have:
INSTALLED_APPS = [
    # ...
    'content',
    # ...
]

# Run migrations
python manage.py migrate content
```

### Images Not Showing in App

1. Check if image is marked as "Active" in admin
2. Verify S3 URL is correct and accessible
3. Refresh the app (pull down on home screen)
4. Check API endpoint: http://localhost:8000/api/content/carousel/

## 📊 Database Schema

```sql
CREATE TABLE content_carouselimage (
    id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX content_car_order_a_idx 
ON content_carouselimage (order, is_active);
```

## 🔐 Permissions

### Required Permissions

To manage carousel images, users need:
- `content.add_carouselimage`
- `content.change_carouselimage`
- `content.delete_carouselimage`
- `content.view_carouselimage`

### Grant Permissions

```python
# In Django shell
from django.contrib.auth.models import User, Permission

user = User.objects.get(username='your_username')
permissions = Permission.objects.filter(
    content_type__app_label='content',
    content_type__model='carouselimage'
)
user.user_permissions.add(*permissions)
```

## ✅ Verification Checklist

- [ ] Migrations applied successfully
- [ ] Static files collected
- [ ] Django admin accessible
- [ ] Carousel Images section visible
- [ ] Can add new carousel image
- [ ] Preview shows correctly
- [ ] Can edit existing images
- [ ] Can reorder images
- [ ] Can activate/deactivate images
- [ ] Changes reflect in mobile app

## 📚 Additional Resources

- **Full Admin Guide**: `server/content/DJANGO_ADMIN_GUIDE.md`
- **API Documentation**: `CAROUSEL_SETUP.md`
- **Quick Start**: `CAROUSEL_QUICK_START.md`

---

**Ready to go!** 🎉

Your Django admin is now set up with a professional carousel management interface.
