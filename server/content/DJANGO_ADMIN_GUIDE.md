# Django Admin - Carousel Management Guide

## 🎯 Overview

This guide explains how to manage carousel images directly from the Django Admin panel. The carousel images appear on the home screen of the mobile app.

## 📍 Accessing Carousel Management

1. **Login to Django Admin**
   ```
   URL: https://api.scrapiz.in/admin/
   or
   URL: http://localhost:8000/admin/
   ```

2. **Navigate to Carousel Images**
   - Look for the **CONTENT** section in the admin sidebar
   - Click on **Carousel Images**

## ➕ Adding a New Carousel Image

### Step 1: Upload Image to S3

Before adding to Django admin, upload your image to S3:

1. **Image Requirements:**
   - Recommended size: 1200x600px (2:1 aspect ratio)
   - Format: PNG or JPG
   - Max file size: 2MB
   - Clear, high-quality images

2. **Upload to S3:**
   - Bucket: `scrapiz-inventory`
   - Folder: `carousel/` (recommended)
   - Make sure the image is publicly accessible

3. **Get the S3 URL:**
   ```
   Example: https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/become-seller.png
   ```

### Step 2: Add to Django Admin

1. Click **"Add Carousel Image"** button (top right)

2. **Fill in the form:**

   **Carousel Image Information:**
   - **Title**: Descriptive name (e.g., "Become A Scrap Seller")
   - **Image URL**: Paste the full S3 URL from Step 1
   - **Preview**: Will show automatically after saving

   **Display Settings:**
   - **Order**: Number indicating position (0 = first, 1 = second, etc.)
   - **Is Active**: Check to display, uncheck to hide

3. Click **"Save"** or **"Save and add another"**

## ✏️ Editing Carousel Images

1. Click on any carousel image in the list
2. Modify the fields as needed
3. Click **"Save"** to apply changes

### Quick Edit from List View

You can quickly edit **Order** and **Is Active** directly from the list:
1. Change the values in the list
2. Scroll to bottom
3. Click **"Save"**

## 🔄 Reordering Carousel Images

The **Order** field controls the display sequence:

- **0** = First image (leftmost)
- **1** = Second image
- **2** = Third image
- And so on...

**To reorder:**
1. Edit the Order number for each image
2. Save changes
3. The app will automatically display them in the new order

## 👁️ Activating/Deactivating Images

Use the **Is Active** checkbox to control visibility:

- ✅ **Checked (Active)**: Image appears in the app
- ❌ **Unchecked (Inactive)**: Image is hidden but not deleted

**Benefits:**
- Temporarily hide seasonal/promotional images
- Test new images before making them live
- Keep historical images without deleting

## 🗑️ Deleting Carousel Images

1. Select the image(s) to delete (checkbox on left)
2. Choose **"Delete selected carousel images"** from the action dropdown
3. Click **"Go"**
4. Confirm deletion

⚠️ **Warning**: Deletion is permanent!

## 📊 List View Features

The carousel list shows:

| Column | Description |
|--------|-------------|
| **Preview** | Small thumbnail of the image |
| **Title** | Name of the carousel image |
| **Order** | Display position (editable) |
| **Is Active** | Visibility status (editable) |
| **Created At** | When it was added |
| **Updated At** | Last modification time |

### Visual Indicators

- ✓ = Active image (green background)
- ✗ = Inactive image (red background)

## 🔍 Searching and Filtering

**Search:**
- Use the search box to find images by title or URL

**Filters (right sidebar):**
- **By Is Active**: Show only active or inactive images
- **By Created At**: Filter by date added

## 💡 Best Practices

### Image Guidelines

1. **Aspect Ratio**: Always use 2:1 ratio (1200x600px recommended)
2. **File Size**: Keep under 2MB for fast loading
3. **Quality**: Use high-resolution images
4. **Content**: Clear, readable text and graphics
5. **Branding**: Consistent with app design

### Ordering Strategy

1. **Most Important First**: Put key messages at order 0
2. **Seasonal Content**: Use middle positions
3. **Evergreen Content**: Can be at any position
4. **Test Order**: Monitor which positions get most engagement

### Naming Convention

Use descriptive titles:
- ✅ Good: "Become A Scrap Seller - Promo"
- ✅ Good: "Refer & Earn - Diwali 2024"
- ❌ Bad: "Image 1"
- ❌ Bad: "Banner"

## 🔧 Troubleshooting

### Image Not Showing in App

**Check:**
1. Is the image marked as **Active**? ✓
2. Is the S3 URL correct and accessible?
3. Is the image publicly readable on S3?
4. Did you save the changes?
5. Try refreshing the app (pull down on home screen)

### Image Preview Not Loading in Admin

**Possible causes:**
1. Invalid S3 URL
2. Image file doesn't exist at that URL
3. S3 bucket permissions issue
4. Network connectivity problem

**Solution:**
- Verify the URL in a browser
- Check S3 bucket permissions
- Re-upload the image if needed

### Order Numbers Not Working

**Remember:**
- Order is sorted numerically (0, 1, 2, not 1, 10, 2)
- Duplicate order numbers are allowed but not recommended
- Changes take effect immediately after saving

## 📱 How It Appears in the App

The carousel images appear on the **Home Screen**:

1. **Location**: Below the search bar, above "Quick Actions"
2. **Display**: Full-width carousel with rounded corners
3. **Behavior**: 
   - Auto-plays every 4 seconds
   - Users can swipe to navigate
   - Pagination dots show current position
4. **Order**: Displays in the order you set (0, 1, 2, ...)

## 🔐 Permissions

Only **superusers** and **staff** with appropriate permissions can:
- Add carousel images
- Edit carousel images
- Delete carousel images

Regular users can only view active images through the app.

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify S3 URLs are correct
3. Test in a browser
4. Check Django admin logs
5. Contact the development team

## 🎨 Example Carousel Images

Here are some example carousel configurations:

### Example 1: Promotional Banner
```
Title: Become A Scrap Seller
Image URL: https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/become-seller.png
Order: 0
Is Active: ✓
```

### Example 2: Referral Program
```
Title: Refer & Earn Rewards
Image URL: https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/refer-earn.png
Order: 1
Is Active: ✓
```

### Example 3: Service Highlight
```
Title: Hassle Free Service
Image URL: https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/hassle-free.png
Order: 2
Is Active: ✓
```

## ✅ Quick Checklist

Before adding a carousel image:

- [ ] Image uploaded to S3
- [ ] Image is 1200x600px (2:1 ratio)
- [ ] S3 URL is publicly accessible
- [ ] Title is descriptive
- [ ] Order number is set correctly
- [ ] Is Active is checked
- [ ] Preview looks good in admin
- [ ] Tested in the app

---

**Last Updated**: December 2024
**Version**: 1.0
