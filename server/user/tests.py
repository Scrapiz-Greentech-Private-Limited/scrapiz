import datetime
import os

import jwt
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import User
from .models import NotificationPreference


class NotificationPreferenceAPITests(APITestCase):
	def setUp(self):
		self.secret = 'test-frontend-secret'
		os.environ['FRONTEND_SECRET'] = self.secret

		self.user = User.objects.create_user(
			email='test@example.com',
			password='strong-password',
			name='Test User'
		)

		payload = {
			'id': self.user.id,
			'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
			'iat': datetime.datetime.utcnow(),
		}
		token = jwt.encode(payload, 'secret', algorithm='HS256')
		self.token = token.decode('utf-8') if isinstance(token, bytes) else token

		self.url = reverse('notification-settings')

	def tearDown(self):
		if 'FRONTEND_SECRET' in os.environ:
			del os.environ['FRONTEND_SECRET']

	def _auth_headers(self):
		return {
			'HTTP_AUTHORIZATION': self.token,
			'HTTP_X_AUTH_APP': self.secret,
		}

	def test_get_notification_preferences_creates_defaults(self):
		self.assertFalse(NotificationPreference.objects.filter(user=self.user).exists())

		response = self.client.get(self.url, **self._auth_headers())

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		data = response.data
		self.assertTrue(data['push_notifications'])
		self.assertTrue(data['pickup_reminders'])
		self.assertTrue(NotificationPreference.objects.filter(user=self.user).exists())

	def test_patch_notification_preferences_updates_values(self):
		response = self.client.patch(
			self.url,
			{'push_notifications': False, 'sms_notifications': True},
			format='json',
			**self._auth_headers()
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		preference = NotificationPreference.objects.get(user=self.user)
		self.assertFalse(preference.push_notifications)
		self.assertTrue(preference.sms_notifications)
