import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { ArrowLeft, MapPin, Calendar, Clock, Phone, IndianRupee, Package, CheckCircle, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService, OrderSummary, ProductSummary, AddressSummary } from '../../../api/apiService';


export default function OrderDetails(){
    const router = useRouter();
    const {id} = useLocalSearchParams();
    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [products , setProducts] = useState<ProductSummary[]>([]);
    const [address, setAddress] = useState<AddressSummary | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        loadDetails();
    },[])

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, productsData, addressesData] = await Promise.all([
        AuthService.getOrderNos(),
        AuthService.getProducts(),
        AuthService.getAddresses(),
      ]);

      const foundOrder = ordersData.find(o => o.id.toString() === id);
      if (!foundOrder) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      const orderAddress = addressesData.find(a => a.id === foundOrder.address) || null;
      const relatedProducts = productsData.filter(p =>
        foundOrder.orders.some(item => item.product.id === p.id)
      );

      setOrder(foundOrder);
      setProducts(relatedProducts);
      setAddress(orderAddress);
    } catch (error) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: any) => {
    const statusName = (typeof status === 'string' ? status : status?.name || '').toLowerCase();
    switch (statusName) {
    case 'pending':
      return '#f59e0b';
    case 'scheduled':
      return '#3b82f6';
    case 'in_transit':
      return '#8b5cf6';
    case 'completed':
      return '#16a34a';
    case 'delivered':
      return '#16a34a';
    case 'cancelled':
      return '#dc2626';
    default:
      return '#6b7280';
    }
  };
  const getStatusText = (status: any): string => {
    const statusName = (typeof status === 'string' ? status : status?.name || '').toLowerCase();
    switch (statusName) {
      case 'pending': return 'Pending';
      case 'scheduled': return 'Scheduled';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: any) => {
    const statusName = (typeof status === 'string' ? status : status?.name || '').toLowerCase();
    switch (statusName) {
      case 'pending': return <Clock size={20} color={getStatusColor(status)} />;
      case 'scheduled': return <Calendar size={20} color={getStatusColor(status)} />;
      case 'completed': return <CheckCircle size={20} color={getStatusColor(status)} />;
      case 'delivered': return <CheckCircle size={20} color={getStatusColor(status)} />;
      case 'cancelled': return <X size={20} color={getStatusColor(status)} />;
      default: return <Package size={20} color={getStatusColor(status)} />;
    }
  };

  const totalAmount = useMemo(() => {
    if (!order || !products.length) return 0;
    
    return order.orders.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product.id);
      const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
      const quantity = parseFloat(item.quantity) || 0;
      return sum + (rate * quantity);
    }, 0);
  }, [order, products]);

   const canCancelOrder = useMemo(() => {
    if (!order) return false;
    const statusName = (typeof order.status === 'string' ? order.status : order.status?.name || '').toLowerCase();
    return statusName === 'pending' || statusName === 'scheduled';
  }, [order]);

  const handleCancelOrder =() =>{
    Alert.alert(
        'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await AuthService.cancelOrder({ order_number: order?.order_number });
              Alert.alert('Success', 'Order cancelled successfully');
             router.back();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProductEmoji = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('paper') || name.includes('cardboard')) return '📦';
    if (name.includes('plastic')) return '🧴';
    if (name.includes('metal') || name.includes('iron') || name.includes('steel')) return '🔩';
    if (name.includes('electronic') || name.includes('e-waste')) return '💻';
    if (name.includes('glass')) return '🪟';
    return '♻️';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }
if(error || !order){
  return(
    <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
  )
}

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>#{order.order_number}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(order.status)}
            <Text style={styles.statusTitle}>Order Status</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.orders.length})</Text>
          <View style={styles.itemsCard}>
            {order.orders.map((item, index) => {
              const product = products.find(p => p.id === item.product.id);
              const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
              const quantity = parseFloat(item.quantity) || 0;
              const itemTotal = rate * quantity;

              return (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemIcon}>{getProductEmoji(item.product.name)}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      <Text style={styles.itemRate}>₹{Math.round(rate)}/{item.product.unit}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemQuantity}>{quantity}{item.product.unit}</Text>
                    <Text style={styles.itemTotal}>₹{Math.round(itemTotal)}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <View style={styles.totalAmount}>
                <IndianRupee size={18} color="#16a34a" />
                <Text style={styles.totalValue}>₹{Math.round(totalAmount)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pickup Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Calendar size={20} color="#6b7280" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Order Date</Text>
                <Text style={styles.detailValue}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Clock size={20} color="#6b7280" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Status Updated</Text>
                <Text style={styles.detailValue}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address Details */}
        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <MapPin size={20} color="#111827" />
                <Text style={styles.addressTitle}>{address.name}</Text>
              </View>
              <Text style={styles.addressText}>
                {address.room_number}, {address.street}, {address.area}, {address.city}, {address.state} - {address.pincode}
              </Text>
              {address.delivery_suggestion && (
                <Text style={styles.addressNote}>Note: {address.delivery_suggestion}</Text>
              )}
              <View style={styles.addressContactRow}>
                <Phone size={16} color="#6b7280" />
                <Text style={styles.addressContact}>{address.phone_number}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#16a34a' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineDate}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: getStatusColor(order.status) }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{getStatusText(order.status)}</Text>
                <Text style={styles.timelineDate}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canCancelOrder && (
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
              <X size={20} color="#dc2626" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  itemRate: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  addressNote: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addressContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addressContact: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  actionsSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dc2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});