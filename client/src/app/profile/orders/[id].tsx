import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, MapPin, Calendar, Clock, Phone, IndianRupee, Package, CheckCircle, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService, OrderSummary, ProductSummary, AddressSummary } from '../../../api/apiService';
import { useLocalization } from '../../../context/LocalizationContext';
import { RemoteImage } from '../../../components/RemoteImage';

export default function OrderDetails(){
    const router = useRouter();
    const {id} = useLocalSearchParams();
    const { t } = useLocalization();
    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [products , setProducts] = useState<ProductSummary[]>([]);
    const [address, setAddress] = useState<AddressSummary | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract order ID (handle array case from useLocalSearchParams)
    const orderId = Array.isArray(id) ? id[0] : id;

    useEffect(()=>{
        if (orderId) {
            loadDetails();
        } else {
            setError('Invalid order ID');
            setLoading(false);
        }
    },[orderId])

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading order details for ID:', orderId);
      
      const [ordersData, productsData, addressesData] = await Promise.all([
        AuthService.getOrderNos(),
        AuthService.getProducts(),
        AuthService.getAddresses(),
      ]);

      console.log('Orders data:', ordersData);
      console.log('Looking for order with ID:', orderId);

      const foundOrder = ordersData.find(o => o.id.toString() === orderId);
      
      if (!foundOrder) {
        console.log('Order not found. Available order IDs:', ordersData.map(o => o.id));
        setError('Order not found');
        setLoading(false);
        return;
      }

      console.log('Found order:', foundOrder);

      const orderAddress = addressesData.find(a => a.id === foundOrder.address) || null;
      const relatedProducts = productsData.filter(p =>
        foundOrder.orders.some(item => item.product.id === p.id)
      );

      setOrder(foundOrder);
      setProducts(relatedProducts);
      setAddress(orderAddress);
    } catch (error: any) {
      console.error('Error loading order details:', error);
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
    case 'transit':
      return '#8b5cf6';
    case 'completed':
      return '#16a34a';
    case 'cancelled':
      return '#dc2626';
    default:
      return '#6b7280';
    }
  };
  const getStatusText = (status: any): string => {
    const statusName = (
      typeof status === 'string' ? status : status?.name || ''
    ).toLowerCase();
    switch (statusName) {
      case 'pending':
        return 'Pending';
      case 'scheduled':
        return 'Scheduled';
      case 'transit':
        return 'In Transit';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: any) => {
    const statusName = (
      typeof status === 'string' ? status : status?.name || ''
    ).toLowerCase();
    switch (statusName) {
      case 'pending':
        return <Clock size={20} color={getStatusColor(status)} />;
      case 'scheduled':
        return <Calendar size={20} color={getStatusColor(status)} />;
      case 'completed':
        return <CheckCircle size={20} color={getStatusColor(status)} />;
      case 'transit':
        return <CheckCircle size={20} color={getStatusColor(status)} />;
      case 'cancelled':
        return <X size={20} color={getStatusColor(status)} />;
      default:
        return <Package size={20} color={getStatusColor(status)} />;
    }
  };

  const getProductImage = (product: ProductSummary): { uri: string } | ImageSourcePropType => {
    // Priority 1: Use S3 image if available
    if (product.image_url) {
      return { uri: product.image_url };
    }
    
    // Priority 2: Fallback to local assets based on name
    const name = product.name.toLowerCase();
    if (name.includes('newspaper')) return require('../../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
    if (name.includes('cardboard') || name.includes('corrugated')) return require('../../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
    if (name.includes('book') || name.includes('paper')) return require('../../../../assets/images/Scrap_Rates_Photos/Book.jpg');
    if (name.includes('plastic')) return require('../../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
    if (name.includes('iron') || name.includes('steel')) return require('../../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
    if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
    if (name.includes('copper')) return require('../../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
    if (name.includes('brass')) return require('../../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
    if (name.includes('tin')) return require('../../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
    if (name.includes('refrigerator')) return require('../../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
    if (name.includes('battery')) return require('../../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
    if (name.includes('front load machine')) return require('../../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
    if (name.includes('tv') || name.includes('television')) return require('../../../../assets/images/Scrap_Rates_Photos/TV.jpg');
    if (name.includes('laptops')) return require('../../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
    if (name.includes('windowac')) return require('../../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
    if (name.includes('printer')) return require('../../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
    if (name.includes('microwave')) return require('../../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
    if (name.includes('glass')) return require('../../../../assets/images/Scrap_Rates_Photos/glass.jpg');
    
    // Default fallback
    return require('../../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  };

  const getProductImageFallback = (productName: string): ImageSourcePropType => {
    // Get fallback asset based on product name
    const name = productName.toLowerCase();
    if (name.includes('newspaper')) return require('../../../../assets/images/Scrap_Rates_Photos/Newspaper.jpg');
    if (name.includes('cardboard') || name.includes('corrugated')) return require('../../../../assets/images/Scrap_Rates_Photos/Cardboard.jpg');
    if (name.includes('book') || name.includes('paper')) return require('../../../../assets/images/Scrap_Rates_Photos/Book.jpg');
    if (name.includes('plastic')) return require('../../../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
    if (name.includes('iron') || name.includes('steel')) return require('../../../../assets/images/Scrap_Rates_Photos/Iron.jpg');
    if (name.includes('aluminum') || name.includes('aluminium')) return require('../../../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
    if (name.includes('copper')) return require('../../../../assets/images/Scrap_Rates_Photos/Copper.jpg');
    if (name.includes('brass')) return require('../../../../assets/images/Scrap_Rates_Photos/Brass.jpg');
    if (name.includes('tin')) return require('../../../../assets/images/Scrap_Rates_Photos/Tin.jpg');
    if (name.includes('refrigerator')) return require('../../../../assets/images/Scrap_Rates_Photos/fridge.jpg');
    if (name.includes('battery')) return require('../../../../assets/images/Scrap_Rates_Photos/Battery.jpg');
    if (name.includes('front load machine')) return require('../../../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
    if (name.includes('tv') || name.includes('television')) return require('../../../../assets/images/Scrap_Rates_Photos/TV.jpg');
    if (name.includes('laptops')) return require('../../../../assets/images/Scrap_Rates_Photos/Laptops.jpg');
    if (name.includes('windowac')) return require('../../../../assets/images/Scrap_Rates_Photos/WindowAC.jpg');
    if (name.includes('printer')) return require('../../../../assets/images/Scrap_Rates_Photos/Printer.jpg');
    if (name.includes('microwave')) return require('../../../../assets/images/Scrap_Rates_Photos/Microwave.jpg');
    if (name.includes('glass')) return require('../../../../assets/images/Scrap_Rates_Photos/glass.jpg');
    
    // Default fallback
    return require('../../../../assets/images/Scrap_Rates_Photos/Book.jpg');
  };


  const totalAmount = useMemo(() => {
    if (!order || !products.length) return 0;
    
    // Use estimated_order_value from backend if available, otherwise calculate
    if (order.estimated_order_value !== undefined && order.estimated_order_value !== null && order.estimated_order_value > 0) {
      return Number(order.estimated_order_value);
    }
    
    return order.orders.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product.id);
      const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
      const quantity = parseFloat(item.quantity) || 0;
      return sum + (rate * quantity);
    }, 0);
  }, [order, products]);

  // Get referral bonus applied to this order
  const referralBonus = useMemo(() => {
    if (!order) return 0;
    return Number(order.redeemed_referral_bonus) || 0;
  }, [order]);

  // Calculate total payout (estimated value + referral bonus)
  const totalPayoutAmount = useMemo(() => {
    return totalAmount + referralBonus;
  }, [totalAmount, referralBonus]);

   const canCancelOrder = useMemo(() => {
    if (!order) return false;
    const statusName = (typeof order.status === 'string' ? order.status : order.status?.name || '').toLowerCase();
    console.log('Order status for cancel check:', statusName);
    console.log('Raw status object:', order.status);
    // Allow cancellation for pending, scheduled, or unknown status
    const cancellableStatuses = ['transit', 'scheduled'];
    const canCancel = cancellableStatuses.includes(statusName) || statusName === '';
    console.log('Can cancel:', canCancel);
    return canCancel;
  }, [order]);

const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.cancelOrder({ order_number: order?.order_number });
              Toast.show({
                type: 'success',
                text1: t('alerts.titles.success'),
                text2: t('toasts.success.orderCancelled'),
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: t('alerts.titles.error'),
                text2: error.message || t('toasts.error.cancelOrder'),
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
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

if (error || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
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
    );
  }


  return (
<View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.orders.length})</Text>
          <View style={styles.itemsCard}>
            {order.orders.map((item, index) => {
              const product = products.find((p) => p.id === item.product.id);
              const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
              const quantity = parseFloat(item.quantity) || 0;
              const itemTotal = rate * quantity;

              return (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <RemoteImage
                      source={getProductImage(item.product)}
                      fallback={getProductImageFallback(item.product.name)}
                      style={styles.itemIconImage}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      <Text style={styles.itemRate}>
                        ₹{Math.round(rate)}/{item.product.unit}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemQuantity}>
                      {quantity}
                      {item.product.unit}
                    </Text>
                    <Text style={styles.itemTotal}>₹{Math.round(itemTotal)}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Order Value</Text>
              <View style={styles.totalAmount}>
                <IndianRupee size={18} color="#6b7280" />
                <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>
            {referralBonus > 0 && (
              <View style={styles.bonusRow}>
                <Text style={styles.bonusLabel}>Referral Bonus Applied</Text>
                <View style={styles.bonusAmount}>
                  <Text style={styles.bonusPrefix}>+</Text>
                  <IndianRupee size={16} color="#16a34a" />
                  <Text style={styles.bonusValue}>₹{referralBonus.toFixed(2)}</Text>
                </View>
              </View>
            )}
            {referralBonus > 0 && (
              <View style={styles.finalTotalRow}>
                <Text style={styles.finalTotalLabel}>Total Payout</Text>
                <View style={styles.finalTotalAmount}>
                  <IndianRupee size={20} color="#16a34a" />
                  <Text style={styles.finalTotalValue}>₹{totalPayoutAmount.toFixed(2)}</Text>
                </View>
              </View>
            )}
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
                <Text style={styles.detailValue}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Clock size={20} color="#6b7280" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Status Updated</Text>
                <Text style={styles.detailValue}>
                  {formatDate(order.created_at)}
                </Text>
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
                {address.room_number}, {address.street}, {address.area},{' '}
                {address.city}, {address.state} - {address.pincode}
              </Text>
              {address.delivery_suggestion && (
                <View style={styles.notesCard}>
                  <Text style={styles.notesText}>
                    Note: {address.delivery_suggestion}
                  </Text>
                </View>
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
                <Text style={styles.timelineDate}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>
                  {getStatusText(order.status)}
                </Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canCancelOrder && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <X size={20} color="#dc2626" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
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
  itemIconImage: {
    width: 36,
    height: 36,
    marginRight: 12,
    borderRadius: 6,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  bonusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#16a34a',
    fontFamily: 'Inter-Medium',
  },
  bonusAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginRight: 2,
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  finalTotalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: 'Inter-Bold',
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
  notesCard: {
    backgroundColor: '#fef9f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  notesText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    fontStyle: 'italic',
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