import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  Calendar,
  IndianRupee,
  ChevronRight,
  Phone,
  MessageCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const orders = [
  {
    id: 'ORD-2024-001',
    status: 'in_transit',
    statusText: 'Pickup Agent On the Way',
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
  {
    id: 'ORD-2024-004',
    status: 'completed',
    statusText: 'Pickup Completed',
    date: 'Jan 15, 2024',
    completedTime: 'Completed at 3:20 PM',
    amount: 890,
    items: [
      { name: 'Mixed Electronics', quantity: 8, rate: 85 },
      { name: 'Copper Wire', quantity: 3, rate: 120 }
    ],
    address: '321, Tech Park, Hinjewadi, Pune - 411057'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Clock size={20} color="#f59e0b" />;
    case 'in_transit':
      return <Truck size={20} color="#3b82f6" />;
    case 'completed':
      return <CheckCircle size={20} color="#16a34a" />;
    default:
      return <Package size={20} color="#6b7280" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#fef3c7';
    case 'in_transit':
      return '#dbeafe';
    case 'completed':
      return '#dcfce7';
    default:
      return '#f3f4f6';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#f59e0b';
    case 'in_transit':
      return '#3b82f6';
    case 'completed':
      return '#16a34a';
    default:
      return '#6b7280';
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
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'scheduled', label: 'Scheduled', count: orders.filter(o => o.status === 'scheduled').length },
    { id: 'in_transit', label: 'In Transit', count: orders.filter(o => o.status === 'in_transit').length },
    { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length }
  ];

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        
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
        {filterOrders(selectedTab).map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <TouchableOpacity
              style={styles.orderHeader}
              onPress={() => toggleOrderDetails(order.id)}
            >
              <View style={styles.orderHeaderLeft}>
                <View style={[
                  styles.statusIcon,
                  { backgroundColor: getStatusColor(order.status) }
                ]}>
                  {getStatusIcon(order.status)}
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={[
                    styles.orderStatus,
                    { color: getStatusTextColor(order.status) }
                  ]}>
                    {order.statusText}
                  </Text>
                </View>
              </View>
              <View style={styles.orderHeaderRight}>
                <Text style={styles.orderAmount}>₹{order.amount}</Text>
                <ChevronRight 
                  size={16} 
                  color="#6b7280" 
                  style={[
                    styles.chevron,
                    expandedOrder === order.id && styles.chevronExpanded
                  ]} 
                />
              </View>
            </TouchableOpacity>

            <View style={styles.orderMeta}>
              <View style={styles.orderMetaItem}>
                <Calendar size={14} color="#6b7280" />
                <Text style={styles.orderMetaText}>{order.date}</Text>
              </View>
              {order.expectedTime && (
                <View style={styles.orderMetaItem}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.orderMetaText}>{order.expectedTime}</Text>
                </View>
              )}
              {order.completedTime && (
                <View style={styles.orderMetaItem}>
                  <CheckCircle size={14} color="#16a34a" />
                  <Text style={styles.orderMetaText}>{order.completedTime}</Text>
                </View>
              )}
            </View>

            {expandedOrder === order.id && (
              <View style={styles.orderDetails}>
                <View style={styles.orderSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.itemName}>
                        {item.name} ({item.quantity}kg)
                      </Text>
                      <Text style={styles.itemAmount}>
                        ₹{item.rate * item.quantity}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.orderItemTotal}>
                    <Text style={styles.itemTotalText}>Total Amount</Text>
                    <Text style={styles.itemTotalAmount}>₹{order.amount}</Text>
                  </View>
                </View>

                <View style={styles.orderSection}>
                  <Text style={styles.sectionTitle}>Pickup Address</Text>
                  <View style={styles.addressContainer}>
                    <MapPin size={16} color="#6b7280" />
                    <Text style={styles.addressText}>{order.address}</Text>
                  </View>
                </View>

                {order.agent && (
                  <View style={styles.orderSection}>
                    <Text style={styles.sectionTitle}>Pickup Agent</Text>
                    <View style={styles.agentContainer}>
                      <View style={styles.agentInfo}>
                        <Text style={styles.agentName}>{order.agent.name}</Text>
                        <Text style={styles.agentVehicle}>Vehicle: {order.agent.vehicle}</Text>
                      </View>
                      <View style={styles.agentActions}>
                        <TouchableOpacity style={styles.agentActionButton}>
                          <Phone size={18} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.agentActionButton}>
                          <MessageCircle size={18} color="#16a34a" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {order.status === 'in_transit' && (
                  <TouchableOpacity style={styles.trackButton}>
                    <Truck size={20} color="white" />
                    <Text style={styles.trackButtonText}>Track Live Location</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        {filterOrders(selectedTab).length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Orders Found</Text>
            <Text style={styles.emptyStateText}>
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
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },
  tabsContainer: {
    marginHorizontal: -8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Inter-SemiBold',
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
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  orderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderMetaText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    padding: 16,
  },
  orderSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  orderItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  itemTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  agentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  agentActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 200,
  },
});