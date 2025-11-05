# Order Status Update Implementation

## Summary

Added functionality to update order status both via API and Django admin panel.

## Changes Made

### 1. New API Endpoint: Update Order Status

**Endpoint:** `POST /api/inventory/update-order-status/`

**Headers:**
```
Authorization: <JWT_TOKEN>
x-auth-app: Scrapiz#0nn$(tab!z
```

**Request Body:**
```json
{
  "order_number": "ABC123",  // OR use "order_id": 1
  "status_id": 2
}
```

**Response (Success):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": 1,
    "order_number": "ABC123",
    "user": "user@example.com",
    "created_at": "2025-10-23T10:00:00Z",
    "status": {
      "id": 2,
      "name": "Processing"
    },
    "address": {...},
    "orders": [...],
    "images": [...]
  }
}
```

**Response (Error):**
```json
{
  "error": "Order not found"  // or "Status not found" or "status_id is required"
}
```

### 2. Admin Panel Updates

**Status Field:** Now editable in Django admin
- Admins can change order status directly from the admin panel
- Status dropdown shows all available statuses from the Status model

### 3. Serializer Updates

**OrderNoSerializer:**
- Added `address_id` field for write operations
- `status_id` already existed for write operations
- Both fields allow updating via API

## How to Use

### From Frontend (React Native):

```typescript
// Get available statuses first
const statuses = await fetch('/api/inventory/statuses/', {
  headers: {
    'Authorization': token,
    'x-auth-app': 'Scrapiz#0nn$(tab!z'
  }
});

// Update order status
const response = await fetch('/api/inventory/update-order-status/', {
  method: 'POST',
  headers: {
    'Authorization': token,
    'x-auth-app': 'Scrapiz#0nn$(tab!z',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order_number: 'ABC123',
    status_id: 2
  })
});
```

### From Django Admin:

1. Go to `http://localhost:8000/admin/inventory/orderno/`
2. Click on an order
3. Change the "Status" dropdown
4. Click "Save"

## S3 Image Storage

### Current Implementation ✅

**Storage Location:** `OrderNo.images` field (JSONField)
- Stores array of S3 URLs: `["https://bucket.s3.amazonaws.com/orders/123/img1.jpg", ...]`
- Visible in admin with thumbnails and clickable links
- Returned in API responses

**Why JSON Array?**
- Flexible: supports any number of images
- Standard practice for variable-length lists
- Easy to query and display
- No need for separate columns

**Admin Display:**
- List view: Shows image count (e.g., "2 image(s)")
- Detail view: Shows clickable URLs with thumbnails

### If You Need Separate Columns (Not Recommended)

If you absolutely need individual columns like `image_1`, `image_2`, etc.:

1. Modify `server/inventory/models.py`:
```python
class OrderNo(models.Model):
    # ... existing fields ...
    image_1 = models.URLField(null=True, blank=True)
    image_2 = models.URLField(null=True, blank=True)
    image_3 = models.URLField(null=True, blank=True)
    # ... add more as needed
```

2. Run migrations:
```bash
docker exec -it server_scrapiz_api python manage.py makemigrations
docker exec -it server_scrapiz_api python manage.py migrate
```

3. Update `views.py` to save to individual fields instead of JSON array

**However, this approach:**
- Limits the number of images
- Requires schema changes to add more images
- Makes queries more complex
- Is not recommended for production

## Testing

### Test Status Update:

```bash
# Get available statuses
curl -X GET http://localhost/api/inventory/statuses/ \
  -H "Authorization: YOUR_TOKEN" \
  -H "x-auth-app: Scrapiz#0nn$(tab!z"

# Update order status
curl -X POST http://localhost/api/inventory/update-order-status/ \
  -H "Authorization: YOUR_TOKEN" \
  -H "x-auth-app: Scrapiz#0nn$(tab!z" \
  -H "Content-Type: application/json" \
  -d '{"order_number": "ABC123", "status_id": 2}'
```

### Verify in Admin:

1. Login to admin: `http://localhost:8000/admin/`
2. Go to Inventory → Order nos
3. Check that status is displayed and editable
4. Check that images are displayed with thumbnails

## Files Modified

1. `server/inventory/views.py` - Added `UpdateOrderStatusAPIView`
2. `server/inventory/urls.py` - Added route for status update
3. `server/inventory/serializers.py` - Added `address_id` field
4. `server/inventory/admin.py` - Made status field editable
