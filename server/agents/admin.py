import csv
from django.contrib import admin
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import format_html
from .models import Agent, AgentDocument, AgentAuditLog


class AgentDocumentInline(admin.TabularInline):
    """Inline admin for managing agent documents"""
    model = AgentDocument
    extra = 0
    readonly_fields = ('uploaded_at', 'verified_at', 'verified_by')
    fields = (
        'document_type',
        'document_url',
        'verification_status',
        'rejection_reason',
        'uploaded_at',
        'verified_at',
        'verified_by'
    )
    
    def has_delete_permission(self, request, obj=None):
        return True


class AgentAuditLogInline(admin.TabularInline):
    """Inline admin for viewing agent audit logs (read-only)"""
    model = AgentAuditLog
    extra = 0
    readonly_fields = ('action', 'actor', 'timestamp', 'previous_value', 'new_value', 'details')
    fields = ('action', 'actor', 'timestamp', 'details')
    ordering = ['-timestamp']
    max_num = 10  # Show only last 10 entries inline
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    """Admin configuration for Agent model"""
    
    # List display configuration (Requirement 10.1)
    list_display = (
        'agent_code',
        'name',
        'phone',
        'status',
        'kyc_status',
        'average_rating',
        'availability',
        'service_area_count',
        'today_orders_display',
        'created_at'
    )
    
    # List filters (Requirement 10.1)
    list_filter = (
        'status',
        'kyc_status',
        'availability',
        'created_at',
    )
    
    # Search fields (Requirement 10.5)
    search_fields = (
        'name',
        'phone',
        'email',
        'agent_code',
    )
    
    # Ordering
    ordering = ['-created_at']
    
    # Read-only fields
    readonly_fields = (
        'agent_code',
        'created_at',
        'updated_at',
        'total_orders',
        'completed_orders',
        'total_weight_collected',
        'average_rating',
        'rating_count',
        'current_day_orders',
        'last_order_reset',
    )
    
    # Fieldsets for organized form layout
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'agent_code',
                'name',
                'phone',
                'email',
                'address',
                'profile_image_url',
            )
        }),
        ('Status', {
            'fields': (
                'status',
                'kyc_status',
                'availability',
            )
        }),
        ('Vehicle Details', {
            'fields': (
                'vehicle_number',
                'vehicle_type',
                'vehicle_registration_url',
            ),
            'classes': ('collapse',),
        }),
        ('Capacity Management', {
            'fields': (
                'daily_capacity',
                'current_day_orders',
                'last_order_reset',
            )
        }),
        ('Performance Metrics', {
            'fields': (
                'total_orders',
                'completed_orders',
                'total_weight_collected',
                'average_rating',
                'rating_count',
            ),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    # Service areas with filter_horizontal (Requirement 10.2)
    filter_horizontal = ('service_areas',)
    
    # Inline models (Requirement 10.2)
    inlines = [AgentDocumentInline, AgentAuditLogInline]
    
    # List per page
    list_per_page = 25
    
    # Date hierarchy for easy navigation
    date_hierarchy = 'created_at'
    
    # Custom display methods
    def service_area_count(self, obj):
        """Display count of service areas"""
        count = obj.service_areas.count()
        return count
    service_area_count.short_description = 'Service Areas'
    service_area_count.admin_order_field = 'service_areas__count'
    
    def today_orders_display(self, obj):
        """Display today's orders with capacity"""
        return f"{obj.current_day_orders}/{obj.daily_capacity}"
    today_orders_display.short_description = "Today's Orders"
    
    # Bulk actions (Requirement 10.3)
    actions = ['activate_agents', 'deactivate_agents', 'suspend_agents', 'export_agents_csv']
    
    @admin.action(description='Activate selected agents')
    def activate_agents(self, request, queryset):
        """Bulk action to activate multiple agents"""
        updated = queryset.update(status='active')
        # Log the action for each agent
        for agent in queryset:
            AgentAuditLog.log_action(
                agent=agent,
                action='status_changed',
                actor=request.user,
                previous_value={'status': agent.status},
                new_value={'status': 'active'},
                details=f'Bulk activated by {request.user.email}'
            )
        self.message_user(request, f'{updated} agent(s) have been activated.')
    
    @admin.action(description='Deactivate selected agents')
    def deactivate_agents(self, request, queryset):
        """Bulk action to deactivate multiple agents"""
        updated = queryset.update(status='inactive')
        # Log the action for each agent
        for agent in queryset:
            AgentAuditLog.log_action(
                agent=agent,
                action='status_changed',
                actor=request.user,
                previous_value={'status': agent.status},
                new_value={'status': 'inactive'},
                details=f'Bulk deactivated by {request.user.email}'
            )
        self.message_user(request, f'{updated} agent(s) have been deactivated.')
    
    @admin.action(description='Suspend selected agents')
    def suspend_agents(self, request, queryset):
        """Bulk action to suspend multiple agents"""
        updated = queryset.update(status='suspended')
        # Log the action for each agent
        for agent in queryset:
            AgentAuditLog.log_action(
                agent=agent,
                action='status_changed',
                actor=request.user,
                previous_value={'status': agent.status},
                new_value={'status': 'suspended'},
                details=f'Bulk suspended by {request.user.email}'
            )
        self.message_user(request, f'{updated} agent(s) have been suspended.')
    
    # CSV Export (Requirement 10.4)
    @admin.action(description='Export selected agents to CSV')
    def export_agents_csv(self, request, queryset):
        """Export selected agents to CSV file"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="agents_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        
        # Write header row
        writer.writerow([
            'Agent Code',
            'Name',
            'Phone',
            'Email',
            'Address',
            'Profile Image URL',
            'Status',
            'KYC Status',
            'Availability',
            'Vehicle Number',
            'Vehicle Type',
            'Daily Capacity',
            'Current Day Orders',
            'Total Orders',
            'Completed Orders',
            'Total Weight Collected (kg)',
            'Average Rating',
            'Rating Count',
            'Service Areas',
            'Created At',
            'Updated At',
        ])
        
        # Write data rows
        for agent in queryset.prefetch_related('service_areas'):
            # Get service areas as comma-separated string
            service_areas = ', '.join([
                f"{sa.pincode} ({sa.area_name})" if sa.area_name else sa.pincode
                for sa in agent.service_areas.all()
            ])
            
            writer.writerow([
                agent.agent_code,
                agent.name,
                agent.phone,
                agent.email,
                agent.address,
                agent.profile_image_url or '',
                agent.get_status_display(),
                agent.get_kyc_status_display(),
                agent.get_availability_display(),
                agent.vehicle_number or '',
                agent.vehicle_type or '',
                agent.daily_capacity,
                agent.current_day_orders,
                agent.total_orders,
                agent.completed_orders,
                agent.total_weight_collected,
                agent.average_rating,
                agent.rating_count,
                service_areas,
                agent.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                agent.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])
        
        self.message_user(request, f'Exported {queryset.count()} agent(s) to CSV.')
        return response
    
    def save_model(self, request, obj, form, change):
        """Override save_model to log changes"""
        if change:
            # Log update action
            AgentAuditLog.log_action(
                agent=obj,
                action='updated',
                actor=request.user,
                details=f'Updated via Django Admin by {request.user.email}'
            )
        super().save_model(request, obj, form, change)
        
        if not change:
            # Log creation action after save (agent now has ID)
            AgentAuditLog.log_action(
                agent=obj,
                action='created',
                actor=request.user,
                details=f'Created via Django Admin by {request.user.email}'
            )


@admin.register(AgentDocument)
class AgentDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for AgentDocument model"""
    
    list_display = (
        'agent',
        'document_type',
        'verification_status',
        'uploaded_at',
        'verified_at',
        'verified_by',
    )
    
    list_filter = (
        'document_type',
        'verification_status',
        'uploaded_at',
    )
    
    search_fields = (
        'agent__name',
        'agent__agent_code',
        'agent__phone',
    )
    
    readonly_fields = (
        'uploaded_at',
        'verified_at',
        'verified_by',
    )
    
    ordering = ['-uploaded_at']
    
    list_per_page = 25
    
    actions = ['verify_documents', 'reject_documents']
    
    @admin.action(description='Verify selected documents')
    def verify_documents(self, request, queryset):
        """Bulk verify documents"""
        for doc in queryset.filter(verification_status='pending'):
            doc.verify(request.user)
        self.message_user(request, f'Verified {queryset.count()} document(s).')
    
    @admin.action(description='Reject selected documents (requires reason)')
    def reject_documents(self, request, queryset):
        """Bulk reject documents - note: this sets a generic reason"""
        for doc in queryset.filter(verification_status='pending'):
            doc.reject(request.user, 'Rejected via bulk action - please contact admin for details')
        self.message_user(request, f'Rejected {queryset.count()} document(s).')


@admin.register(AgentAuditLog)
class AgentAuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AgentAuditLog model (read-only)"""
    
    list_display = (
        'agent',
        'action',
        'actor',
        'timestamp',
        'details_preview',
    )
    
    list_filter = (
        'action',
        'timestamp',
    )
    
    search_fields = (
        'agent__name',
        'agent__agent_code',
        'actor__email',
        'details',
    )
    
    readonly_fields = (
        'agent',
        'action',
        'actor',
        'timestamp',
        'previous_value',
        'new_value',
        'details',
    )
    
    ordering = ['-timestamp']
    
    list_per_page = 50
    
    date_hierarchy = 'timestamp'
    
    def details_preview(self, obj):
        """Show truncated details"""
        if obj.details:
            return obj.details[:50] + '...' if len(obj.details) > 50 else obj.details
        return '-'
    details_preview.short_description = 'Details'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
