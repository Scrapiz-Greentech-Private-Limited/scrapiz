import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Check, ChevronRight, Clock3, MapPin, Search, Truck } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import { useOrderTracking } from '../../../context/OrderTrackingContext';
import { TrackingCoordinate, TrackingLeadItem } from '../../../types/orderTracking';
import { OrderTrackingMap } from '../../../components/tracking/OrderTrackingMap';
import { DEFAULT_CENTER } from '../../../config/mapConfig';

const PERSON_IMAGE = require('../../../../assets/images/person1.png');
const BACKEND_POLL_INTERVAL_MS = 120000;

function formatDateTime(value?: string | null) {
  if (!value) return { date: 'Not available', time: 'Not available' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value, time: 'Not available' };
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatAddress(address: any) {
  if (!address) return 'Pickup address will be shared shortly';
  return [address.room_number, address.street, address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

function formatItem(item: TrackingLeadItem) {
  return `${item.product_name} × ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`;
}

function RadarWaves() {
  const waves = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  useEffect(() => {
    const loops = waves.map((wave, index) => {
      const animation = Animated.loop(Animated.sequence([
        Animated.delay(index * 850),
        Animated.timing(wave, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(wave, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
      animation.start();
      return animation;
    });
    return () => loops.forEach((animation) => animation.stop());
  }, [waves]);

  return (
    <View pointerEvents="none" style={styles.radarMarker}>
      {waves.map((wave, index) => (
        <Animated.View key={index} style={[styles.radarWave, {
          opacity: wave.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.45, 0] }),
          transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.55, 2.4] }) }],
        }]} />
      ))}
      <View style={styles.radarCore}><MapPin size={18} color="#FFFFFF" fill="#16A34A" /></View>
    </View>
  );
}

function Timeline({ phase }: { phase: string }) {
  const activeIndex = phase === 'en_route' ? 1 : phase === 'completed' ? 2 : 0;
  const steps = [{ label: 'Finding\npartner', icon: Search }, { label: 'Partner\non the way', icon: Truck }, { label: 'Pickup\nin progress', icon: Check }];
  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineTrack} />
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = index <= activeIndex;
        return <View key={step.label} style={styles.timelineStep}>
          <View style={[styles.timelineIcon, active && styles.timelineIconActive]}><Icon size={22} color={active ? '#FFFFFF' : '#8993A3'} strokeWidth={2.4} /></View>
          <Text style={[styles.timelineLabel, active && styles.timelineLabelActive]}>{step.label}</Text>
        </View>;
      })}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value || 'Not available'}</Text></View>;
}

export default function VendorSearchScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { isDark } = useTheme();
  const { acceptedVendor, cancelOrder, isBootstrapping, orderDetails, phase, pickup, quote, refreshFromRest } = useOrderTracking();
  const [deviceLocation, setDeviceLocation] = useState<TrackingCoordinate | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const poll = setInterval(() => refreshFromRest().catch((error) => console.warn('Order assignment poll failed', error)), BACKEND_POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [refreshFromRest]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (mounted) setDeviceLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
      } catch (error) { console.log('Tracking location unavailable', error); }
    })();
    return () => { mounted = false; };
  }, []);

  const pickupCoordinate = useMemo(() => {
    if (pickup.lat === DEFAULT_CENTER[1] && pickup.lng === DEFAULT_CENTER[0] && deviceLocation) return deviceLocation;
    return pickup;
  }, [deviceLocation, pickup]);
  const orderDateTime = formatDateTime(orderDetails?.created_at);
  const items = orderDetails?.items || [];
  const address = formatAddress(orderDetails?.address);
  const phone = orderDetails?.address?.phone_number || 'Not available';
  const hasAcceptedPartner = Boolean(acceptedVendor);
  const quoteSubmitted = quote?.status === 'submitted';
  const paymentReady = quote?.status === 'awaiting_payment' || quote?.status === 'paid';
  const paymentNeedsConfirmation = ['vendor_reference_submitted', 'customer_confirmation_pending'].includes(String(quote?.payment_status || '').toLowerCase());
  const quotePaymentLabel = quote?.preferred_payment_method === 'upi' ? 'UPI transfer' : 'Cash payout';
  const quoteItems = quote?.items?.filter((item) => item.is_selected) || [];
  const value = orderDetails?.estimated_order_value != null ? `₹${Number(orderDetails.estimated_order_value).toLocaleString('en-IN')}` : 'To be confirmed';

  if (isBootstrapping) return <SafeAreaView style={styles.loadingScreen}><StatusBar style={isDark ? 'light' : 'dark'} /><ActivityIndicator size="large" color="#16A34A" /><Text style={styles.loadingTitle}>Preparing your pickup request</Text><Text style={styles.loadingSubtitle}>Connecting to the latest assignment status.</Text></SafeAreaView>;

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <StatusBar style="light" />
    <View style={styles.mapStage}>
      <OrderTrackingMap pickup={pickupCoordinate} phase={phase} vendorPins={[]} acceptedVendorLocation={null} userLocation={deviceLocation} notifiedVendorCount={0} />
      {phase === 'searching' && <RadarWaves />}
      <Pressable style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#FFFFFF" /></Pressable>
      <View style={styles.mapStatus}><Clock3 size={14} color="#B8F2C7" /><Text style={styles.mapStatusText}>Live pickup search</Text></View>
    </View>
    <View style={styles.sheet}>
      <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.handle} />
        <View style={styles.badge}><Text style={styles.badgeText}>{hasAcceptedPartner ? 'PARTNER ASSIGNED' : 'PICKUP REQUEST SENT'}</Text></View>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}><Text style={styles.title}>Finding the</Text><Text style={styles.titleGreen}>nearest partner</Text><Text style={styles.subtitle}>We’re looking for the nearest available Scrapiz partner in your area.</Text></View>
          <Image source={PERSON_IMAGE} resizeMode="contain" style={styles.personImage} />
        </View>
        <Timeline phase={phase} />
        {!hasAcceptedPartner ? <View style={styles.noteCard}><View style={styles.noteIcon}><Bell size={24} color="#168447" /></View><View style={styles.noteCopy}><Text style={styles.noteTitle}>You can close the app</Text><Text style={styles.noteText}>We’ll notify you as soon as a partner accepts your pickup request.</Text></View></View> : null}
        {hasAcceptedPartner ? <View style={styles.acceptedFlow}>
          <View style={styles.acceptedNotice}><Text style={styles.acceptedNoticeText}>{acceptedVendor?.name || 'Your partner'} has accepted your booking.</Text></View>
          {quote ? <View style={styles.quoteCard}>
            <View style={styles.quoteHeader}><View><Text style={styles.quoteEyebrow}>PAYOUT QUOTE</Text><Text style={styles.quoteTitle}>{paymentNeedsConfirmation ? 'Confirm your payout' : 'Review your payout'}</Text></View><Text style={styles.quoteStatus}>{paymentNeedsConfirmation ? 'CONFIRM' : paymentReady ? 'READY' : quoteSubmitted ? 'NEW' : 'UPDATING'}</Text></View>
            {quoteItems.map((item) => <View key={`${item.product_id}-${item.product_name}`} style={styles.quoteItem}><View style={styles.quoteItemCopy}><Text style={styles.quoteItemName}>{item.product_name}</Text><Text style={styles.quoteItemMeta}>{item.actual_weight_kg} kg × ₹{Number(item.quoted_rate_per_kg).toLocaleString('en-IN')}</Text></View><Text style={styles.quoteItemAmount}>₹{Number(item.subtotal).toLocaleString('en-IN')}</Text></View>)}
            <View style={styles.quoteTotalRow}><Text style={styles.quoteTotalLabel}>Total payout</Text><Text style={styles.quoteTotal}>₹{Number(quote.total_amount).toLocaleString('en-IN')}</Text></View>
            <Text style={styles.quoteMethod}>Vendor preferred payment: {quotePaymentLabel}</Text>
            <Pressable style={styles.quoteAction} onPress={() => router.push(`/tracking/${orderId}/${quoteSubmitted ? 'quote' : 'payment'}` as any)}><Text style={styles.quoteActionText}>{quoteSubmitted ? 'Review quote & payment details' : paymentNeedsConfirmation ? 'Confirm payout received' : 'View payment & QR code'}</Text><ChevronRight size={20} color="#FFFFFF" /></Pressable>
          </View> : <View style={styles.waitingQuote}><ActivityIndicator size="small" color="#168447" /><Text style={styles.waitingQuoteText}>Your partner is preparing the payout quote.</Text></View>}
        </View> : null}
        <Pressable style={styles.detailsButton} onPress={() => setShowDetails(true)}><Text style={styles.detailsButtonText}>View Request Details</Text><ChevronRight size={21} color="#168447" /></Pressable>
        <Pressable style={styles.cancelButton} onPress={cancelOrder}><Text style={styles.cancelButtonText}>Cancel pickup request</Text></Pressable>
      </ScrollView>
    </View>
    <Modal visible={showDetails} transparent animationType="slide" onRequestClose={() => setShowDetails(false)}>
      <View style={styles.modalBackdrop}><View style={styles.detailsSheet}><View style={styles.modalHandle} /><View style={styles.modalHeader}><Text style={styles.modalTitle}>Request Details</Text><Pressable onPress={() => setShowDetails(false)}><Text style={styles.closeText}>Close</Text></Pressable></View>
        <ScrollView showsVerticalScrollIndicator={false}><DetailRow label="Order date" value={orderDateTime.date} /><DetailRow label="Order time" value={orderDateTime.time} /><DetailRow label="Estimated value" value={value} /><DetailRow label="Pickup address" value={address} /><DetailRow label="Mobile number" value={phone} /><View style={styles.itemsBlock}><Text style={styles.itemsTitle}>Items</Text>{items.length ? items.map((item) => <Text key={`${item.product_id}-${item.product_name}`} style={styles.itemText}>{formatItem(item)}</Text>) : <Text style={styles.itemText}>Items are syncing with your request.</Text>}</View></ScrollView>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingScreen: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingTitle: { marginTop: 16, fontSize: 21, fontWeight: '800', color: '#122033' },
  loadingSubtitle: { marginTop: 8, fontSize: 14, color: '#687386', textAlign: 'center' },
  mapStage: { height: '43%', minHeight: 285, backgroundColor: '#DDE8F1' },
  backButton: { position: 'absolute', top: 18, left: 18, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.82)' },
  mapStatus: { position: 'absolute', top: 25, right: 18, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: 'rgba(15,23,42,0.78)' },
  mapStatusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  radarMarker: { position: 'absolute', top: '50%', left: '50%', width: 112, height: 112, marginTop: -56, marginLeft: -56, alignItems: 'center', justifyContent: 'center' },
  radarWave: { position: 'absolute', width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: '#25C76A', backgroundColor: 'rgba(37,199,106,0.12)' },
  radarCore: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', borderWidth: 5, borderColor: '#D9FBE3', shadowColor: '#16A34A', shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  sheet: { flex: 1, marginTop: -22, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', shadowColor: '#122033', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 12 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 11, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 68, height: 7, borderRadius: 5, backgroundColor: '#D9DEE6', marginBottom: 22 },
  badge: { alignSelf: 'flex-start', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#E5F7EC' },
  badgeText: { color: '#168447', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  heroRow: { minHeight: 178, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  heroCopy: { flex: 1, zIndex: 1 },
  title: { color: '#122033', fontSize: 39, lineHeight: 42, fontWeight: '900', letterSpacing: -1.2 },
  titleGreen: { color: '#168447', fontSize: 39, lineHeight: 42, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { marginTop: 14, maxWidth: 280, color: '#6D7788', fontSize: 17, lineHeight: 24, fontWeight: '500' },
  personImage: { width: 174, height: 205, marginLeft: -35, marginRight: -18, alignSelf: 'flex-end' },
  timelineCard: { position: 'relative', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 18, paddingBottom: 14, marginTop: 10, borderWidth: 1, borderColor: '#E1E6EC', borderRadius: 24 },
  timelineTrack: { position: 'absolute', top: 42, left: 56, right: 56, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#D2D9E3' },
  timelineStep: { width: '33.33%', alignItems: 'center' },
  timelineIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineIconActive: { backgroundColor: '#16A34A', borderWidth: 7, borderColor: '#D8F5E2', shadowColor: '#16A34A', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  timelineLabel: { marginTop: 10, color: '#7A8494', fontSize: 15, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  timelineLabelActive: { color: '#168447', fontWeight: '900' },
  noteCard: { flexDirection: 'row', alignItems: 'center', marginTop: 18, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#E1E6EC', backgroundColor: '#FBFCFE' },
  noteIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F6E8', marginRight: 16 },
  noteCopy: { flex: 1 },
  noteTitle: { color: '#122033', fontSize: 17, fontWeight: '900', marginBottom: 4 },
  noteText: { color: '#727D8E', fontSize: 15, lineHeight: 22, fontWeight: '500' },
  acceptedNotice: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#E5F7EC' },
  acceptedNoticeText: { color: '#168447', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  acceptedFlow: { marginTop: 2 },
  quoteCard: { marginTop: 14, padding: 18, borderRadius: 22, backgroundColor: '#F4FBF6', borderWidth: 1, borderColor: '#BDE8CA' },
  quoteHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  quoteEyebrow: { color: '#168447', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  quoteTitle: { marginTop: 4, color: '#122033', fontSize: 20, fontWeight: '900' },
  quoteStatus: { color: '#168447', fontSize: 11, fontWeight: '900', backgroundColor: '#D9F5E1', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  quoteItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#DDEFE2' },
  quoteItemCopy: { flex: 1, paddingRight: 10 },
  quoteItemName: { color: '#122033', fontSize: 14, fontWeight: '800' },
  quoteItemMeta: { marginTop: 3, color: '#687386', fontSize: 12, fontWeight: '600' },
  quoteItemAmount: { color: '#168447', fontSize: 14, fontWeight: '900' },
  quoteTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15 },
  quoteTotalLabel: { color: '#122033', fontSize: 16, fontWeight: '800' },
  quoteTotal: { color: '#168447', fontSize: 22, fontWeight: '900' },
  quoteMethod: { marginTop: 8, color: '#687386', fontSize: 13, fontWeight: '600' },
  quoteAction: { marginTop: 16, minHeight: 52, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#168447', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  quoteActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  waitingQuote: { marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: '#F4FBF6', flexDirection: 'row', alignItems: 'center', gap: 10 },
  waitingQuoteText: { flex: 1, color: '#168447', fontSize: 14, fontWeight: '700' },
  detailsButton: { height: 58, marginTop: 18, borderRadius: 18, borderWidth: 2, borderColor: '#B6E8C8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  detailsButtonText: { color: '#168447', fontSize: 17, fontWeight: '900' },
  cancelButton: { alignItems: 'center', paddingVertical: 16 },
  cancelButtonText: { color: '#7A8494', fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,17,29,0.42)' },
  detailsSheet: { maxHeight: '82%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28, backgroundColor: '#FFFFFF' },
  modalHandle: { alignSelf: 'center', width: 64, height: 6, borderRadius: 4, backgroundColor: '#D9DEE6', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#122033', fontSize: 24, fontWeight: '900' },
  closeText: { color: '#168447', fontSize: 15, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EDF0F4' },
  detailLabel: { width: '36%', color: '#7A8494', fontSize: 14, fontWeight: '700' },
  detailValue: { flex: 1, color: '#122033', fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'right' },
  itemsBlock: { paddingTop: 18 },
  itemsTitle: { color: '#122033', fontSize: 17, fontWeight: '900', marginBottom: 10 },
  itemText: { color: '#4E5A6C', fontSize: 14, lineHeight: 22, paddingVertical: 4 },
});
