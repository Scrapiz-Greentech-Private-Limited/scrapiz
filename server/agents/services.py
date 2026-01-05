from decimal import Decimal
from typing import Optional, List, Dict, Any
from django.db import transaction
from django.db.models import QuerySet, Q, Avg, Sum, F
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import Agent, AgentDocument, AgentAuditLog


class AgentService:
    """
    Service class for agent business logic operations.
    
    Provides methods for:
    - Agent creation with automatic code generation
    - KYC status derivation based on document verification
    - Capacity management and daily order reset
    - Document verification workflow with audit logging
    - Querying eligible agents for order dispatch
    - Rating calculation and updates
    - Comprehensive audit logging
    """

    # Required document types for KYC verification
    REQUIRED_DOCUMENT_TYPES = ['aadhaar', 'pan', 'driving_license']

    # ==================== Agent Creation ====================

    @classmethod
    @transaction.atomic
    def create_agent(
        cls,
        name: str,
        phone: str,
        email: str,
        address: str,
        actor=None,
        profile_image_url: Optional[str] = None,
        vehicle_number: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        vehicle_registration_url: Optional[str] = None,
        daily_capacity: int = 10,
        service_area_ids: Optional[List[int]] = None,
        service_pincode_ids: Optional[List[int]] = None,
        coverage_location: Optional[str] = None,
    ) -> Agent:
        """
        Create a new agent with automatic code generation.
        
        The agent is created with:
        - Auto-generated unique agent code (AGT-XXXXXX format)
        - Initial status set to 'onboarding'
        - Initial KYC status set to 'pending'
        - Initial availability set to 'offline'
        
        Args:
            name: Agent's full name
            phone: Agent's phone number (must be unique)
            email: Agent's email address (must be unique)
            address: Agent's residential address
            actor: User performing the action (for audit logging)
            profile_image_url: URL to agent's profile image
            vehicle_number: Vehicle registration number
            vehicle_type: Type of vehicle
            vehicle_registration_url: URL to vehicle registration document
            daily_capacity: Maximum orders per day (default: 10)
            service_area_ids: List of ServiceablePincode IDs to assign
            coverage_location: Agent's coverage location/area description
            
        Returns:
            Created Agent instance
            
        Raises:
            ValidationError: If validation fails
            
        """
        # Create agent - agent_code is auto-generated in model's save()
        agent = Agent(
            name=name,
            phone=phone,
            email=email,
            address=address,
            profile_image_url=profile_image_url,
            vehicle_number=vehicle_number,
            vehicle_type=vehicle_type,
            vehicle_registration_url=vehicle_registration_url,
            daily_capacity=daily_capacity,
            coverage_location=coverage_location,
            # Initial status is always 'onboarding' (model default)
            # KYC status is always 'pending' (model default)
            # Availability is always 'offline' (model default)
        )
        
        # Validate and save
        agent.full_clean()
        agent.save()
        
        # Assign service areas if provided
        from serviceability.models import ServiceArea, ServiceablePincode
        if service_area_ids:
            valid_areas = ServiceArea.objects.filter(
              id__in=service_area_ids,
              pincode__city__status='available'
            )
            agent.service_areas.set(valid_areas)

        
        # Log creation
        if service_pincode_ids:
          valid_pincodes = ServiceablePincode.objects.filter(
            id__in=service_pincode_ids,
            city__status='available'
            
          )
          agent.service_pincodes.set(valid_pincodes)
          
        cls.log_agent_action(
            agent=agent,
            action='created',
            actor=actor,
            new_value={
                'name': name,
                'phone': phone,
                'email': email,
                'status': 'onboarding',
                'kyc_status': 'pending',
                'coverage_location': coverage_location,
                'service_areas': list(agent.service_areas.values_list('id', flat=True)),
                'service_pincodes': list(agent.service_pincodes.values_list('id', flat=True)),
            },
            details=f"Agent {agent.agent_code} created"
        )
        
        return agent


    # ==================== KYC Status Derivation ====================

    @classmethod
    def derive_kyc_status(cls, agent: Agent) -> str:
        """
        Derive KYC status based on document verification status.
        
        Logic:
        - If any required document is rejected -> 'rejected'
        - If all required documents are verified -> 'verified'
        - Otherwise -> 'pending'
        
        Args:
            agent: Agent instance to check
            
        Returns:
            Derived KYC status string
            
        Requirements: 2.4, 2.5
        """
        documents = agent.documents.filter(
            document_type__in=cls.REQUIRED_DOCUMENT_TYPES
        )
        
        # Check if any document is rejected
        if documents.filter(verification_status='rejected').exists():
            return 'rejected'
        
        # Check if all required documents are verified
        verified_count = documents.filter(verification_status='verified').count()
        if verified_count == len(cls.REQUIRED_DOCUMENT_TYPES):
            return 'verified'
        
        return 'pending'

    @classmethod
    @transaction.atomic
    def update_kyc_status(cls, agent: Agent, actor=None) -> str:
        """
        Update agent's KYC status based on document verification.
        
        Args:
            agent: Agent instance to update
            actor: User performing the action (for audit logging)
            
        Returns:
            New KYC status
            
        Requirements: 2.4, 2.5
        """
        old_status = agent.kyc_status
        new_status = cls.derive_kyc_status(agent)
        
        if old_status != new_status:
            agent.kyc_status = new_status
            agent.save(update_fields=['kyc_status', 'updated_at'])
            
            # Log KYC status change
            cls.log_agent_action(
                agent=agent,
                action='kyc_updated',
                actor=actor,
                previous_value={'kyc_status': old_status},
                new_value={'kyc_status': new_status},
                details=f"KYC status changed from {old_status} to {new_status}"
            )
        
        return new_status

    # ==================== Capacity Management ====================

    @classmethod
    def reset_daily_orders_if_needed(cls, agent: Agent) -> bool:
        """
        Reset daily order count if it's a new day.
        
        Args:
            agent: Agent instance to check/reset
            
        Returns:
            True if reset was performed, False otherwise
            
        Requirements: 3.4
        """
        today = timezone.now().date()
        
        if agent.last_order_reset and agent.last_order_reset < today:
            agent.current_day_orders = 0
            agent.last_order_reset = today
            agent.save(update_fields=['current_day_orders', 'last_order_reset', 'updated_at'])
            return True
        
        return False

    @classmethod
    @transaction.atomic
    def increment_daily_orders(cls, agent: Agent, actor=None) -> bool:
        """
        Increment agent's daily order count if capacity allows.
        
        Args:
            agent: Agent instance
            actor: User performing the action
            
        Returns:
            True if increment was successful, False if at capacity
            
        Requirements: 3.3
        """
        # First, reset if needed
        cls.reset_daily_orders_if_needed(agent)
        
        # Check capacity
        if agent.current_day_orders >= agent.daily_capacity:
            return False
        
        old_count = agent.current_day_orders
        agent.current_day_orders += 1
        agent.total_orders += 1
        agent.save(update_fields=['current_day_orders', 'total_orders', 'updated_at'])
        
        # Log capacity change
        cls.log_agent_action(
            agent=agent,
            action='capacity_updated',
            actor=actor,
            previous_value={'current_day_orders': old_count},
            new_value={'current_day_orders': agent.current_day_orders},
            details=f"Daily orders incremented to {agent.current_day_orders}/{agent.daily_capacity}"
        )
        
        return True

    @classmethod
    def has_capacity(cls, agent: Agent) -> bool:
        """
        Check if agent has capacity for more orders today.
        
        Args:
            agent: Agent instance to check
            
        Returns:
            True if agent has capacity, False otherwise
            
        Requirements: 3.3, 3.5
        """
        # Reset if needed first
        cls.reset_daily_orders_if_needed(agent)
        return agent.current_day_orders < agent.daily_capacity

    # ==================== Document Verification ====================

    @classmethod
    @transaction.atomic
    def upload_document(
        cls,
        agent: Agent,
        document_type: str,
        document_url: str,
        actor=None
    ) -> AgentDocument:
        """
        Upload a document for an agent.
        
        Args:
            agent: Agent instance
            document_type: Type of document (aadhaar, pan, driving_license)
            document_url: URL to the uploaded document
            actor: User performing the action
            
        Returns:
            Created AgentDocument instance
            
        Raises:
            ValidationError: If document type already exists
            
        Requirements: 2.1
        """
        # Check if document already exists
        if AgentDocument.objects.filter(agent=agent, document_type=document_type).exists():
            raise ValidationError(
                f"A {document_type} document already exists for this agent."
            )
        
        document = AgentDocument.objects.create(
            agent=agent,
            document_type=document_type,
            document_url=document_url,
            verification_status='pending'
        )
        
        # Log document upload
        cls.log_agent_action(
            agent=agent,
            action='document_uploaded',
            actor=actor,
            new_value={
                'document_type': document_type,
                'document_id': document.id,
            },
            details=f"Document {document_type} uploaded"
        )
        
        return document

    @classmethod
    @transaction.atomic
    def verify_document(
        cls,
        document: AgentDocument,
        verified_by,
        rejection_reason: Optional[str] = None
    ) -> AgentDocument:
        """
        Verify a document (mark as verified).
        
        Updates:
        - verification_status to 'verified'
        - verified_at timestamp
        - verified_by user
        - Agent's KYC status (auto-derived)
        
        Args:
            document: AgentDocument instance to verify
            verified_by: User performing the verification
            rejection_reason: Not used for verification, included for API consistency
            
        Returns:
            Updated AgentDocument instance
            
        Requirements: 2.2, 2.3, 2.4
        """
        old_status = document.verification_status
        
        document.verification_status = 'verified'
        document.verified_at = timezone.now()
        document.verified_by = verified_by
        document.rejection_reason = None
        document.save()
        
        # Log document verification
        cls.log_agent_action(
            agent=document.agent,
            action='document_verified',
            actor=verified_by,
            previous_value={
                'document_type': document.document_type,
                'verification_status': old_status,
            },
            new_value={
                'document_type': document.document_type,
                'verification_status': 'verified',
            },
            details=f"Document {document.document_type} verified"
        )
        
        # Update agent's KYC status
        cls.update_kyc_status(document.agent, actor=verified_by)
        
        return document

    @classmethod
    @transaction.atomic
    def reject_document(
        cls,
        document: AgentDocument,
        verified_by,
        rejection_reason: str
    ) -> AgentDocument:
        """
        Reject a document with a reason.
        
        Updates:
        - verification_status to 'rejected'
        - verified_at timestamp
        - verified_by user
        - rejection_reason
        - Agent's KYC status (auto-derived)
        
        Args:
            document: AgentDocument instance to reject
            verified_by: User performing the rejection
            rejection_reason: Reason for rejection (required)
            
        Returns:
            Updated AgentDocument instance
            
        Raises:
            ValidationError: If rejection_reason is empty
            
        Requirements: 2.2, 2.3, 2.5
        """
        if not rejection_reason or not rejection_reason.strip():
            raise ValidationError("Rejection reason is required.")
        
        old_status = document.verification_status
        
        document.verification_status = 'rejected'
        document.verified_at = timezone.now()
        document.verified_by = verified_by
        document.rejection_reason = rejection_reason.strip()
        document.save()
        
        # Log document rejection
        cls.log_agent_action(
            agent=document.agent,
            action='document_rejected',
            actor=verified_by,
            previous_value={
                'document_type': document.document_type,
                'verification_status': old_status,
            },
            new_value={
                'document_type': document.document_type,
                'verification_status': 'rejected',
                'rejection_reason': rejection_reason,
            },
            details=f"Document {document.document_type} rejected: {rejection_reason}"
        )
        
        # Update agent's KYC status
        cls.update_kyc_status(document.agent, actor=verified_by)
        
        return document

    # ==================== Eligible Agents Query ====================

    @classmethod
    def get_eligible_agents(
        cls,
        pincode: Optional[str] = None,
        exclude_at_capacity: bool = True,
        include_onboarding: bool = False,
        include_unassigned: bool = False
    ) -> QuerySet:
        """
        Get agents eligible for order assignment.
        
        Eligibility criteria:
        - status = 'active' (or 'onboarding' if include_onboarding=True)
        - kyc_status != 'rejected'
        - Has at least one service area assigned (unless include_unassigned=True)
        - (Optional) current_day_orders < daily_capacity
        - (Optional) Serves the specified pincode
        
        Args:
            pincode: Filter by service area pincode (optional)
            exclude_at_capacity: Exclude agents at daily capacity (default: True)
            include_onboarding: Include agents with status='onboarding' (default: False)
            include_unassigned: Include agents without any service areas (default: False)
            
        Returns:
            QuerySet of eligible Agent instances
            
        Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
        """
        # Reset daily orders for all agents if needed (batch operation)
        today = timezone.now().date()
        Agent.objects.filter(
            last_order_reset__lt=today
        ).update(
            current_day_orders=0,
            last_order_reset=today
        )
        
        # Base eligibility filter - KYC is optional (only exclude rejected)
        if include_onboarding:
            queryset = Agent.objects.filter(
                status__in=['active', 'onboarding']
            ).exclude(
                kyc_status='rejected'
            )
        else:
            queryset = Agent.objects.filter(
                status='active',
            ).exclude(
                kyc_status='rejected'  # KYC is optional - only exclude rejected
            )
        
        # Filter by service area coverage (unless include_unassigned is True)
        if not include_unassigned:
            queryset = queryset.filter(
                Q(service_areas__isnull=False) |
                Q(service_pincodes__isnull=False)
            ).distinct()
        
        # Filter by capacity if requested
        if exclude_at_capacity:
            queryset = queryset.filter(
                current_day_orders__lt=F('daily_capacity')
            )
        
        # Filter by pincode if provided (only applies to agents with service areas)
        if pincode:
            # When filtering by pincode, include agents assigned to that pincode
            # OR agents with no service areas (they can serve any area)
            queryset = queryset.filter(
                Q(service_areas__pincode__pincode=pincode) |
                Q(service_pincodes__pincode=pincode) |
                (Q(service_areas__isnull=True) & Q(service_pincodes__isnull=True))
            ).distinct()
        
        return queryset.distinct()

    @classmethod
    def is_agent_eligible(cls, agent: Agent, pincode: Optional[str] = None, require_service_area: bool = True) -> bool:
        """
        Check if a specific agent is eligible for order assignment.
        KYC is optional - only rejected KYC status blocks eligibility.
        
        Args:
            agent: Agent instance to check
            pincode: Optional pincode to check service area
            require_service_area: If False, agents without service areas are also eligible (default: True)
            
        Returns:
            True if agent is eligible, False otherwise
            
        Requirements: 4.1, 4.4, 4.5
        """
        # Reset daily orders if needed
        cls.reset_daily_orders_if_needed(agent)
        
        # Check basic eligibility
        if agent.status != 'active':
            return False
        # KYC is optional - only block if explicitly rejected
        if agent.kyc_status == 'rejected':
            return False
        
        # Check service coverage (areas or pincodes) - only if required
        has_service_coverage = agent.service_areas.exists() or agent.service_pincodes.exists()
        if require_service_area and not has_service_coverage:
            return False
            
        if agent.current_day_orders >= agent.daily_capacity:
            return False
        
        # Check pincode if provided
        if pincode:
            # If agent has no service areas, they can serve any pincode
            if not has_service_coverage:
                return True
            
            has_area_coverage = agent.service_areas.filter(
                pincode__pincode=pincode,
                pincode__city__status='available'
            ).exists()
            has_pincode_coverage = agent.service_pincodes.filter(
                pincode=pincode,
                city__status='available'
            ).exists()
            return has_area_coverage or has_pincode_coverage
        
        return True

    # ==================== Rating Updates ====================

    @classmethod
    @transaction.atomic
    def update_rating(
        cls,
        agent: Agent,
        new_rating: float,
        actor=None
    ) -> Decimal:
        """
        Update agent's average rating with a new rating.
        
        Formula: new_avg = ((old_avg * count) + new_rating) / (count + 1)
        
        Args:
            agent: Agent instance to update
            new_rating: New rating value (0-5)
            actor: User performing the action
            
        Returns:
            New average rating
            
        Raises:
            ValidationError: If rating is not between 0 and 5
            
        Requirements: 5.2
        """
        if not 0 <= new_rating <= 5:
            raise ValidationError("Rating must be between 0 and 5")
        
        old_rating = agent.average_rating
        old_count = agent.rating_count
        
        # Calculate new average
        total = (Decimal(str(agent.average_rating)) * agent.rating_count) + Decimal(str(new_rating))
        agent.rating_count += 1
        agent.average_rating = total / agent.rating_count
        
        agent.save(update_fields=['average_rating', 'rating_count', 'updated_at'])
        
        # Log rating update
        cls.log_agent_action(
            agent=agent,
            action='rating_updated',
            actor=actor,
            previous_value={
                'average_rating': str(old_rating),
                'rating_count': old_count,
            },
            new_value={
                'average_rating': str(agent.average_rating),
                'rating_count': agent.rating_count,
                'new_rating': str(new_rating),
            },
            details=f"Rating updated: {new_rating} (new avg: {agent.average_rating})"
        )
        
        return agent.average_rating

    # ==================== Audit Logging ====================

    @classmethod
    def log_agent_action(
        cls,
        agent: Agent,
        action: str,
        actor=None,
        previous_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        details: Optional[str] = None
    ) -> AgentAuditLog:
        """
        Create an audit log entry for an agent action.
        
        Args:
            agent: Agent instance
            action: Action type (from AgentAuditLog.ACTION_CHOICES)
            actor: User who performed the action
            previous_value: Dict of previous values
            new_value: Dict of new values
            details: Additional text details
            
        Returns:
            Created AgentAuditLog instance
            
        Requirements: 7.1, 7.2, 7.3
        """
        return AgentAuditLog.log_action(
            agent=agent,
            action=action,
            actor=actor,
            previous_value=previous_value,
            new_value=new_value,
            details=details
        )

    @classmethod
    @transaction.atomic
    def update_agent_status(
        cls,
        agent: Agent,
        new_status: str,
        actor=None
    ) -> Agent:
        """
        Update agent's operational status with audit logging.
        
        Args:
            agent: Agent instance
            new_status: New status value
            actor: User performing the action
            
        Returns:
            Updated Agent instance
            
        Requirements: 4.2, 7.3
        """
        old_status = agent.status
        
        if old_status != new_status:
            agent.status = new_status
            agent.save(update_fields=['status', 'updated_at'])
            
            cls.log_agent_action(
                agent=agent,
                action='status_changed',
                actor=actor,
                previous_value={'status': old_status},
                new_value={'status': new_status},
                details=f"Status changed from {old_status} to {new_status}"
            )
        
        return agent

    @classmethod
    @transaction.atomic
    def update_agent_availability(
        cls,
        agent: Agent,
        new_availability: str,
        actor=None
    ) -> Agent:
        """
        Update agent's availability status with audit logging.
        
        Args:
            agent: Agent instance
            new_availability: New availability value
            actor: User performing the action
            
        Returns:
            Updated Agent instance
            
        Requirements: 3.1, 7.1
        """
        old_availability = agent.availability
        
        if old_availability != new_availability:
            agent.availability = new_availability
            agent.save(update_fields=['availability', 'updated_at'])
            
            cls.log_agent_action(
                agent=agent,
                action='availability_changed',
                actor=actor,
                previous_value={'availability': old_availability},
                new_value={'availability': new_availability},
                details=f"Availability changed from {old_availability} to {new_availability}"
            )
        
        return agent

    @classmethod
    @transaction.atomic
    def update_service_areas(
        cls,
        agent: Agent,
        service_area_ids: List[int],
        actor=None
    ) -> Agent:
        """
        Update agent's service areas with validation and audit logging.
        
        Only allows assignment of pincodes from cities with status 'available'.
        
        Args:
            agent: Agent instance
            service_area_ids: List of ServiceablePincode IDs
            actor: User performing the action
            
        Returns:
            Updated Agent instance
            
        Requirements: 8.1, 8.4, 7.1
        """
        from serviceability.models import ServiceArea
        
        # Get old service areas for logging
        old_ids = list(agent.service_areas.values_list('id', flat=True))
        
        # Filter to only include pincodes from available cities
        valid_areas = ServiceArea.objects.filter(
            id__in=service_area_ids,
            pincode__city__status='available'
        )
        
        agent.service_areas.set(valid_areas)

        
        cls.log_agent_action(
            agent=agent,
            action='service_area_updated',
            actor=actor,
            previous_value={'service_area_ids': old_ids},
            new_value={'service_area_ids': list(valid_areas.values_list('id', flat=True))},
            details='Service areas updated'
        )
        
        return agent

    # ==================== Statistics ====================
    @classmethod
    @transaction.atomic
    def update_service_pincodes(
      cls,
      agent:Agent,
      service_pincode_ids: List[int],
      actor=None,
      
    )->Agent:
      from serviceability.models import ServiceablePincode
      old_ids = list(agent.service_pincodes.values_list('id', flat=True))
      valid_pincodes = ServiceablePincode.objects.filter(
        id__in=service_pincode_ids,
        city__status='available'
      )
      agent.service_pincodes.set(valid_pincodes)
      cls.log_agent_action(
        agent=agent,
        action='service_pincode_updated',
        actor=actor,
        previous_value={'service_pincode_ids': old_ids},
        new_value={'service_pincode_ids': list(valid_pincodes.values_list('id', flat=True))},
        details='Service pincodes updated'
      )
      return agent  

    @classmethod
    def get_agent_statistics(cls) -> Dict[str, Any]:
        """
        Get aggregate statistics for all agents.
        
        Returns:
            Dict with total, active, inactive, total_orders, average_rating
            
        Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
        """
        total = Agent.objects.count()
        
        # Active = status='active' AND kyc_status='verified'
        active = Agent.objects.filter(
            status='active',
            kyc_status='verified'
        ).count()
        
        # Inactive = not active (includes inactive, suspended, onboarding, or unverified KYC)
        inactive = total - active
        
        # Total orders across all agents
        total_orders = Agent.objects.aggregate(
            total=Sum('completed_orders')
        )['total'] or 0
        
        # Average rating across all agents (only those with ratings)
        avg_rating = Agent.objects.filter(
            rating_count__gt=0
        ).aggregate(
            avg=Avg('average_rating')
        )['avg'] or Decimal('0.00')
        
        return {
            'total': total,
            'active': active,
            'inactive': inactive,
            'total_orders': total_orders,
            'average_rating': round(avg_rating, 2),
        }
