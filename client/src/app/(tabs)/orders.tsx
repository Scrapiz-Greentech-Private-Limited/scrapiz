import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useOrdersData} from '../../hooks/useOrderData'
import {useOrderDetails , useFilteredOrders , useOrderTabs} from '../../hooks/userOrderDetails'
import { Clock,ChevronRight, CheckCircle, Truck, Package, MapPin, Calendar, IndianRupee, Phone, MessageCircle, Search, Filter, Eye } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const orders: any[] = [];

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
  const [serverOrders, setServerOrders] = useState<OrderSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const {orders, products, loading, error, refetch} = useOrdersData();
  const orderDataWithDetails = useOrderDetails(orders, products)
  const filteredOrders = useFilteredOrders(orderDataWithDetails, selectedTab)
  const tabs = useOrderTabs(orderDataWithDetails)

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

   useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }


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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
        {filteredOrders.map((order) => {
          const statusConfig = getStatusConfig(order.statusName);
          const StatusIcon = statusConfig.icon;

          return (
            <View key={order.id} style={styles.orderCard}>
              <TouchableOpacity
                style={styles.orderHeader}
                onPress={() => toggleOrderDetails(String(order.id))}
              >
                <View style={styles.orderHeaderLeft}>
                  <View style={[
                    styles.statusIcon,
                    { backgroundColor: statusConfig.bgColor }
                  ]}>
                    <StatusIcon size={20} color={statusConfig.darkColor} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>#{order.order_number}</Text>
                    <Text style={[
                      styles.orderStatus,
                      { color: statusConfig.darkColor }
                    ]}>
                      {order.status?.name || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderHeaderRight}>
                  <Text style={styles.orderAmount}>₹{Math.round(order.totalAmount)}</Text>
                  <ChevronRight 
                    size={16} 
                    color="#6b7280" 
                    style={[
                      styles.chevron,
                      expandedOrder === String(order.id) && styles.chevronExpanded
                    ]} 
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.orderMeta}>
                <View style={styles.orderMetaItem}>
                  <Calendar size={14} color="#6b7280" />
                  <Text style={styles.orderMetaText}>{order.formattedDate}</Text>
                </View>
              </View>

              {expandedOrder === String(order.id) && (
                <View style={styles.orderDetails}>
                  <View style={styles.orderSection}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {order.orders.map((item, index) => {
                      const product = products.find(p => p.id === item.product.id);
                      const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
                      const quantity = parseFloat(item.quantity) || 0;
                      const itemTotal = rate * quantity;

                      return (
                        <View key={index} style={styles.orderItem}>
                          <Text style={styles.itemName}>
                            {item.product.name} ({item.quantity}{product?.unit || 'kg'})
                          </Text>
                          <Text style={styles.itemAmount}>
                            ₹{Math.round(itemTotal)}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={styles.orderItemTotal}>
                      <Text style={styles.itemTotalText}>Total Amount</Text>
                      <Text style={styles.itemTotalAmount}>₹{Math.round(order.totalAmount)}</Text>
                    </View>
                  </View>

                  <View style={styles.orderSection}>
                    <Text style={styles.sectionTitle}>Pickup Address</Text>
                    <View style={styles.addressContainer}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.addressText}>
                        Address ID: {order.address || 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  {order.statusName === 'in_transit' && (
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

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Orders Found</Text>
            <Text style={styles.emptyStateText}>
              {selectedTab === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${selectedTab.replace('_', ' ')} orders at the moment`}
            </Text>
          </View>
        )}
      </ScrollView>
      <Toast />
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