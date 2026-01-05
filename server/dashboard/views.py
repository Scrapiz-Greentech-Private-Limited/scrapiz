"""
Dashboard Statistics API Views.

Provides aggregated statistics for the admin dashboard including:
- Order metrics (total, completed, pending, revenue)
- User metrics (total customers)
- Agent metrics (active agents)
- Service booking metrics
- Category performance
- Top performing agents
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import Coalesce
from decimal import Decimal

from utils.usercheck import authenticate_request
from inventory.models import OrderNo, Order, Category, Product, Status
from services.models import ServiceBooking
from authentication.models import User
from agents.models import Agent


class DashboardStatsAPIView(APIView):
    """
    Admin endpoint to get aggregated dashboard statistics.
    
    GET /api/dashboard/stats/
    
    Returns comprehensive dashboard metrics including:
    - Revenue (from completed orders only)
    - Order counts (total, completed, pending)
    - Total weight collected
    - Active agents count
    - Average order value
    - Total customers
    - Total referrals
    - Category performance breakdown
    - Service bookings by type
    - Top performing agents
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            stats = self._get_dashboard_stats()
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch dashboard stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_dashboard_stats(self):
        """Aggregate all dashboard statistics."""
        
        # Get completed status
        completed_status = Status.objects.filter(name__iexact='completed').first()
        pending_status = Status.objects.filter(name__iexact='pending').first()
        scheduled_status = Status.objects.filter(name__iexact='scheduled').first()
        
        # Order statistics
        all_orders = OrderNo.objects.all()
        total_orders = all_orders.count()
        
        # Completed orders (for revenue calculation)
        completed_orders_qs = all_orders.filter(status=completed_status) if completed_status else all_orders.none()
        completed_orders_count = completed_orders_qs.count()
        
        # Pending orders (pending + scheduled)
        pending_filter = Q()
        if pending_status:
            pending_filter |= Q(status=pending_status)
        if scheduled_status:
            pending_filter |= Q(status=scheduled_status)
        pending_orders_count = all_orders.filter(pending_filter).count() if pending_filter else 0
        
        # Revenue from completed orders only
        total_revenue = completed_orders_qs.aggregate(
            total=Coalesce(Sum('estimated_order_value'), Decimal('0.00'))
        )['total']
        
        # Total weight from all orders (sum of quantity * assuming weight per unit)
        # Since we don't have final_weight in OrderNo, we'll calculate from Order items
        total_weight = Order.objects.filter(
            order_no__status=completed_status
        ).aggregate(
            total=Coalesce(Sum('quantity'), Decimal('0.00'))
        )['total'] if completed_status else Decimal('0.00')
        
        # Average order value (from completed orders)
        avg_order_value = Decimal('0.00')
        if completed_orders_count > 0:
            avg_order_value = total_revenue / completed_orders_count
        
        # User statistics
        total_customers = User.objects.filter(
            is_deleted=False,
            is_staff=False,
            is_superuser=False
        ).count()
        
        # Referral statistics
        total_referrals = User.objects.filter(
            referred_by__isnull=False,
            is_deleted=False
        ).count()
        
        completed_referrals = User.objects.filter(
            referred_by__isnull=False,
            has_completed_first_order=True,
            is_deleted=False
        ).count()
        
        # Agent statistics
        active_agents = Agent.objects.filter(
            status='active',
            kyc_status='verified'
        ).count()
        
        total_agents = Agent.objects.count()
        
        # Service booking statistics
        service_bookings = ServiceBooking.objects.all()
        total_service_bookings = service_bookings.count()
        
        service_revenue = service_bookings.filter(
            status='completed'
        ).count() * Decimal('500.00')  # Placeholder - adjust based on actual pricing
        
        # Service bookings by type
        service_stats = list(service_bookings.values('service').annotate(
            count=Count('id')
        ).order_by('-count'))
        
        # Category performance
        category_performance = self._get_category_performance(completed_status)
        
        # Top performing agents
        top_agents = self._get_top_agents()
        
        return {
            # Main KPIs
            "total_revenue": str(total_revenue),
            "service_revenue": str(service_revenue),
            "combined_revenue": str(total_revenue + service_revenue),
            "total_orders": total_orders,
            "completed_orders": completed_orders_count,
            "pending_orders": pending_orders_count,
            "total_weight": str(total_weight),
            "avg_order_value": str(avg_order_value.quantize(Decimal('0.01'))),
            
            # User metrics
            "total_customers": total_customers,
            "total_referrals": total_referrals,
            "completed_referrals": completed_referrals,
            
            # Agent metrics
            "active_agents": active_agents,
            "total_agents": total_agents,
            
            # Service metrics
            "total_service_bookings": total_service_bookings,
            "service_stats": service_stats,
            
            # Performance data
            "category_performance": category_performance,
            "top_agents": top_agents,
        }
    
    def _get_category_performance(self, completed_status):
        """Get performance metrics by category."""
        categories = Category.objects.all()
        performance = []
        
        for category in categories:
            # Get products in this category
            products = Product.objects.filter(category=category)
            product_ids = products.values_list('id', flat=True)
            
            # Get orders for these products
            if completed_status:
                orders = Order.objects.filter(
                    product_id__in=product_ids,
                    order_no__status=completed_status
                )
            else:
                orders = Order.objects.filter(product_id__in=product_ids)
            
            order_count = orders.count()
            total_quantity = orders.aggregate(
                total=Coalesce(Sum('quantity'), Decimal('0.00'))
            )['total']
            
            # Estimate revenue based on product rates
            estimated_revenue = Decimal('0.00')
            for order in orders:
                if order.product.max_rate and order.quantity:
                    estimated_revenue += Decimal(str(order.product.max_rate)) * order.quantity
            
            performance.append({
                "category": category.name or "Unknown",
                "category_id": category.id,
                "orders": order_count,
                "quantity": str(total_quantity),
                "revenue": str(estimated_revenue),
            })
        
        # Sort by orders descending
        performance.sort(key=lambda x: x['orders'], reverse=True)
        return performance
    
    def _get_top_agents(self, limit=5):
        """Get top performing agents by completed orders."""
        agents = Agent.objects.filter(
            status='active'
        ).order_by('-total_orders')[:limit]
        
        return [
            {
                "id": agent.id,
                "name": agent.name,
                "agent_code": agent.agent_code,
                "total_orders": agent.total_orders,
                "average_rating": str(agent.average_rating),
                "availability": agent.availability,
            }
            for agent in agents
        ]
