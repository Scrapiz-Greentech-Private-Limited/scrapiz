/**
 * Normalizes the status shapes returned by the inventory API.
 * Status is usually { name }, but older responses may return a string.
 */
export function normalizeOrderStatus(status: any): string {
  const raw = typeof status === 'string'
    ? status
    : status?.name ?? status?.code ?? status?.value ?? 'pending';

  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_') || 'pending';
}

/**
 * An order is live until it reaches a terminal state. This deliberately uses
 * an exclusion list so newly introduced operational statuses still expose
 * tracking instead of silently hiding the entry point.
 */
export function isLiveOrderStatus(status: any): boolean {
  return ![
    'completed',
    'cancelled',
    'canceled',
    'no_vendor',
    'rejected',
    'expired',
  ].includes(normalizeOrderStatus(status));
}

export function getLiveOrderStatusLabel(status: any): string {
  const statusName = normalizeOrderStatus(status);
  const labels: Record<string, string> = {
    pending: 'Finding a partner',
    processed: 'Processed - finding a partner',
    dispatching: 'Processed - finding a partner',
    order_received: 'Order received',
    scheduled: 'Pickup scheduled',
    assigned: 'Partner assigned',
    partner_assigned: 'Partner assigned',
    transit: 'Partner assigned',
    accepted: 'Partner accepted',
    pickup: 'Pickup in progress',
    finding_partner: 'Finding a partner',
    en_route: 'Partner on the way',
    on_the_way: 'Partner on the way',
    arrived: 'Partner has arrived',
    in_progress: 'Pickup in progress',
    pickup_in_progress: 'Pickup in progress',
    ready: 'Pickup in progress',
    paid: 'Payment received',
  };

  return labels[statusName] || 'Pickup request active';
}
