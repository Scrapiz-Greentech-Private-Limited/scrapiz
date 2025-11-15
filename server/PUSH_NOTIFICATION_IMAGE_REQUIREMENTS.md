# Push Notification Image Requirements

## Overview

Push notifications can include optional images to make them more visually engaging and informative. This document describes the technical requirements, storage options, and best practices for notification images.

## Image Requirements

### Supported Formats

| Format | Extension | Use Case | Notes |
|--------|-----------|----------|-------|
| PNG | `.png` | Graphics, logos, icons | Supports transparency |
| JPEG | `.jpg`, `.jpeg` | Photos, complex images | Smaller file size |

**Not Supported**: GIF, WebP, SVG, BMP, TIFF

### Dimensions

#### Recommended Dimensions

- **Width**: 1024 pixels
- **Height**: 512 pixels
- **Aspect Ratio**: 2:1 (landscape)

#### Minimum Dimensions

- **Width**: 512 pixels
- **Height**: 256 pixels

#### Maximum Dimensions

- **Width**: 2048 pixels
- **Height**: 1024 pixels

**Important**: Images larger than maximum dimensions may be rejected or cause rendering issues on some devices.

### File Size

- **Recommended**: 100-300 KB
- **Maximum**: 1 MB (1024 KB)

**Note**: Larger files may cause:
- Slower notification delivery
- Increased data usage for users
- Timeout errors on slow connections
- Rejection by Expo Push Service

### Aspect Ratios

| Aspect Ratio | Dimensions | Use Case |
|--------------|------------|----------|
| 2:1 (Recommended) | 1024x512 | Standard notification images |
| 16:9 | 1024x576 | Video thumbnails, wide content |
| 1:1 | 512x512 | Square images, product photos |

**Best Practice**: Use 2:1 aspect ratio for consistent rendering across devices.

## Image Storage Options

### 1. Content Delivery Network (CDN)

**Recommended for**: Production environments, high-traffic applications

**Advantages**:
- Fast global delivery
- High availability
- Automatic caching
- Reduced server load

**Popular CDN Providers**:
- **Cloudflare**: Free tier available, easy setup
- **Amazon CloudFront**: Integrates with S3, pay-as-you-go
- **Fastly**: High performance, real-time purging
- **Cloudinary**: Image optimization and transformation

**Example URL**:
```
https://cdn.example.com/notifications/promo-banner.png
```

### 2. Cloud Storage

**Recommended for**: Scalable storage, integration with existing infrastructure

#### Amazon S3

**Setup**:
1. Create S3 bucket
2. Enable public read access for notification images
3. Configure CORS if needed
4. Use CloudFront for CDN

**Example URL**:
```
https://your-bucket.s3.amazonaws.com/notifications/promo-banner.png
```

**Best Practices**:
- Use separate bucket for public assets
- Enable versioning for image updates
- Set appropriate cache headers
- Use lifecycle policies to archive old images

#### Google Cloud Storage

**Setup**:
1. Create Cloud Storage bucket
2. Set bucket permissions to public
3. Enable Cloud CDN
4. Configure object lifecycle

**Example URL**:
```
https://storage.googleapis.com/your-bucket/notifications/promo-banner.png
```

#### Azure Blob Storage

**Setup**:
1. Create storage account
2. Create container with public access
3. Enable Azure CDN
4. Configure CORS settings

**Example URL**:
```
https://youraccount.blob.core.windows.net/notifications/promo-banner.png
```

### 3. Self-Hosted Server

**Recommended for**: Small-scale deployments, testing

**Requirements**:
- High availability (99.9%+ uptime)
- Fast response times (<200ms)
- HTTPS enabled
- Sufficient bandwidth

**Example URL**:
```
https://api.example.com/static/notifications/promo-banner.png
```

**Considerations**:
- Ensure server can handle traffic spikes
- Implement caching headers
- Monitor bandwidth usage
- Have backup/failover strategy

### 4. Image Hosting Services

**Recommended for**: Quick setup, testing, small projects

#### Imgur

- **Free tier**: Available
- **Max file size**: 20 MB (but keep under 1 MB for notifications)
- **URL format**: `https://i.imgur.com/xxxxx.png`
- **Note**: Check terms of service for commercial use

#### Cloudinary

- **Free tier**: 25 GB storage, 25 GB bandwidth
- **Features**: Automatic optimization, transformations
- **URL format**: `https://res.cloudinary.com/your-cloud/image/upload/v1/notifications/image.png`
- **Recommended**: Good balance of features and ease of use

## Image URL Requirements

### URL Format

- **Protocol**: HTTPS (required)
- **Domain**: Publicly accessible
- **Path**: Direct link to image file
- **Authentication**: None (must be publicly accessible)

### Valid URL Examples

```
✅ https://cdn.example.com/notifications/promo.png
✅ https://storage.googleapis.com/bucket/image.jpg
✅ https://res.cloudinary.com/cloud/image/upload/v1/promo.png
✅ https://your-bucket.s3.amazonaws.com/notifications/banner.jpg
```

### Invalid URL Examples

```
❌ http://example.com/image.png (HTTP not allowed)
❌ https://example.com/image (no file extension)
❌ https://example.com/image.gif (unsupported format)
❌ https://private-bucket.s3.amazonaws.com/image.png (requires authentication)
❌ file:///local/path/image.png (local file path)
❌ data:image/png;base64,... (base64 encoded)
```

## Image Validation

### Backend Validation

The backend validates images before sending notifications:

```python
def validate_notification_image(image_url: str) -> bool:
    """
    Validate notification image URL
    
    Returns:
        bool: True if valid, False otherwise
    """
    if not image_url:
        return True  # Optional field
    
    # Check HTTPS
    if not image_url.startswith('https://'):
        logger.warning(f"Image URL must use HTTPS: {image_url}")
        return False
    
    # Check file extension
    valid_extensions = ['.png', '.jpg', '.jpeg']
    if not any(image_url.lower().endswith(ext) for ext in valid_extensions):
        logger.warning(f"Invalid image format: {image_url}")
        return False
    
    # Check accessibility
    try:
        response = requests.head(image_url, timeout=5)
        if response.status_code != 200:
            logger.warning(f"Image not accessible: {image_url} (status: {response.status_code})")
            return False
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            logger.warning(f"Invalid content type: {content_type}")
            return False
        
        # Check file size
        content_length = int(response.headers.get('Content-Length', 0))
        if content_length > 1024 * 1024:  # 1 MB
            logger.warning(f"Image too large: {content_length} bytes")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Error validating image: {str(e)}")
        return False
```

### Graceful Degradation

If image validation fails:
1. Log warning with details
2. Send notification without image
3. Notify admin of validation failure
4. Continue with text-only notification

## Image Optimization

### Compression

Use image compression tools to reduce file size:

- **TinyPNG**: https://tinypng.com/ (PNG, JPEG)
- **ImageOptim**: https://imageoptim.com/ (Mac)
- **Squoosh**: https://squoosh.app/ (Web-based)
- **Sharp**: https://sharp.pixelplumbing.com/ (Node.js)

**Target**: 70-80% quality for JPEG, lossless for PNG

### Responsive Images

Consider creating multiple sizes for different devices:

```
notifications/
  ├── promo-banner-1x.png (512x256)
  ├── promo-banner-2x.png (1024x512)
  └── promo-banner-3x.png (2048x1024)
```

**Note**: Currently, only one image URL is supported per notification. Choose the 2x version (1024x512) for best results.

### Image Formats

| Format | Best For | Compression | Transparency |
|--------|----------|-------------|--------------|
| PNG | Logos, graphics, text | Lossless | Yes |
| JPEG | Photos, complex images | Lossy | No |

**Recommendation**: Use PNG for graphics with text or transparency, JPEG for photos.

## Platform-Specific Behavior

### iOS

- **Supported**: iOS 10+
- **Display**: Rich notification with image below text
- **Size**: Automatically scaled to fit
- **Aspect Ratio**: Preserved
- **Loading**: Cached after first display

### Android

- **Supported**: Android 4.1+ (API 16+)
- **Display**: Large icon or big picture style
- **Size**: Automatically scaled
- **Aspect Ratio**: May be cropped to fit
- **Loading**: Downloaded on notification receipt

### Web (PWA)

- **Supported**: Chrome, Firefox, Edge
- **Display**: Varies by browser
- **Size**: Limited by browser
- **Note**: Not all browsers support notification images

## Best Practices

### 1. Use High-Quality Images

- Avoid pixelated or blurry images
- Use professional graphics or photos
- Ensure text in images is readable

### 2. Optimize for Mobile

- Keep file size small (<300 KB)
- Use appropriate dimensions (1024x512)
- Test on actual devices

### 3. Consider Accessibility

- Don't rely solely on images to convey information
- Include descriptive text in notification body
- Use high contrast for text in images

### 4. Test Thoroughly

- Test on iOS and Android devices
- Verify image loads quickly
- Check appearance in different notification states
- Test with slow network connections

### 5. Use Consistent Branding

- Maintain consistent visual style
- Use brand colors and fonts
- Include logo or brand elements

### 6. Cache and CDN

- Use CDN for fast global delivery
- Set appropriate cache headers
- Use versioned URLs for updates

### 7. Monitor Performance

- Track image load times
- Monitor bandwidth usage
- Log validation failures
- Alert on high failure rates

## Image Naming Conventions

### Recommended Structure

```
notifications/
  ├── orders/
  │   ├── order-confirmed.png
  │   ├── order-shipped.png
  │   └── order-delivered.png
  ├── promotions/
  │   ├── summer-sale-2024.png
  │   ├── black-friday-2024.png
  │   └── new-year-offer-2025.png
  └── announcements/
      ├── new-feature-rewards.png
      └── app-update-v2.png
```

### Naming Best Practices

- Use lowercase
- Use hyphens (not underscores or spaces)
- Include date or version for time-sensitive images
- Be descriptive but concise
- Include category in path

## Security Considerations

### 1. HTTPS Only

Always use HTTPS URLs to prevent man-in-the-middle attacks.

### 2. Public Access

Images must be publicly accessible without authentication. Don't include:
- Sensitive information
- Personal data
- Confidential content

### 3. Content Validation

Validate image content to prevent:
- Inappropriate images
- Malicious content
- Copyright violations

### 4. URL Validation

Validate URLs to prevent:
- Server-side request forgery (SSRF)
- Redirect attacks
- Malformed URLs

## Troubleshooting

### Image Not Displaying

**Possible Causes**:
1. URL not accessible (404, 403, 500 errors)
2. Image format not supported
3. File size too large
4. HTTPS not used
5. Slow network connection
6. Device doesn't support rich notifications

**Solutions**:
1. Verify URL in browser
2. Check image format (PNG or JPEG only)
3. Reduce file size (<1 MB)
4. Use HTTPS
5. Test with different networks
6. Test on newer devices

### Image Loads Slowly

**Possible Causes**:
1. Large file size
2. Slow server response
3. No CDN
4. Poor network connection

**Solutions**:
1. Compress image
2. Use faster hosting
3. Implement CDN
4. Optimize image dimensions

### Image Appears Distorted

**Possible Causes**:
1. Wrong aspect ratio
2. Image too small
3. Platform-specific scaling

**Solutions**:
1. Use 2:1 aspect ratio (1024x512)
2. Use recommended dimensions
3. Test on target platforms

## Examples

### Example 1: Order Confirmation

**Image**: Product photo or order summary graphic
**Dimensions**: 1024x512 pixels
**Format**: JPEG
**File Size**: 150 KB
**URL**: `https://cdn.example.com/notifications/orders/order-confirmed.jpg`

### Example 2: Promotional Sale

**Image**: Sale banner with discount percentage
**Dimensions**: 1024x512 pixels
**Format**: PNG (for text clarity)
**File Size**: 200 KB
**URL**: `https://cdn.example.com/notifications/promotions/summer-sale-2024.png`

### Example 3: Feature Announcement

**Image**: Screenshot of new feature
**Dimensions**: 1024x512 pixels
**Format**: PNG
**File Size**: 250 KB
**URL**: `https://cdn.example.com/notifications/announcements/new-rewards-feature.png`

## Tools and Resources

### Image Editing

- **Figma**: https://figma.com (Design tool)
- **Canva**: https://canva.com (Template-based design)
- **Photoshop**: Professional image editing
- **GIMP**: Free alternative to Photoshop

### Image Optimization

- **TinyPNG**: https://tinypng.com
- **ImageOptim**: https://imageoptim.com
- **Squoosh**: https://squoosh.app
- **Kraken.io**: https://kraken.io

### Image Hosting

- **Cloudinary**: https://cloudinary.com
- **Imgur**: https://imgur.com
- **AWS S3**: https://aws.amazon.com/s3
- **Google Cloud Storage**: https://cloud.google.com/storage

### Testing

- **Expo Push Notification Tool**: https://expo.dev/notifications
- **OneSignal**: https://onesignal.com (for testing)
- **Physical devices**: Always test on real devices

## Checklist

Before using an image in a push notification:

- [ ] Image is in PNG or JPEG format
- [ ] Dimensions are 1024x512 pixels (or appropriate aspect ratio)
- [ ] File size is under 1 MB (preferably under 300 KB)
- [ ] Image is hosted on HTTPS URL
- [ ] URL is publicly accessible (no authentication required)
- [ ] Image loads quickly (<2 seconds)
- [ ] Image is optimized and compressed
- [ ] Image has been tested on iOS and Android devices
- [ ] Image content is appropriate and professional
- [ ] Image includes branding elements (if applicable)
- [ ] Backup plan exists if image fails to load (text-only notification)

## Support

For questions about notification images:
1. Verify image meets all requirements
2. Test URL in browser
3. Check server logs for validation errors
4. Contact development team with specific error details
