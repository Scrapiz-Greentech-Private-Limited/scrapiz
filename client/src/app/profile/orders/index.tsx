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
  ImageSourcePropType,
  Alert,
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
  ChevronRight,
  AlertCircle,
  FileText,
  Truck,
  XCircle,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useOrdersData } from '../../../hooks/useOrderData';
import { useOrderDetails } from '../../../hooks/userOrderDetails';
import { useTheme } from '../../../context/ThemeContext';
import { AuthService } from '../../../api/apiService';
import { RemoteImage } from '../../../components/RemoteImage';
import { isLiveOrderStatus } from '../../../utils/orderStatus';

function canTrackVendor(statusName: string) {
  return isLiveOrderStatus(statusName);
}

interface HeaderComponentProps {
  onBackPress: () => void;
  orderCount: number;
  colors: any;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ onBackPress, orderCount, colors }) => (
  <View style={[styles.header, { backgroundColor: colors.primary }]}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <ArrowLeft size={24} color="#fff" />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>My Orders</Text>
      <Text style={styles.headerSubtitle}>{orderCount} {orderCount === 1 ? 'order' : 'orders'}</Text>
    </View>
  </View>
);

// Mini progress indicator for order cards
const MiniProgressIndicator: React.FC<{ status: string; colors: any }> = ({ status, colors }) => {
  const normalizedStatus = (status || 'pending').toLowerCase();
  const isCancelled = normalizedStatus === 'cancelled';
  
  const steps = ['pending', 'scheduled', 'transit', 'completed'];
  const currentIndex = steps.indexOf(normalizedStatus);
  
  if (isCancelled) {
    return (
      <View style={styles.miniProgressContainer}>
        <View style={[styles.miniProgressDot, { backgroundColor: '#dc2626' }]} />
        <Text style={[styles.miniProgressText, { color: '#dc2626' }]}>Cancelled</Text>
      </View>
    );
  }

  const getStepLabel = () => {
    switch (normalizedStatus) {
      case 'pending': return 'Received';
      case 'scheduled': return 'Processed';
      case 'transit': return 'Pickup';
      case 'completed': return 'Completed';
      default: return 'Pending';
    }
  };

  const getStepColor = () => {
    switch (normalizedStatus) {
      case 'pending': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'transit': return '#8b5cf6';
      case 'completed': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.miniProgressContainer}>
      <View style={styles.miniProgressBar}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View style={[
              styles.miniDot,
              { backgroundColor: index <= currentIndex ? getStepColor() : colors.border }
            ]} />
            {index < steps.length - 1 && (
              <View style={[
                styles.miniLine,
                { backgroundColor: index < currentIndex ? getStepColor() : colors.border }
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={[styles.miniProgressText, { color: getStepColor() }]}>{getStepLabel()}</Text>
    </View>
  );
};

// Product image helper
const getProductImageFallback = (productName: string): ImageSourcePropType => {
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
  return require('../../../../assets/images/Scrap_Rates_Photos/Book.jpg');
};

export default function OrdersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { orders, products, loading, error, refetch } = useOrdersData();
  const ordersWithDetails = useOrderDetails(orders, products);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingOrderIds, setCancellingOrderIds] = useState<Set<number>>(new Set());
  const [showCancelledSection, setShowCancelledSection] = useState(false);

  const activeOrders = useMemo(
    () => ordersWithDetails.filter((o) => (o.statusName || '').toLowerCase() !== 'cancelled'),
    [ordersWithDetails]
  );

  const cancelledOrders = useMemo(
    () => ordersWithDetails.filter((o) => (o.statusName || '').toLowerCase() === 'cancelled'),
    [ordersWithDetails]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/profile/orders/${orderId}` as any);
  };

  const handleCancelOrder = (orderNumber: string, orderId: number) => {
    if (cancellingOrderIds.has(orderId)) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingOrderIds(prev => new Set(prev).add(orderId));
            try {
              await AuthService.cancelOrder({ order_number: orderNumber });
              Toast.show({
                type: 'success',
                text1: 'Order Cancelled',
                text2: `Order #${orderNumber} has been cancelled.`,
              });
              refetch();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to cancel order',
              });
            } finally {
              setCancellingOrderIds(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
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

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderComponent onBackPress={() => router.back()} orderCount={0} colors={colors} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderComponent onBackPress={() => router.back()} orderCount={0} colors={colors} />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to Load Orders</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderComponent onBackPress={() => router.back()} orderCount={orders.length} colors={colors} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => {
            const statusName = order.statusName || 'pending';
            const isCancellable = ['pending', 'scheduled', 'transit'].includes(statusName) || statusName === '';

            return (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.surface }]}
              >
                <TouchableOpacity
                  onPress={() => handleOrderPress(order.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.orderIdContainer}>
                      <View style={[styles.orderIdBadge, { backgroundColor: colors.primary + '15' }]}>
                        <FileText size={14} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.orderNumber, { color: colors.text }]}>#{order.order_number}</Text>
                        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(order.created_at)}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>

                  <View style={[styles.progressSection, { borderColor: colors.border }]}>
                    <MiniProgressIndicator status={statusName} colors={colors} />
                  </View>

                  <View style={styles.itemsPreview}>
                    <View style={styles.itemsRow}>
                      {order.orders.slice(0, 3).map((item, index) => {
                        const imageSource = item.product.image_url
                          ? { uri: item.product.image_url }
                          : getProductImageFallback(item.product.name);
                        return (
                          <View key={item.id} style={[styles.itemPreviewContainer, index > 0 && { marginLeft: -8 }]}>
                            <RemoteImage
                              source={imageSource}
                              fallback={getProductImageFallback(item.product.name)}
                              style={[styles.itemPreviewImage, { borderColor: colors.surface }]}
                            />
                          </View>
                        );
                      })}
                      {order.orders.length > 3 && (
                        <View style={[styles.moreItemsBadge, { backgroundColor: colors.primary, marginLeft: -8 }]}>
                          <Text style={styles.moreItemsText}>+{order.orders.length - 3}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
                      {order.orders.length} {order.orders.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.amountContainer}>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Est. Value</Text>
                    <View style={styles.amountRow}>
                      <IndianRupee size={16} color={colors.primary} />
                      <Text style={[styles.amountValue, { color: colors.primary }]}>
                        {Math.round(order.totalAmount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooterActions}>
                    {canTrackVendor(statusName) && (
                      <TouchableOpacity
                        style={[styles.trackVendorButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/tracking/${order.id}/search` as any)}
                        activeOpacity={0.8}
                      >
                        <Truck size={14} color="#fff" />
                        <Text style={styles.trackVendorButtonText}>View Live Order</Text>
                      </TouchableOpacity>
                    )}
                    {isCancellable && (
                      <TouchableOpacity
                        style={[styles.cancelOrderBtn, cancellingOrderIds.has(order.id) && { opacity: 0.5 }]}
                        onPress={() => handleCancelOrder(order.order_number, order.id)}
                        disabled={cancellingOrderIds.has(order.id)}
                        activeOpacity={0.7}
                      >
                        {cancellingOrderIds.has(order.id)
                          ? <ActivityIndicator size="small" color="#dc2626" />
                          : <XCircle size={14} color="#dc2626" />}
                        <Text style={styles.cancelOrderBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.viewDetailsButton, { backgroundColor: colors.primary + '10' }]}
                      onPress={() => handleOrderPress(order.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.border + '30' }]}>
              <Package size={48} color={colors.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Orders</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your active orders will appear here once you start selling scrap
            </Text>
          </View>
        )}

        {cancelledOrders.length > 0 && (
          <View style={styles.cancelledSection}>
            <TouchableOpacity
              style={[
                styles.cancelledSectionHeader,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5',
                  borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',
                },
              ]}
              onPress={() => setShowCancelledSection((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.cancelledHeaderLeft}>
                <View style={[styles.cancelledHeaderIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                  <Ban size={16} color="#dc2626" />
                </View>
                <View>
                  <Text style={[styles.cancelledHeaderTitle, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
                    Cancelled Bookings
                  </Text>
                  <Text style={[styles.cancelledHeaderCount, { color: isDark ? 'rgba(252,165,165,0.6)' : '#dc2626' }]}>
                    {cancelledOrders.length} {cancelledOrders.length === 1 ? 'order' : 'orders'} terminated
                  </Text>
                </View>
              </View>
              {showCancelledSection ? (
                <ChevronUp size={18} color="#dc2626" />
              ) : (
                <ChevronDown size={18} color="#dc2626" />
              )}
            </TouchableOpacity>

            {showCancelledSection && (
              <View style={styles.cancelledCardList}>
                {cancelledOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={[
                      styles.cancelledCard,
                      {
                        backgroundColor: isDark ? 'rgba(30,10,10,0.95)' : '#fff',
                        borderColor: isDark ? 'rgba(239,68,68,0.18)' : '#fecaca',
                      },
                    ]}
                    onPress={() => handleOrderPress(order.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cancelledCardTopRow}>
                      <View style={styles.cancelledCardLeft}>
                        <View
                          style={[
                            styles.cancelledCardBadge,
                            { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2' },
                          ]}
                        >
                          <XCircle size={13} color="#ef4444" />
                          <Text style={styles.cancelledCardBadgeText}>CANCELLED</Text>
                        </View>
                        <Text
                          style={[
                            styles.cancelledCardOrderNum,
                            { color: isDark ? '#fca5a5' : '#991b1b' },
                          ]}
                        >
                          #{order.order_number}
                        </Text>
                        <Text
                          style={[
                            styles.cancelledCardDate,
                            { color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af' },
                          ]}
                        >
                          {formatDate(order.created_at)}
                        </Text>
                      </View>
                      <View style={styles.cancelledCardRight}>
                        <View style={styles.cancelledCardImages}>
                          {order.orders.slice(0, 2).map((item, idx) => (
                            <View
                              key={item.id}
                              style={[
                                styles.cancelledCardImgWrap,
                                idx > 0 && { marginLeft: -8 },
                                { opacity: 0.55 },
                              ]}
                            >
                              <RemoteImage
                                source={
                                  item.product.image_url
                                    ? { uri: item.product.image_url }
                                    : getProductImageFallback(item.product.name)
                                }
                                fallback={getProductImageFallback(item.product.name)}
                                style={styles.cancelledCardImg}
                              />
                            </View>
                          ))}
                          {order.orders.length > 2 && (
                            <View
                              style={[
                                styles.cancelledCardMoreBadge,
                                { marginLeft: -8, opacity: 0.6, backgroundColor: '#dc2626' },
                              ]}
                            >
                              <Text style={styles.cancelledCardMoreText}>+{order.orders.length - 2}</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.cancelledCardAmount,
                            { color: isDark ? 'rgba(252,165,165,0.5)' : '#dc2626', opacity: 0.7 },
                          ]}
                        >
                          ₹{Math.round(order.totalAmount)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.cancelledCardDivider,
                        { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fecaca' },
                      ]}
                    />

                    <View style={styles.cancelledCardFooter}>
                      <View style={styles.cancelledCardFooterItem}>
                        <View style={[styles.cancelledStatusDot, { backgroundColor: '#ef4444' }]} />
                        <Text
                          style={[
                            styles.cancelledCardFooterLabel,
                            { color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' },
                          ]}
                        >
                          Lead & Booking Cancelled
                        </Text>
                      </View>
                      <View style={styles.cancelledCardViewBtn}>
                        <Text
                          style={[
                            styles.cancelledCardViewBtnText,
                            { color: isDark ? '#fca5a5' : '#dc2626' },
                          ]}
                        >
                          View
                        </Text>
                        <ChevronRight size={12} color={isDark ? '#fca5a5' : '#dc2626'} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
    miniProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  miniProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  miniProgressText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPreviewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
  },
  moreItemsBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  itemsCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  cardFooter: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  amountContainer: {
    width: '100%',
  },
  amountLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginLeft: 2,
  },
  viewDetailsButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cardFooterActions: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  trackVendorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  trackVendorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelOrderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#dc2626',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
    bottomSpacer: {
    height: 20,
  },
  cancelledSection: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelledSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 2,
  },
  cancelledHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelledHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  cancelledHeaderCount: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  cancelledCardList: {
    gap: 8,
    marginTop: 6,
  },
  cancelledCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cancelledCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    paddingBottom: 10,
  },
  cancelledCardLeft: {
    gap: 5,
  },
  cancelledCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  cancelledCardBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
    letterSpacing: 1,
  },
  cancelledCardOrderNum: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  cancelledCardDate: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  cancelledCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cancelledCardImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelledCardImgWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelledCardImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  cancelledCardMoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledCardMoreText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  cancelledCardAmount: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  cancelledCardDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  cancelledCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelledCardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelledStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cancelledCardFooterLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  cancelledCardViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cancelledCardViewBtnText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
