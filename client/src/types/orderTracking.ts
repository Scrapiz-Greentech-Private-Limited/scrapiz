export type TrackingPhase = 'searching' | 'en_route' | 'no_vendor' | 'completed' | 'cancelled';
export type TrackingConnectionState = 'connecting' | 'connected' | 'offline';
export type TrackingStep = 'en_route' | 'arrived' | 'collecting' | 'ready' | 'completed';

export interface TrackingCoordinate {
  lat: number;
  lng: number;
}

export interface TrackingVendorPin {
  vendor_id: number;
  name: string;
  pin_role?: 'vendor' | 'agent';
  lat: number;
  lng: number;
  distance_km?: number | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  service_city?: string | null;
  service_area?: string | null;
  phone?: string | null;
  rating?: number | null;
}

export interface TrackingVendorSummary {
  id: number;
  name: string;
  phone?: string | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  last_location_update?: string | null;
}

export interface TrackingLeadItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
  min_rate?: number | null;
  max_rate?: number | null;
  image_url?: string | null;
  category?: string | null;
}

export interface TrackingQuoteItem {
  product_id: number;
  product_name: string;
  is_selected: boolean;
  quoted_rate_per_kg: number;
  actual_weight_kg: number;
  subtotal: number;
}

export interface TrackingQuote {
  booking_id: string;
  order_id: number;
  status: string;
  preferred_payment_method?: 'cash' | 'upi' | null;
  fallback_payment_method?: 'cash' | 'none' | null;
  payment_method?: 'cash' | 'upi' | null;
  total_amount: number;
  customer_upi_id?: string;
  customer_upi_name?: string;
  upi_reference?: string;
  payment_status?: string | null;
  payment_upi_reference?: string | null;
  remarks?: string;
  submitted_at?: string | null;
  responded_at?: string | null;
  paid_at?: string | null;
  items: TrackingQuoteItem[];
}

export interface TrackingOrderAddress {
  name?: string | null;
  phone_number?: string | null;
  room_number?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: number | string | null;
}

export interface TrackingOrderDetails {
  order_number?: string | null;
  created_at?: string | null;
  estimated_order_value?: number | null;
  address?: TrackingOrderAddress | null;
  items?: TrackingLeadItem[];
}

export interface TrackingNearbyAgent {
  id: number;
  agent_code: string;
  name: string;
  phone: string;
  email: string;
  profile_image_url?: string | null;
  vehicle_number?: string | null;
  vehicle_type?: string | null;
  average_rating?: number | null;
  rating_count?: number | null;
  availability?: string | null;
  coverage_location?: string | null;
  match_reason?: string | null;
  lat?: number | null;
  lng?: number | null;
  service_pincodes?: Array<{
    pincode: string;
    city__name: string;
  }>;
  service_areas?: Array<{
    name: string;
    pincode__pincode: string;
    pincode__city__name: string;
  }>;
}

export interface TrackingLeadData {
  status?: string | null;
  vendor_count_notified?: number | null;
  vendor_pins?: TrackingVendorPin[];
}

export interface TrackingBookingData {
  id: string;
  status: string;
  vendor: TrackingVendorSummary;
  items?: TrackingLeadItem[];
  quote?: TrackingQuote | null;
}

export interface OrderTrackingResponse {
  order_id: number;
  order_number?: string | null;
  created_at?: string | null;
  estimated_order_value?: number | null;
  address?: TrackingOrderAddress | null;
  items?: TrackingLeadItem[];
  order_status?: string | null;
  lead?: TrackingLeadData | null;
  booking?: TrackingBookingData | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
}

export interface TrackingLineItem {
  label: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface TrackingCompletionSummary {
  total_payout?: number | null;
  line_items?: TrackingLineItem[];
}

export interface VendorDispatchedEvent {
  type: 'vendor_dispatched';
  lead_id?: string;
  vendor_count?: number;
  vendor_pins?: TrackingVendorPin[];
  expires_at?: string | null;
}

export interface LeadAcceptedEvent {
  type: 'lead_accepted';
  booking_id?: string;
  vendor?: TrackingVendorSummary | null;
  items?: TrackingLeadItem[];
}

export interface LocationUpdateEvent {
  type: 'location_update';
  latitude?: number;
  longitude?: number;
  vendor?: TrackingVendorSummary | null;
  booking_status?: string | null;
  timestamp?: string;
}

export interface OrderCancelledEvent {
  type: 'order_cancelled';
  order_id?: number;
  order_number?: string;
  cancelled_by?: 'user' | 'admin' | string;
  booking_id?: string | null;
  lead_id?: string | null;
}

export interface BookingStatusEvent extends TrackingCompletionSummary {
  type: 'booking_status';
  booking_id?: string;
  status?: string | null;
  booking_status?: string | null;
}

export function normalizeTrackingStep(status?: string | null): TrackingStep {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'completed') return 'completed';
  if (normalized === 'ready') return 'ready';
  if (normalized === 'in_progress' || normalized === 'collecting') return 'collecting';
  if (normalized === 'arrived') return 'arrived';
  return 'en_route';
}

export function formatTrackingDistance(distanceKm?: number | null): string {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return 'Estimating distance';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

export function estimateEtaMinutes(distanceKm?: number | null): number | null {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return null;
  }

  const averageUrbanKmPerMinute = 0.35;
  return Math.max(2, Math.round(distanceKm / averageUrbanKmPerMinute));
}
