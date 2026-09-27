# Pickup-search screen handoff

## Context

The customer post-booking search screen was redesigned to match the supplied reference: a map-led upper section, animated pickup-location waves, and a scrollable white lower sheet. The old nearby-agent/vendor cards were removed from this screen so the customer sees the request lifecycle rather than internal dispatch candidates.

## Implemented

- Added a continuous radar-wave animation around the pickup marker while the order is searching.
- Added the `person1.png` partner artwork to the lower hero section.
- Added the three-stage timeline: Finding partner, Partner on the way, and Pickup in progress.
- Added the close-the-app notification note and a formatted bottom-sheet Request Details modal.
- The details modal shows order date, order time, estimated value, items, pickup address, and mobile number.
- Added a client REST refresh every two minutes. The existing WebSocket remains the faster real-time path when connected.
- Added order details to the tracking REST response so the modal uses server data.
- Added a customer push notification after vendor acceptance:
  `Kailash has accepted your booking and will reach you soon.`
- The push includes order and booking deep-link metadata and targets the client push-token partition.
- Made the tracking page reachable from Profile → My Orders and the individual order details screen with a clear `View Live Order` action.
- Added a `Your live order` card immediately below the home schedule-pickup banner. It surfaces the first active pickup, its current status, and opens the same tracking route.
- Centralized live-order status handling so operational states such as `Order Received`, `Assigned`, `Finding Partner`, and `Partner Assigned` remain trackable; only terminal states are excluded.
- Home now refreshes orders when it regains focus, and order loading is independent from the optional profile request.
- Added a visible fallback card on Home even when the live-order payload is temporarily unavailable, linking to My Orders instead of silently rendering nothing.
- Order details now recognizes received/assigned operational statuses and exposes `Open Live Tracking` for every non-terminal order.

## Impacted files

- `client/src/app/tracking/[orderId]/search.tsx`
- `client/src/context/OrderTrackingContext.tsx`
- `client/src/types/orderTracking.ts`
- `client/assets/images/person1.png` (existing asset reused)
- `server/booking/views.py`
- `server/lead/services.py`
- `server/notifications/tasks.py`
- `client/src/app/(tabs)/home.tsx`
- `client/src/app/profile/orders/index.tsx`
- `client/src/app/profile/orders/[id].tsx`
- `client/src/utils/orderStatus.ts`
- `client/src/hooks/useHomeDataWithRetry.ts`

## What will not break

- Existing order creation, vendor lead acceptance, booking creation, WebSocket events, accepted/en-route screens, cancellation, and completion flows remain intact.
- The map provider and existing tracking map implementation are reused.
- Vendor-facing lead notifications and losing-vendor notifications are unchanged.
- Completed, cancelled, and other inactive orders do not appear in the home live-order card; they remain available in My Orders.

## Operational requirement

Deploy the server changes and restart the Celery worker so `notify_customer_booking_accepted` is registered. The client tracking screen will continue to work with WebSocket updates and falls back to the two-minute REST refresh when the socket is unavailable.

## Known behavior

The current order creation flow does not persist the customer-selected pickup date/time as separate server fields. The details modal therefore displays the authoritative order creation date/time and the server-provided pickup/order information. Persisting the selected pickup schedule would require a separate order schema/API change.
