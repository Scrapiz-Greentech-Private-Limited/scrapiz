from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.utils import timezone

from .models import Agent, AgentDocument, AgentAuditLog


# Store original values for comparison
_agent_original_values = {}


@receiver(pre_save, sender=Agent)
def agent_pre_save(sender, instance, **kwargs):
    """
    Capture original agent values before save for comparison.
    """
    if instance.pk:
        try:
            original = Agent.objects.get(pk=instance.pk)
            _agent_original_values[instance.pk] = {
                'status': original.status,
                'kyc_status': original.kyc_status,
                'availability': original.availability,
                'daily_capacity': original.daily_capacity,
                'name': original.name,
                'phone': original.phone,
                'email': original.email,
                'address': original.address,
                'vehicle_number': original.vehicle_number,
                'vehicle_type': original.vehicle_type,
            }
        except Agent.DoesNotExist:
            pass


@receiver(post_save, sender=Agent)
def agent_post_save(sender, instance, created, **kwargs):
    """
    Log agent creation and updates.
    Note: This signal provides automatic logging for direct model saves.
    For more detailed logging with actor information, use AgentService methods.
    """
    if created:
        # Log creation (only if not already logged by AgentService)
        # Check if a 'created' log already exists for this agent in the last second
        recent_log = AgentAuditLog.objects.filter(
            agent=instance,
            action='created',
            timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
        ).exists()
        
        if not recent_log:
            AgentAuditLog.log_action(
                agent=instance,
                action='created',
                new_value={
                    'agent_code': instance.agent_code,
                    'name': instance.name,
                    'phone': instance.phone,
                    'email': instance.email,
                    'status': instance.status,
                    'kyc_status': instance.kyc_status,
                },
                details=f"Agent {instance.agent_code} created"
            )
    else:
        # Check for specific field changes
        original = _agent_original_values.get(instance.pk, {})
        
        if original:
            # Log status change
            if original.get('status') != instance.status:
                # Check if already logged recently
                recent_log = AgentAuditLog.objects.filter(
                    agent=instance,
                    action='status_changed',
                    timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
                ).exists()
                
                if not recent_log:
                    AgentAuditLog.log_action(
                        agent=instance,
                        action='status_changed',
                        previous_value={'status': original.get('status')},
                        new_value={'status': instance.status},
                        details=f"Status changed from {original.get('status')} to {instance.status}"
                    )
            
            # Log KYC status change
            if original.get('kyc_status') != instance.kyc_status:
                recent_log = AgentAuditLog.objects.filter(
                    agent=instance,
                    action='kyc_updated',
                    timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
                ).exists()
                
                if not recent_log:
                    AgentAuditLog.log_action(
                        agent=instance,
                        action='kyc_updated',
                        previous_value={'kyc_status': original.get('kyc_status')},
                        new_value={'kyc_status': instance.kyc_status},
                        details=f"KYC status changed from {original.get('kyc_status')} to {instance.kyc_status}"
                    )
            
            # Log availability change
            if original.get('availability') != instance.availability:
                recent_log = AgentAuditLog.objects.filter(
                    agent=instance,
                    action='availability_changed',
                    timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
                ).exists()
                
                if not recent_log:
                    AgentAuditLog.log_action(
                        agent=instance,
                        action='availability_changed',
                        previous_value={'availability': original.get('availability')},
                        new_value={'availability': instance.availability},
                        details=f"Availability changed from {original.get('availability')} to {instance.availability}"
                    )
            
            # Log capacity change
            if original.get('daily_capacity') != instance.daily_capacity:
                recent_log = AgentAuditLog.objects.filter(
                    agent=instance,
                    action='capacity_updated',
                    timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
                ).exists()
                
                if not recent_log:
                    AgentAuditLog.log_action(
                        agent=instance,
                        action='capacity_updated',
                        previous_value={'daily_capacity': original.get('daily_capacity')},
                        new_value={'daily_capacity': instance.daily_capacity},
                        details=f"Daily capacity changed from {original.get('daily_capacity')} to {instance.daily_capacity}"
                    )
            
            # Log general updates (for other field changes)
            changed_fields = []
            for field in ['name', 'phone', 'email', 'address', 'vehicle_number', 'vehicle_type']:
                if original.get(field) != getattr(instance, field):
                    changed_fields.append(field)
            
            if changed_fields:
                recent_log = AgentAuditLog.objects.filter(
                    agent=instance,
                    action='updated',
                    timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
                ).exists()
                
                if not recent_log:
                    AgentAuditLog.log_action(
                        agent=instance,
                        action='updated',
                        previous_value={f: original.get(f) for f in changed_fields},
                        new_value={f: getattr(instance, f) for f in changed_fields},
                        details=f"Updated fields: {', '.join(changed_fields)}"
                    )
        
        # Clean up stored values
        if instance.pk in _agent_original_values:
            del _agent_original_values[instance.pk]


@receiver(m2m_changed, sender=Agent.service_areas.through)
def agent_service_areas_changed(sender, instance, action, pk_set, **kwargs):
    """
    Log service area changes.
    """
    if action in ['post_add', 'post_remove', 'post_clear']:
        # Check if already logged recently
        recent_log = AgentAuditLog.objects.filter(
            agent=instance,
            action='service_area_updated',
            timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
        ).exists()
        
        if not recent_log:
            current_areas = list(instance.service_areas.values_list('id', flat=True))
            
            if action == 'post_add':
                details = f"Service areas added: {pk_set}"
            elif action == 'post_remove':
                details = f"Service areas removed: {pk_set}"
            else:
                details = "Service areas cleared"
            
            AgentAuditLog.log_action(
                agent=instance,
                action='service_area_updated',
                new_value={'service_areas': current_areas},
                details=details
            )


@receiver(post_save, sender=AgentDocument)
def agent_document_post_save(sender, instance, created, **kwargs):
    """
    Log document uploads and verification status changes.
    """
    if created:
        # Check if already logged recently
        recent_log = AgentAuditLog.objects.filter(
            agent=instance.agent,
            action='document_uploaded',
            timestamp__gte=timezone.now() - timezone.timedelta(seconds=1)
        ).exists()
        
        if not recent_log:
            AgentAuditLog.log_action(
                agent=instance.agent,
                action='document_uploaded',
                new_value={
                    'document_type': instance.document_type,
                    'document_id': instance.id,
                },
                details=f"Document {instance.document_type} uploaded"
            )
