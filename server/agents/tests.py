"""
Tests for the Agent Management System.
Tests the Agent, AgentDocument, and AgentAuditLog models.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
import re

from agents.models import Agent, AgentDocument, AgentAuditLog
from serviceability.models import ServiceableCity, ServiceablePincode
from authentication.models import User


class AgentModelTests(TestCase):
    """Tests for the Agent model"""

    def setUp(self):
        """Set up test data"""
        # Create a serviceable city and pincode for testing
        self.city = ServiceableCity.objects.create(
            name='Mumbai',
            state='Maharashtra',
            latitude=Decimal('19.076090'),
            longitude=Decimal('72.877426'),
            radius_km=Decimal('50.00'),
            status='available'
        )
        self.pincode = ServiceablePincode.objects.create(
            pincode='400001',
            city=self.city,
            area_name='Fort'
        )

    def test_agent_creation_generates_unique_code(self):
        """Test that creating an agent generates a unique agent code"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543210',
            email='test@example.com',
            address='123 Test Street, Mumbai'
        )
        
        # Verify agent code format: AGT-XXXXXX
        self.assertIsNotNone(agent.agent_code)
        self.assertTrue(re.match(r'^AGT-[A-Z0-9]{6}$', agent.agent_code))

    def test_agent_code_uniqueness(self):
        """Test that each agent gets a unique code"""
        agent1 = Agent.objects.create(
            name='Agent One',
            phone='9876543211',
            email='agent1@example.com',
            address='Address 1'
        )
        agent2 = Agent.objects.create(
            name='Agent Two',
            phone='9876543212',
            email='agent2@example.com',
            address='Address 2'
        )
        
        self.assertNotEqual(agent1.agent_code, agent2.agent_code)

    def test_agent_initial_status_is_onboarding(self):
        """Test that new agents have initial status 'onboarding'"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543213',
            email='test2@example.com',
            address='123 Test Street'
        )
        
        self.assertEqual(agent.status, 'onboarding')

    def test_agent_initial_kyc_status_is_pending(self):
        """Test that new agents have initial KYC status 'pending'"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543214',
            email='test3@example.com',
            address='123 Test Street'
        )
        
        self.assertEqual(agent.kyc_status, 'pending')

    def test_agent_default_values(self):
        """Test that agent has correct default values"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543215',
            email='test4@example.com',
            address='123 Test Street'
        )
        
        self.assertEqual(agent.availability, 'offline')
        self.assertEqual(agent.daily_capacity, 10)
        self.assertEqual(agent.current_day_orders, 0)
        self.assertEqual(agent.total_orders, 0)
        self.assertEqual(agent.completed_orders, 0)
        self.assertEqual(agent.average_rating, 0)
        self.assertEqual(agent.rating_count, 0)

    def test_agent_is_eligible_property(self):
        """Test the is_eligible property"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543216',
            email='test5@example.com',
            address='123 Test Street',
            status='active',
            kyc_status='verified'
        )
        agent.service_areas.add(self.pincode)
        
        self.assertTrue(agent.is_eligible)

    def test_agent_not_eligible_without_service_areas(self):
        """Test that agent is not eligible without service areas"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543217',
            email='test6@example.com',
            address='123 Test Street',
            status='active',
            kyc_status='verified'
        )
        
        self.assertFalse(agent.is_eligible)

    def test_agent_not_eligible_when_inactive(self):
        """Test that inactive agent is not eligible"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543218',
            email='test7@example.com',
            address='123 Test Street',
            status='inactive',
            kyc_status='verified'
        )
        agent.service_areas.add(self.pincode)
        
        self.assertFalse(agent.is_eligible)

    def test_agent_not_eligible_when_kyc_pending(self):
        """Test that agent with pending KYC is not eligible"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543219',
            email='test8@example.com',
            address='123 Test Street',
            status='active',
            kyc_status='pending'
        )
        agent.service_areas.add(self.pincode)
        
        self.assertFalse(agent.is_eligible)

    def test_agent_not_eligible_at_capacity(self):
        """Test that agent at capacity is not eligible"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543220',
            email='test9@example.com',
            address='123 Test Street',
            status='active',
            kyc_status='verified',
            daily_capacity=5,
            current_day_orders=5
        )
        agent.service_areas.add(self.pincode)
        
        self.assertFalse(agent.is_eligible)

    def test_update_rating(self):
        """Test the update_rating method"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543221',
            email='test10@example.com',
            address='123 Test Street'
        )
        
        # First rating
        agent.update_rating(4.0)
        self.assertEqual(agent.rating_count, 1)
        self.assertEqual(float(agent.average_rating), 4.0)
        
        # Second rating
        agent.update_rating(5.0)
        self.assertEqual(agent.rating_count, 2)
        self.assertEqual(float(agent.average_rating), 4.5)

    def test_update_rating_invalid_value(self):
        """Test that invalid rating raises ValidationError"""
        agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543222',
            email='test11@example.com',
            address='123 Test Street'
        )
        
        with self.assertRaises(ValidationError):
            agent.update_rating(6.0)
        
        with self.assertRaises(ValidationError):
            agent.update_rating(-1.0)


class AgentDocumentModelTests(TestCase):
    """Tests for the AgentDocument model"""

    def setUp(self):
        """Set up test data"""
        self.agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543230',
            email='doctest@example.com',
            address='123 Test Street'
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            name='Admin User'
        )

    def test_document_creation(self):
        """Test creating an agent document"""
        doc = AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar.pdf'
        )
        
        self.assertEqual(doc.verification_status, 'pending')
        self.assertIsNone(doc.verified_at)
        self.assertIsNone(doc.verified_by)

    def test_document_verify(self):
        """Test verifying a document"""
        doc = AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar.pdf'
        )
        
        doc.verify(self.admin_user)
        
        self.assertEqual(doc.verification_status, 'verified')
        self.assertIsNotNone(doc.verified_at)
        self.assertEqual(doc.verified_by, self.admin_user)

    def test_document_reject(self):
        """Test rejecting a document"""
        doc = AgentDocument.objects.create(
            agent=self.agent,
            document_type='pan',
            document_url='https://example.com/pan.pdf'
        )
        
        doc.reject(self.admin_user, 'Document is blurry')
        
        self.assertEqual(doc.verification_status, 'rejected')
        self.assertIsNotNone(doc.verified_at)
        self.assertEqual(doc.verified_by, self.admin_user)
        self.assertEqual(doc.rejection_reason, 'Document is blurry')

    def test_unique_document_type_per_agent(self):
        """Test that each agent can only have one document of each type"""
        AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar1.pdf'
        )
        
        # Attempting to create another aadhaar document should fail
        with self.assertRaises(Exception):
            AgentDocument.objects.create(
                agent=self.agent,
                document_type='aadhaar',
                document_url='https://example.com/aadhaar2.pdf'
            )


class AgentKYCStatusTests(TestCase):
    """Tests for KYC status derivation"""

    def setUp(self):
        """Set up test data"""
        self.agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543240',
            email='kyctest@example.com',
            address='123 Test Street'
        )
        self.admin_user = User.objects.create_user(
            email='kycadmin@example.com',
            password='testpass123',
            name='KYC Admin'
        )

    def test_kyc_verified_when_all_docs_verified(self):
        """Test KYC becomes verified when all required documents are verified"""
        # Create all required documents
        aadhaar = AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar.pdf'
        )
        pan = AgentDocument.objects.create(
            agent=self.agent,
            document_type='pan',
            document_url='https://example.com/pan.pdf'
        )
        dl = AgentDocument.objects.create(
            agent=self.agent,
            document_type='driving_license',
            document_url='https://example.com/dl.pdf'
        )
        
        # Verify all documents
        aadhaar.verify(self.admin_user)
        pan.verify(self.admin_user)
        dl.verify(self.admin_user)
        
        # Refresh agent from database
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.kyc_status, 'verified')

    def test_kyc_rejected_when_any_doc_rejected(self):
        """Test KYC becomes rejected when any required document is rejected"""
        # Create all required documents
        aadhaar = AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar.pdf'
        )
        pan = AgentDocument.objects.create(
            agent=self.agent,
            document_type='pan',
            document_url='https://example.com/pan.pdf'
        )
        
        # Verify aadhaar but reject pan
        aadhaar.verify(self.admin_user)
        pan.reject(self.admin_user, 'Invalid document')
        
        # Refresh agent from database
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.kyc_status, 'rejected')

    def test_kyc_pending_when_docs_incomplete(self):
        """Test KYC remains pending when not all documents are verified"""
        # Create only one document
        aadhaar = AgentDocument.objects.create(
            agent=self.agent,
            document_type='aadhaar',
            document_url='https://example.com/aadhaar.pdf'
        )
        aadhaar.verify(self.admin_user)
        
        # Refresh agent from database
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.kyc_status, 'pending')


class AgentAuditLogModelTests(TestCase):
    """Tests for the AgentAuditLog model"""

    def setUp(self):
        """Set up test data"""
        self.agent = Agent.objects.create(
            name='Test Agent',
            phone='9876543250',
            email='auditlog@example.com',
            address='123 Test Street'
        )
        self.admin_user = User.objects.create_user(
            email='auditadmin@example.com',
            password='testpass123',
            name='Audit Admin'
        )

    def test_log_action_creates_entry(self):
        """Test that log_action creates an audit log entry"""
        log = AgentAuditLog.log_action(
            agent=self.agent,
            action='created',
            actor=self.admin_user,
            new_value={'name': 'Test Agent'},
            details='Agent created via admin'
        )
        
        self.assertEqual(log.agent, self.agent)
        self.assertEqual(log.action, 'created')
        self.assertEqual(log.actor, self.admin_user)
        self.assertEqual(log.new_value, {'name': 'Test Agent'})
        self.assertEqual(log.details, 'Agent created via admin')
        self.assertIsNotNone(log.timestamp)

    def test_log_action_without_actor(self):
        """Test that log_action works without an actor (system action)"""
        log = AgentAuditLog.log_action(
            agent=self.agent,
            action='status_changed',
            previous_value={'status': 'onboarding'},
            new_value={'status': 'active'}
        )
        
        self.assertIsNone(log.actor)
        self.assertEqual(log.previous_value, {'status': 'onboarding'})
        self.assertEqual(log.new_value, {'status': 'active'})

    def test_audit_log_ordering(self):
        """Test that audit logs are ordered by timestamp descending"""
        log1 = AgentAuditLog.log_action(
            agent=self.agent,
            action='created'
        )
        log2 = AgentAuditLog.log_action(
            agent=self.agent,
            action='updated'
        )
        
        logs = AgentAuditLog.objects.filter(agent=self.agent)
        self.assertEqual(logs[0], log2)  # Most recent first
        self.assertEqual(logs[1], log1)
