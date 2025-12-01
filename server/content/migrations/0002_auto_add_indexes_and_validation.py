# Generated migration for adding indexes and validation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='carouselimage',
            name='title',
            field=models.CharField(help_text="Title/description of the carousel image (e.g., 'Become A Scrap Seller')", max_length=200),
        ),
        migrations.AlterField(
            model_name='carouselimage',
            name='image_url',
            field=models.URLField(help_text='Full S3 URL of the carousel image (e.g., https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/image.png)', max_length=500),
        ),
        migrations.AlterField(
            model_name='carouselimage',
            name='order',
            field=models.IntegerField(default=0, help_text='Display order (0 = first, 1 = second, etc.)'),
        ),
        migrations.AlterField(
            model_name='carouselimage',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Uncheck to hide this image from the app without deleting it'),
        ),
        migrations.AddIndex(
            model_name='carouselimage',
            index=models.Index(fields=['order', 'is_active'], name='content_car_order_a_idx'),
        ),
    ]
