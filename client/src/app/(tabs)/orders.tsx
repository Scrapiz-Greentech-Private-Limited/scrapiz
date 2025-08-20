import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  Calendar,
  IndianRupee,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Eye,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const orders = [
  {
    id: 'ORD-2024-001',
    status: 'in_transit',
    statusText: 'Agent En Route',
    date: 'Today, 2:30 PM',
    expectedTime: '3:00 PM - 5:00 PM',
    amount: 480,
    items: [
      { name: 'Paper & Cardboard', quantity: 15, rate: 12 },
      { name: 'Plastic Bottles', quantity: 8, rate: 18 },
      { name: 'Metal Scrap', quantity: 5, rate: 45 }
    ],
    agent: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      vehicle: 'MH 12 AB 1234'
    },
    address: '123, Green Valley Apartment, Sector 21, Pune - 411001'
  },
  {
    id: 'ORD-2024-002',
    status: 'completed',
    statusText: 'Pickup Completed',
    date: 'Yesterday, 4:15 PM',
    completedTime: 'Completed at 4:45 PM',
    amount: 650,
    items: [
      { name: 'Electronics', quantity: 6, rate: 85 },
      { name: 'Metal Parts', quantity: 4, rate: 45 }
    ],
    address: '456, Sunrise Heights, Baner, Pune - 411045'
  },
  {
    id: 'ORD-2024-003',
    status: 'scheduled',
    statusText: 'Pickup Scheduled',
    date: 'Tomorrow, 10:00 AM',
    expectedTime: '10:00 AM - 12:00 PM',
    amount: 320,
    items: [
      { name: 'Paper Documents', quantity: 20, rate: 12 },
      { name: 'Glass Bottles', quantity: 10, rate: 8 }
    ],
    address: '789, City Center Mall, FC Road, Pune - 411005'
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'scheduled':
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: Clock,
        darkColor: '#d97706'
      };
    case 'in_transit':
      return {
        color: '#3b82f6',
        bgColor: '#dbeafe',
        icon: Truck,
        darkColor: '#2563eb'
      };
    case 'completed':
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: CheckCircle,
        darkColor: '#059669'
      };
    default:
      return {
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: Package,
        darkColor: '#4b5563'
      };
  }
};

export default function OrdersScreen() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filterOrders = (status?: string) => {
    if (status === 'all' || !status) return orders;
    return orders.filter(order => order.status === status);
  };

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'scheduled', label: 'Scheduled', count: orders.filter(o => o.status === 'scheduled').length },
    { id: 'in_transit', label: 'In Transit', count: orders.filter(o => o.status === 'in_transit').length },
    { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length }
  ];

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f2937" barStyle="light-content" />
      
      {/* Dark Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track your scrap pickups</Text>
        
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#9ca3af" />
            <Text style={styles.searchPlaceholder}>Search orders...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>
        
        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.tabActive
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  selectedTab === tab.id && styles.tabBadgeActive
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    selectedTab === tab.id && styles.tabBadgeTextActive
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filterOrders(selectedTab).map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bgColor }]}>
                  <StatusIcon size={16} color={statusConfig.darkColor} />
                  <Text style={[styles.statusText, { color: statusConfig.darkColor }]}>
                    {order.statusText}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => toggleOrderDetails(order.id)}
                >
                  <Eye size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {/* Order Info */}
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>{order.id}</Text>
                <View style={styles.orderMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.metaText}>{order.date}</Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <IndianRupee size={16} color="#10b981" />
                    <Text style={styles.orderAmount}>{order.amount}</Text>
                  </View>
                </View>
              </View>
              
              {/* Items Preview */}
              <View style={styles.itemsPreview}>
                <Text style={styles.itemsCount}>
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.itemsList}>
                  {order.items.map(item => item.name).join(', ')}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: order.status === 'completed' ? '100%' : 
                              order.status === 'in_transit' ? '60%' : '30%',
                        backgroundColor: statusConfig.color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {order.status === 'completed' ? 'Completed' : 
                   order.status === 'in_transit' ? 'In Progress' : 'Scheduled'}
                </Text>
              </View>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  
                  {/* Items Detail */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>Items Breakdown</Text>
                    {order.items.map((item, index) => (
                      <View key={index} style={styles.itemDetail}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemQuantity}>{item.quantity}kg @ ₹{item.rate}/kg</Text>
                        </View>
                        <Text style={styles.itemTotal}>₹{item.rate * item.quantity}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Address */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>Pickup Address</Text>
                    <View style={styles.addressRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.addressText}>{order.address}</Text>
                    </View>
                  </View>
                  
                  {/* Agent Details */}
                  {order.agent && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Pickup Agent</Text>
                      <View style={styles.agentCard}>
                        <View style={styles.agentInfo}>
                          <Text style={styles.agentName}>{order.agent.name}</Text>
                          <Text style={styles.agentVehicle}>Vehicle: {order.agent.vehicle}</Text>
                        </View>
                        <View style={styles.agentActions}>
                          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#dbeafe' }]}>
                            <Phone size={18} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d1fae5' }]}>
                            <MessageCircle size={18} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Action Button */}
                  {order.status === 'in_transit' && (
                    <TouchableOpacity style={styles.trackButton}>
                      <Truck size={20} color="white" />
                      <Text style={styles.trackButtonText}>Track Live Location</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {filterOrders(selectedTab).length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${selectedTab} orders at the moment`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1f2937',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    marginHorizontal: -8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: '#374151',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    fontFamily: 'Inter-SemiBold',
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#4b5563',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d1d5db',
    fontFamily: 'Inter-Bold',
  },
  tabBadgeTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Inter-Bold',
  },
  itemsPreview: {
    marginBottom: 16,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  itemsList: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Inter-Bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 20,
  },
  agentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  agentVehicle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  agentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 200,
  },
});