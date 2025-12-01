// Custom JavaScript for Carousel Admin

(function($) {
    $(document).ready(function() {
        // Add help text for S3 URL field
        var imageUrlField = $('.field-image_url');
        if (imageUrlField.length) {
            var helpHtml = `
                <div class="carousel-help-text">
                    <h4>📸 How to Add Carousel Images:</h4>
                    <ul>
                        <li><strong>Step 1:</strong> Upload your image to S3 bucket: <code>scrapiz-inventory</code></li>
                        <li><strong>Step 2:</strong> Copy the full S3 URL (e.g., <code>https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/image.png</code>)</li>
                        <li><strong>Step 3:</strong> Paste the URL in the field above</li>
                        <li><strong>Recommended Size:</strong> 1200x600px (2:1 aspect ratio)</li>
                        <li><strong>Format:</strong> PNG or JPG, max 2MB</li>
                    </ul>
                </div>
            `;
            imageUrlField.after(helpHtml);
        }
        
        // Auto-preview image when URL is pasted
        var imageUrlInput = $('#id_image_url');
        if (imageUrlInput.length) {
            imageUrlInput.on('blur', function() {
                var url = $(this).val();
                if (url && url.startsWith('http')) {
                    // Trigger a preview update (if preview exists)
                    console.log('Image URL updated:', url);
                }
            });
        }
        
        // Add visual feedback for active/inactive status
        $('.field-is_active input[type="checkbox"]').each(function() {
            var checkbox = $(this);
            var row = checkbox.closest('tr');
            
            function updateRowStyle() {
                if (checkbox.is(':checked')) {
                    row.css('background-color', '#e8f5e9');
                } else {
                    row.css('background-color', '#ffebee');
                }
            }
            
            updateRowStyle();
            checkbox.on('change', updateRowStyle);
        });
        
        // Add order number validation
        $('.field-order input').on('change', function() {
            var value = parseInt($(this).val());
            if (value < 0) {
                alert('Order number cannot be negative!');
                $(this).val(0);
            }
        });
    });
})(django.jQuery);
