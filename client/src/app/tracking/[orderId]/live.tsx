import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  PanResponder,
  Platform,
  Pressable,
 
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView,} from "react-native-safe-area-context"
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Map,
  MapPin,
  Navigation,
  PackageOpen,
  Phone,
  Truck,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import { useOrderTracking } from '../../../context/OrderTrackingContext';
import { OrderTrackingMap, RouteUpdateData } from '../../../components/tracking/OrderTrackingMap';
import { DockChat } from '../../../components/chat/DockChat';
import {
  buildGoogleReverseGeocodeUrl,
  DEFAULT_CENTER,
  GOOGLE_API_KEY,
} from '../../../config/mapConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_CONFIG = [
  { key: 'en_route', label: 'En route', icon: Truck },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'collecting', label: 'Collecting', icon: PackageOpen },
  { key: 'completed', label: 'Complete', icon: CheckCircle2 },
] as const;

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors, isDark } = useTheme();
  const {
    acceptedItems,
    acceptedVendor,
    callVendor,
    connectionState,
    pickup,
    step,
    vendorLocation,
    vendorPins,
    quote,
  } = useOrderTracking();

  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [navData, setNavData] = useState<RouteUpdateData | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const requestedLocationRef = useRef(false);
  const paymentNeedsConfirmation = ['vendor_reference_submitted', 'customer_confirmation_pending'].includes(String(quote?.payment_status || '').toLowerCase());
  const paymentReceived = ['paid', 'cash_paid'].includes(String(quote?.payment_status || '').toLowerCase());

  // ── Location permission & hydration ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const hydrateDeviceLocation = async () => {
      try {
        let status = (await Location.getForegroundPermissionsAsync()).status;
        if (status !== 'granted') {
          status = (await Location.requestForegroundPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

        try {
          if (Location.enableNetworkProviderAsync) {
            await Location.enableNetworkProviderAsync();
          }
        } catch {}

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        });

        if (!isMounted) return;
        setDeviceLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
      } catch (error) {
        console.log('Live tracking location fallback unavailable', error);
      }
    };

    if (!requestedLocationRef.current) {
      requestedLocationRef.current = true;
      const timer = setTimeout(hydrateDeviceLocation, 450);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [pickup.lat, pickup.lng]);

  // ── Reverse geocode pickup address ─────────────────────────────────────────
  useEffect(() => {
    if (!pickup.lat || !pickup.lng || !GOOGLE_API_KEY) return;

    const url = buildGoogleReverseGeocodeUrl(pickup.lat, pickup.lng);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const address: string | undefined = data?.results?.[0]?.formatted_address;
        if (address) setPickupAddress(address);
      })
      .catch(() => {});
  }, [pickup.lat, pickup.lng]);

  // ── Resolved coordinates ────────────────────────────────────────────────────
  const resolvedPickup = useMemo(() => {
    const isDefault =
      pickup.lat === DEFAULT_CENTER[1] && pickup.lng === DEFAULT_CENTER[0];
    if (isDefault && deviceLocation) return deviceLocation;
    return pickup;
  }, [deviceLocation, pickup]);

  const resolvedVendorLocation = useMemo(() => {
    if (vendorLocation) return vendorLocation;
    if (acceptedVendor?.lat != null && acceptedVendor?.lng != null) {
      return { lat: acceptedVendor.lat, lng: acceptedVendor.lng };
    }
    const firstPin = vendorPins.find((p) => p.lat !== undefined && p.lng !== undefined);
    if (firstPin) return { lat: firstPin.lat, lng: firstPin.lng };
    return null;
  }, [acceptedVendor?.lat, acceptedVendor?.lng, vendorLocation, vendorPins]);

  const currentStepIndex = useMemo(() => {
    const lookup = step === 'ready' ? 'collecting' : step;
    return Math.max(0, STEP_CONFIG.findIndex((item) => item.key === lookup));
  }, [step]);

  // ── Open Google Maps ────────────────────────────────────────────────────────
  const handleOpenGoogleMaps = () => {
    const { lat, lng } = resolvedPickup;
    const androidUrl = `google.navigation:q=${lat},${lng}&mode=d`;
    const iosUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    const webUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`;

    const primaryUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;

    Linking.canOpenURL(primaryUrl)
      .then((can) => Linking.openURL(can ? primaryUrl : webUrl))
      .catch(() => Linking.openURL(webUrl));
  };

  // ── Draggable Open-Maps button ──────────────────────────────────────────────
  const openMapsPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const openMapsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6,
      onPanResponderGrant: () => {
        openMapsPan.setOffset({
          x: (openMapsPan.x as any)._value,
          y: (openMapsPan.y as any)._value,
        });
        openMapsPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: openMapsPan.x, dy: openMapsPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        openMapsPan.flattenOffset();
      },
    })
  ).current;

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/tracking/${orderId}/search` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Map area ─────────────────────────────────────────── */}
      <View style={styles.mapWrapper}>
        <OrderTrackingMap
          pickup={resolvedPickup}
          phase="en_route"
          vendorPins={vendorPins}
          acceptedVendorLocation={resolvedVendorLocation}
          userLocation={deviceLocation}
          vendorName={acceptedVendor?.name}
          onRouteUpdate={setNavData}
        />

        {/* Back button */}
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={handleGoBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>

        {/* Google Maps-style route header */}
        <View
          style={[
            styles.routeHeader,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Navigation instruction row */}
          <View style={styles.navInstructionRow}>
            <View style={[styles.navIconBg, { backgroundColor: colors.primary }]}>
              <Navigation size={17} color="#fff" />
            </View>
            <View style={styles.navTextBlock}>
              <Text style={[styles.navDistance, { color: colors.text }]}>
                {navData ? formatDistance(navData.distanceM) : '—'}
              </Text>
              <Text
                style={[styles.navInstruction, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {navData?.instruction ?? 'Calculating route…'}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.headerDivider, { backgroundColor: colors.divider }]} />

          {/* From / To address */}
          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <View style={[styles.dotStart, { backgroundColor: colors.primary }]} />
              <Text
                style={[styles.addressText, { color: colors.text }]}
                numberOfLines={1}
              >
                Your current location
              </Text>
            </View>
            <View style={[styles.addressDropIcon]}>
              <ChevronDown size={13} color={colors.textTertiary} />
            </View>
            <View style={styles.addressRow}>
              <MapPin size={13} color="#EF4444" />
              <Text
                style={[styles.addressText, { color: colors.text }]}
                numberOfLines={1}
              >
                {pickupAddress || 'Customer pickup location'}
              </Text>
            </View>
          </View>
        </View>

        {/* DockChat – left side floating */}
        <View style={styles.dockChatWrap}>
          <DockChat
            title="Chat with Customer"
            buttonColor={colors.primary}
          />
        </View>

        {/* Draggable "Open Google Maps" button */}
        <Animated.View
          style={[
            styles.openMapsBtn,
            { transform: openMapsPan.getTranslateTransform() },
          ]}
          {...openMapsPanResponder.panHandlers}
        >
          <TouchableOpacity
            style={[styles.openMapsBtnInner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleOpenGoogleMaps}
            activeOpacity={0.85}
            accessibilityLabel="Open Google Maps for navigation"
            accessibilityRole="button"
          >
            <Map size={16} color="#4285F4" />
            <Text style={[styles.openMapsText, { color: colors.text }]}>
              Open in Maps
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Bottom sheet ─────────────────────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {step === 'arrived' && (
          <View style={[styles.arrivalBanner, { backgroundColor: isDark ? '#14532d' : '#dcfce7' }]}>
            <Text style={[styles.arrivalBannerText, { color: colors.primary }]}>
              Your vendor has arrived. Please be ready.
            </Text>
          </View>
        )}

        {/* Step progress rail */}
        <View style={styles.stepRail}>
          {STEP_CONFIG.map((item, index) => {
            const Icon = item.icon;
            const active = index <= currentStepIndex;
            return (
              <View key={item.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepIcon,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : isDark
                        ? '#334155'
                        : '#e2e8f0',
                    },
                  ]}
                >
                  <Icon size={14} color={active ? '#fff' : colors.textSecondary} />
                </View>
                {index < STEP_CONFIG.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      {
                        backgroundColor:
                          index < currentStepIndex ? colors.primary : colors.border,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Vendor row */}
        <View style={styles.vendorHeader}>
          <View
            style={[
              styles.vendorAvatar,
              { backgroundColor: isDark ? '#14532d' : '#dcfce7' },
            ]}
          >
            <Text style={[styles.vendorAvatarText, { color: colors.primary }]}>
              {acceptedVendor?.name?.slice(0, 1)?.toUpperCase() || 'V'}
            </Text>
          </View>
          <View style={styles.vendorTextWrap}>
            <Text style={[styles.vendorName, { color: colors.text }]}>
              {acceptedVendor?.name || 'Pickup partner'}
            </Text>
            <Text style={[styles.vendorSubtitle, { color: colors.textSecondary }]}>
              {acceptedVendor?.vehicle_type || 'Assigned vendor'}
              {acceptedVendor?.vehicle_number ? ` • ${acceptedVendor.vehicle_number}` : ''}
            </Text>
          </View>
          <Pressable
            style={[styles.callButton, { backgroundColor: colors.primary }]}
            onPress={callVendor}
            accessibilityLabel="Call vendor"
            accessibilityRole="button"
          >
            <Phone size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Accepted materials */}
        {acceptedItems.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={[styles.itemsSectionTitle, { color: colors.text }]}>
              Accepted materials
            </Text>
            <View style={styles.itemsWrap}>
              {acceptedItems.slice(0, 4).map((item) => (
                <View
                  key={`${item.product_id}-${item.product_name}`}
                  style={[
                    styles.itemChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.itemChipTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.product_name}
                  </Text>
                  <Text style={[styles.itemChipQty, { color: colors.textSecondary }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {quote && ['submitted', 'awaiting_payment', 'accepted', 'paid'].includes(quote.status) && (
          <View style={[styles.quoteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.quoteHeaderRow}>
              <View>
                <Text style={[styles.quoteEyebrow, { color: colors.primary }]}>VENDOR QUOTE</Text>
                <Text style={[styles.quoteTitle, { color: colors.text }]}>Your payout is ready</Text>
              </View>
              <View style={[styles.quoteStatusPill, { backgroundColor: isDark ? '#14532d' : '#dcfce7' }]}>
                <Text style={[styles.quoteStatusText, { color: colors.primary }]}>
                  {paymentNeedsConfirmation ? 'Confirm payout' : paymentReceived ? 'Received' : quote.status === 'submitted' ? 'Review' : quote.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {quote.items.filter((item) => item.is_selected).slice(0, 3).map((item) => (
              <View key={`${item.product_id}-${item.product_name}`} style={styles.quoteLineRow}>
                <Text style={[styles.quoteItemName, { color: colors.text }]} numberOfLines={1}>
                  {item.product_name}
                </Text>
                <Text style={[styles.quoteItemMeta, { color: colors.textSecondary }]}>
                  {item.actual_weight_kg} kg × ₹{Number(item.quoted_rate_per_kg).toFixed(2)}
                </Text>
                <Text style={[styles.quoteItemAmount, { color: colors.text }]}>₹{Number(item.subtotal).toFixed(2)}</Text>
              </View>
            ))}

            <View style={[styles.quoteTotalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.quoteTotalLabel, { color: colors.textSecondary }]}>Estimated payout</Text>
              <Text style={[styles.quoteTotalValue, { color: colors.primary }]}>₹{Number(quote.total_amount).toFixed(2)}</Text>
            </View>
            <Text style={[styles.quotePaymentNote, { color: colors.textSecondary }]}>
              Payment method: {quote.preferred_payment_method === 'upi' ? 'UPI transfer' : 'Cash'}
            </Text>

            <TouchableOpacity
              style={[styles.quoteAction, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/tracking/${orderId}/${quote.status === 'submitted' ? 'quote' : 'payment'}` as any)}
            >
              <Text style={styles.quoteActionText}>
                {quote.status === 'submitted' ? 'Review & confirm payout' : paymentNeedsConfirmation ? 'Confirm payout received' : paymentReceived ? 'View transaction received' : 'Review payment status'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
  // ── Back button ─────────────────────────────────────────────────────────────
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  // ── Route header (replaces topStatusCard) ───────────────────────────────────
  routeHeader: {
    position: 'absolute',
    top: 18,
    left: 72,
    right: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  navInstructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navTextBlock: {
    flex: 1,
    gap: 1,
  },
  navDistance: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  navInstruction: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  headerDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  addressSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  addressDropIcon: {
    paddingLeft: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  // ── DockChat wrapper ─────────────────────────────────────────────────────────
  dockChatWrap: {
    position: 'absolute',
    left: 16,
    bottom: 32,
    zIndex: 20,
  },
  // ── Draggable Open Maps button ───────────────────────────────────────────────
  openMapsBtn: {
    position: 'absolute',
    right: 16,
    top: 220,
    zIndex: 15,
  },
  openMapsBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  openMapsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 16,
  },
  arrivalBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  arrivalBannerText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  // ── Step rail ────────────────────────────────────────────────────────────────
  stepRail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    marginHorizontal: 6,
  },
  // ── Vendor row ───────────────────────────────────────────────────────────────
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  vendorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorAvatarText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  vendorTextWrap: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  vendorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Items ────────────────────────────────────────────────────────────────────
  itemsSection: {
    gap: 10,
  },
  itemsSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '47%',
  },
  itemChipTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  itemChipQty: {
    marginTop: 3,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  quoteCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  quoteEyebrow: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
  },
  quoteTitle: {
    marginTop: 3,
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  quoteStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quoteStatusText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  quoteLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteItemName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  quoteItemMeta: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  quoteItemAmount: {
    minWidth: 68,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  quoteTotalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteTotalLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  quoteTotalValue: {
    fontSize: 21,
    fontFamily: 'Inter-Bold',
  },
  quotePaymentNote: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  quoteAction: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  quoteActionText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
});
