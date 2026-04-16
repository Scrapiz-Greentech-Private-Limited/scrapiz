import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Phone, Truck } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useOrderTracking } from '../../../context/OrderTrackingContext';

function formatQty(quantity: number, unit: string) {
  const rounded = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
  return `${rounded} ${unit || ''}`.trim();
}

export default function AcceptedLeadScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors, isDark } = useTheme();
  const { acceptedItems, acceptedVendor, callVendor } = useOrderTracking();

  useEffect(() => {
    if (!acceptedVendor && orderId) {
      router.replace(`/tracking/${orderId}/search` as any);
    }
  }, [acceptedVendor, orderId, router]);

  if (!acceptedVendor) {
    return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}> 
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <CheckCircle2 size={16} color="#16A34A" />
              <Text style={styles.heroBadgeText}>Vendor Accepted</Text>
            </View>
            <Text style={styles.heroOrderText}>Order #{orderId}</Text>
          </View>

          <Text style={styles.heroTitle}>{acceptedVendor.name} is coming for pickup</Text>
          <Text style={styles.heroSubtitle}>
            Your selected material lines have been confirmed. Review the items below before the live trip starts.
          </Text>

          <View style={styles.heroVendorRow}>
            <View style={styles.heroVendorAvatar}>
              <Text style={styles.heroVendorAvatarText}>{acceptedVendor.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.heroVendorCopy}>
              <Text style={styles.heroVendorName}>{acceptedVendor.name}</Text>
              <Text style={styles.heroVendorMeta}>
                {acceptedVendor.vehicle_type || 'Pickup vendor'}
                {acceptedVendor.vehicle_number ? ` • ${acceptedVendor.vehicle_number}` : ''}
              </Text>
            </View>
            <Pressable style={styles.callButton} onPress={callVendor}>
              <Phone size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.listHeader}>
            <Truck size={18} color={colors.primary} />
            <Text style={[styles.listTitle, { color: colors.text }]}>Material lines shared with vendor</Text>
          </View>

          {acceptedItems.length > 0 ? (
            acceptedItems.map((item) => (
              <View key={`${item.product_id}-${item.product_name}`} style={[styles.itemRow, { borderColor: colors.border }]}> 
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImageFallback]}>
                    <Text style={styles.itemImageFallbackText}>{item.product_name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}

                <View style={styles.itemCopy}>
                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                    Quantity: {formatQty(item.quantity, item.unit)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>Accepted items are being synced.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomActionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Pressable
          style={[styles.liveButton, { backgroundColor: colors.primary }]}
          onPress={() => router.replace(`/tracking/${orderId}/live` as any)}
        >
          <Text style={styles.liveButtonText}>Start Live Tracking</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
    gap: 14,
  },
  heroCard: {
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#14532D',
  },
  heroOrderText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.86)',
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.86)',
  },
  heroVendorRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroVendorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroVendorAvatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  heroVendorCopy: {
    flex: 1,
  },
  heroVendorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  heroVendorMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.86)',
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  itemImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  itemImageFallbackText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#334155',
  },
  itemCopy: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter-SemiBold',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  emptyItemsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    paddingVertical: 8,
  },
  bottomActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    padding: 16,
  },
  liveButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
