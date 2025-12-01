# Django Admin Carousel - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1️⃣ Upload to S3
```
Bucket: scrapiz-inventory
Folder: carousel/
Size: 1200x600px
Format: PNG or JPG
```

### 2️⃣ Add in Django Admin
```
URL: http://localhost:8000/admin/content/carouselimage/add/
Title: Your carousel title
Image URL: https://scrapiz-inventory.s3...
Order: 0 (first), 1 (second), etc.
Is Active: ✓
```

### 3️⃣ Verify in App
```
Open mobile app
Go to Home screen
Pull down to refresh
See your carousel!
```

---

## 📋 Field Reference

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Title** | Text | ✅ | Descriptive name | "Become A Scrap Seller" |
| **Image URL** | URL | ✅ | Full S3 URL | https://scrapiz-inventory.s3... |
| **Order** | Number | ✅ | Display position | 0, 1, 2, ... |
| **Is Active** | Checkbox | ✅ | Show/hide | ✓ or ✗ |

---

## 🎯 Common Tasks

### Add New Carousel
1. Click "Add Carousel Image"
2. Fill in title and S3 URL
3. Set order number
4. Check "Is Active"
5. Click "Save"

### Edit Existing
1. Click on carousel in list
2. Modify fields
3. Click "Save"

### Reorder
1. Change order numbers
2. Click "Save"
3. Lower numbers appear first

### Hide Temporarily
1. Uncheck "Is Active"
2. Click "Save"
3. Image hidden but not deleted

### Delete
1. Select checkbox(es)
2. Choose "Delete selected"
3. Click "Go"
4. Confirm deletion

---

## 🔍 Search & Filter

### Search
- By title
- By URL
- Use search box at top

### Filter
- **By Status**: Active / Inactive
- **By Date**: Creation date
- Use sidebar filters

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | `Ctrl + S` (Windows) / `Cmd + S` (Mac) |
| Save and continue | `Ctrl + Shift + S` |
| Cancel | `Esc` |

---

## ✅ Validation Rules

| Rule | Description |
|------|-------------|
| **Title** | Max 200 characters |
| **Image URL** | Must be valid URL |
| **Image URL** | Must contain "s3" or "amazonaws" |
| **Order** | Must be number ≥ 0 |
| **Is Active** | Boolean (checked/unchecked) |

---

## 🎨 Image Guidelines

### Size
- **Recommended**: 1200x600px
- **Aspect Ratio**: 2:1
- **Min**: 800x400px
- **Max**: 2000x1000px

### Format
- **Preferred**: PNG (for graphics)
- **Alternative**: JPG (for photos)
- **Max File Size**: 2MB

### Quality
- High resolution
- Clear text
- Good contrast
- Professional design

---

## 🔧 Troubleshooting

### Image Not Showing in App
✓ Check "Is Active" is checked
✓ Verify S3 URL is correct
✓ Test URL in browser
✓ Refresh app (pull down)

### Preview Not Loading
✓ Check URL is accessible
✓ Verify S3 permissions
✓ Clear browser cache
✓ Try different browser

### Order Not Working
✓ Use numbers: 0, 1, 2...
✓ Not: 1, 10, 2 (wrong order)
✓ Save after changing
✓ Refresh app

---

## 📞 Quick Help

### Access Django Admin
```
URL: http://localhost:8000/admin/
or
URL: https://api.scrapiz.in/admin/
```

### Carousel Section
```
Navigation: Content → Carousel Images
Direct: /admin/content/carouselimage/
```

### API Endpoint
```
Public: GET /api/content/carousel/
Admin: POST /api/content/carousel/
```

---

## 💡 Pro Tips

1. **Naming**: Use descriptive titles
2. **Ordering**: Start from 0
3. **Testing**: Use inactive first
4. **Backup**: Keep original images
5. **Organize**: Use folders in S3

---

## 🎯 Best Practices

### Content
- Update regularly
- Rotate seasonal content
- Test on mobile first
- Use high-quality images
- Keep text minimal

### Technical
- Organize S3 files
- Use consistent naming
- Set proper permissions
- Monitor file sizes
- Regular cleanup

### Management
- Document changes
- Test before activating
- Keep inactive as backup
- Monitor performance
- Get user feedback

---

## 📊 Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✓ | Active (visible in app) |
| ✗ | Inactive (hidden) |
| 🟢 | Green row = Active |
| 🔴 | Red row = Inactive |

---

## 🔐 Permissions Required

- `content.add_carouselimage`
- `content.change_carouselimage`
- `content.delete_carouselimage`
- `content.view_carouselimage`

---

## 📱 Mobile App Display

**Location**: Home screen, below search bar
**Size**: Full width with padding
**Behavior**: Auto-plays every 4 seconds
**Navigation**: Swipe or auto-advance
**Indicator**: Pagination dots

---

## ⚠️ Important Notes

- Changes are immediate
- No undo for delete
- Order affects display
- Inactive = hidden, not deleted
- S3 URLs must be public

---

## 🎉 Quick Checklist

Before adding carousel:
- [ ] Image uploaded to S3
- [ ] Image is 1200x600px
- [ ] S3 URL is public
- [ ] Title is descriptive
- [ ] Order number set
- [ ] Is Active checked
- [ ] Saved successfully
- [ ] Tested in app

---

**Need more help?** See `DJANGO_ADMIN_GUIDE.md`

**Last Updated**: December 2024
