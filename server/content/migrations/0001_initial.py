# Generated migration file for CarouselImage model

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CarouselImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Title/description of the carousel image', max_length=200)),
                ('image_url', models.URLField(help_text='S3 URL of the carousel image', max_length=500)),
                ('order', models.IntegerField(default=0, help_text='Display order (lower numbers appear first)')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this image is currently displayed')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Carousel Image',
                'verbose_name_plural': 'Carousel Images',
                'ordering': ['order', '-created_at'],
            },
        ),
    ]
