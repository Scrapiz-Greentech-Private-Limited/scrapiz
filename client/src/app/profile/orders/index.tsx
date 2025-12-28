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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useOrdersData } from '../../../hooks/useOrderData';
import { useOrderDetails } from '../../../hooks/userOrderDetails';
import { useTheme } from '../../../context/ThemeContext';
import { RemoteImage } from '../../../components/RemoteImage';

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/profile/orders/${orderId}` as any);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
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

  // Error state
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
        {ordersWithDetails.length > 0 ? (
          ordersWithDetails.map((order) => {
            const statusName = order.statusName || 'pending';
            
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.surface }]}
                onPress={() => handleOrderPress(order.id)}
                activeOpacity={0.7}
              >
                {/* Card Header */}
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

                {/* Progress Indicator */}
                <View style={[styles.progressSection, { borderColor: colors.border }]}>
                  <MiniProgressIndicator status={statusName} colors={colors} />
                </View>

                {/* Items Preview */}
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

                {/* Card Footer */}
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
                  <View style={[styles.viewDetailsButton, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.border + '30' }]}>
              <Package size={48} color={colors.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your orders will appear here once you start selling scrap
            </Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  amountContainer: {},
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
