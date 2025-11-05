import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  X, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  User, 
  Phone,
  AlertCircle 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useOrdersData } from '../../../hooks/useOrderData';
import { useOrderDetails, useFilteredOrders, useOrderTabs } from '../../../hooks/userOrderDetails';
import { OrderSummary } from '../../../api/apiService';

interface HeaderComponentProps {
  onBackPress: () => void;
  orderCount: number;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ onBackPress, orderCount }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <ArrowLeft size={24} color="#111827" />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>My Orders</Text>
      <Text style={styles.headerSubtitle}>{orderCount} orders</Text>
    </View>
  </View>
);


export default function OrdersScreen(){
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { orders, products, loading, error, refetch } = useOrdersData();
  const ordersWithDetails = useOrderDetails(orders, products);
  const tabs = useOrderTabs(ordersWithDetails);
  const filteredOrders = useFilteredOrders(ordersWithDetails, selectedFilter);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/profile/orders/${orderId}` as any);
  };

  const getStatusColor = (statusName: string): string => {
    switch (statusName) {
      case 'pending': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'transit': return '#8b5cf6';
      case 'completed': return '#16a34a';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (statusName: string): string => {
    switch (statusName) {
      case 'pending': return 'Pending';
      case 'scheduled': return 'Scheduled';
      case 'transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (statusName: string) => {
    switch (statusName) {
      case 'pending': return <Clock size={16} color={getStatusColor(statusName)} />;
      case 'scheduled': return <Calendar size={16} color={getStatusColor(statusName)} />;
      case 'transit': return <Package size={16} color={getStatusColor(statusName)} />;
      case 'completed': return <CheckCircle size={16} color={getStatusColor(statusName)} />;
      case 'cancelled': return <X size={16} color={getStatusColor(statusName)} />;
      default: return <Package size={16} color={getStatusColor(statusName)} />;
    }
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <HeaderComponent 
          onBackPress={() => router.back()} 
          orderCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <View style={styles.container}>
        <HeaderComponent 
          onBackPress={() => router.back()} 
          orderCount={0}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>Failed to Load Orders</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
return (
    <View style={styles.container}>
      <HeaderComponent 
        onBackPress={() => router.back()} 
        orderCount={orders.length}
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                selectedFilter === tab.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(tab.id)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === tab.id && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedFilter === tab.id && styles.filterCountActive
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === tab.id && styles.filterCountTextActive
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleOrderPress(order.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderDate}>{order.formattedDate}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(order.statusName) + '20' }
                ]}>
                  {getStatusIcon(order.statusName)}
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(order.statusName) }
                  ]}>
                    {getStatusText(order.statusName)}
                  </Text>
                </View>
              </View>
              
              {/* Order Items */}
              <View style={styles.orderItems}>
                {order.orders.slice(0, 3).map((item, index) => (
                  <View key={item.id} style={styles.orderItem}>
                    <Package size={20} color="#16a34a" style={styles.orderItemIcon} />
                    <Text style={styles.orderItemName}>{item.product.name}</Text>
                    <Text style={styles.orderItemQuantity}>
                      {parseFloat(item.quantity).toFixed(2)}{item.product.unit}
                    </Text>
                    <Text style={styles.orderItemRate}>
                      ₹{Math.round((item.product.max_rate + item.product.min_rate) / 2)}/{item.product.unit}
                    </Text>
                  </View>
                ))}
                {order.orders.length > 3 && (
                  <Text style={styles.moreItemsText}>
                    +{order.orders.length - 3} more items
                  </Text>
                )}
              </View>
              
              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.orderTotal}>
                  <IndianRupee size={16} color="#16a34a" />
                  <Text style={styles.orderTotalAmount}>₹{Math.round(order.totalAmount)}</Text>
                </View>
                <View style={styles.orderAddress}>
                  <MapPin size={12} color="#6b7280" />
                  <Text style={styles.orderAddressText}>
                    {order.address ? `Address #${order.address}` : 'No address'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${getStatusText(selectedFilter)} orders found`
              }
            </Text>
            {selectedFilter !== 'all' && (
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={styles.clearFilterText}>View All Orders</Text>
              </TouchableOpacity>
            )}
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: '#16a34a',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 6,
  },
  filterTabTextActive: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  filterCountTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemIcon: {
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  orderItemRate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 28,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  orderAddress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderAddressText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFilterButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
