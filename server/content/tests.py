from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import CarouselImage

User = get_user_model()


class CarouselImageModelTest(TestCase):
    def setUp(self):
        self.carousel = CarouselImage.objects.create(
            title="Test Carousel",
            image_url="https://example.com/image.png",
            order=0,
            is_active=True
        )

    def test_carousel_creation(self):
        self.assertEqual(self.carousel.title, "Test Carousel")
        self.assertEqual(self.carousel.order, 0)
        self.assertTrue(self.carousel.is_active)

    def test_carousel_str(self):
        self.assertEqual(str(self.carousel), "Test Carousel (Order: 0)")


class CarouselImageAPITest(APITestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='testpass123',
            name='Admin User'
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='testpass123',
            name='Regular User'
        )
        
        # Create test carousel images
        self.carousel1 = CarouselImage.objects.create(
            title="Carousel 1",
            image_url="https://example.com/image1.png",
            order=0,
            is_active=True
        )
        
        self.carousel2 = CarouselImage.objects.create(
            title="Carousel 2",
            image_url="https://example.com/image2.png",
            order=1,
            is_active=False
        )

    def test_public_list_carousel_images(self):
        """Test that public users can only see active carousel images"""
        response = self.client.get('/api/content/carousel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only active image

    def test_admin_list_all_carousel_images(self):
        """Test that admin users can see all carousel images"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/content/carousel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # All images

    def test_create_carousel_image_as_admin(self):
        """Test that admin can create carousel images"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'title': 'New Carousel',
            'image_url': 'https://example.com/new.png',
            'order': 2,
            'is_active': True
        }
        response = self.client.post('/api/content/carousel/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CarouselImage.objects.count(), 3)

    def test_create_carousel_image_as_regular_user(self):
        """Test that regular users cannot create carousel images"""
        self.client.force_authenticate(user=self.regular_user)
        data = {
            'title': 'New Carousel',
            'image_url': 'https://example.com/new.png',
            'order': 2,
            'is_active': True
        }
        response = self.client.post('/api/content/carousel/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_carousel_image(self):
        """Test updating carousel image"""
        self.client.force_authenticate(user=self.admin_user)
        data = {'is_active': True}
        response = self.client.patch(
            f'/api/content/carousel/{self.carousel2.id}/',
            data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.carousel2.refresh_from_db()
        self.assertTrue(self.carousel2.is_active)

    def test_delete_carousel_image(self):
        """Test deleting carousel image"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/content/carousel/{self.carousel1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CarouselImage.objects.count(), 1)

    def test_reorder_carousel_images(self):
        """Test reordering carousel images"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'orders': [
                {'id': self.carousel1.id, 'order': 1},
                {'id': self.carousel2.id, 'order': 0}
            ]
        }
        response = self.client.post('/api/content/carousel/reorder/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.carousel1.refresh_from_db()
        self.carousel2.refresh_from_db()
        self.assertEqual(self.carousel1.order, 1)
        self.assertEqual(self.carousel2.order, 0)
