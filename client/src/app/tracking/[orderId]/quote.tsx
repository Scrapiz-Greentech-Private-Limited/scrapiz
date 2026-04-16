import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, CreditCard, IndianRupee, Smartphone } from 'lucide-react-native';
import { AuthService, BookingQuoteSummary } from '../../../api/apiService';
import { useTheme } from '../../../context/ThemeContext';

type PaymentMode = 'cash' | 'upi' | 'card';

const formatAmount = (value: number) => `₹${Number(value || 0).toFixed(2)}`;

export default function QuoteDecisionScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors, isDark } = useTheme();

  const parsedOrderId = Number(orderId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<BookingQuoteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [upiId, setUpiId] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const canRespond = useMemo(() => {
    if (!quote) {
      return false;
    }

    return ['submitted', 'awaiting_payment'].includes((quote.status || '').toLowerCase());
  }, [quote]);

  const loadQuote = useCallback(async () => {
    if (!Number.isFinite(parsedOrderId)) {
      setError('Invalid order id');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.getOrderQuote(parsedOrderId);
      setQuote(response.quote);
      if (response.quote?.customer_upi_id) {
        setUpiId(response.quote.customer_upi_id);
      }
      setTransactionId(response.quote?.upi_reference || `TXN-${Date.now()}`);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load quote details');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [parsedOrderId]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const handleReject = async () => {
    if (!quote || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await AuthService.respondOrderQuote(parsedOrderId, { action: 'reject' });
      await loadQuote();
      Alert.alert('Quote rejected', 'You can request a new pickup quote from support.');
    } catch (rejectError: any) {
      Alert.alert('Unable to reject quote', rejectError.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!quote || submitting) return;

    if (paymentMode === 'upi' && (!upiId || !upiId.includes('@'))) {
      Alert.alert('Invalid UPI ID', 'Enter a valid UPI ID like name@bank.');
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMode === 'cash') {
        // Cash path — no gateway
        await AuthService.respondOrderQuote(parsedOrderId, {
          action: 'accept',
          payment_method: 'cash',
        });
        setTransactionId(`CASH-${Date.now()}`);
        setShowSuccess(true);
        await loadQuote();
        return;
      }

      // Card or UPI — go through Razorpay gateway
      const orderData = await AuthService.createQuoteRazorpayOrder(parsedOrderId);
      const RazorpayCheckout = (await import('react-native-razorpay')).default;

      const options = {
        description: `Scrapiz Quote #${parsedOrderId}`,
        image: 'https://scrapiz.in/logo.png',
        currency: orderData.currency,
        key: orderData.key_id,
        amount: String(orderData.amount),
        order_id: orderData.razorpay_order_id,
        name: 'Scrapiz',
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email ?? '',
          contact: orderData.prefill.contact ?? '',
        },
        method:
          paymentMode === 'card'
            ? { card: true, upi: false, netbanking: false, wallet: false }
            : { upi: true, card: false, netbanking: false, wallet: false },
        ...(paymentMode === 'upi' && {
          upi: { flow: 'collect', vpa: upiId.trim() },
        }),
        theme: { color: '#ff5b14' },
      };

      const rzpData = await RazorpayCheckout.open(options);
      // rzpData = { razorpay_payment_id, razorpay_order_id, razorpay_signature }

      await AuthService.verifyQuoteRazorpayPayment(parsedOrderId, {
        razorpay_order_id: rzpData.razorpay_order_id,
        razorpay_payment_id: rzpData.razorpay_payment_id,
        razorpay_signature: rzpData.razorpay_signature,
        payment_method: paymentMode as 'card' | 'upi',
      });

      setTransactionId(rzpData.razorpay_payment_id);
      setShowSuccess(true);
      await loadQuote();
    } catch (err: any) {
      // Razorpay SDK throws { code, description } on cancel/failure
      if (err?.code === 0) {
        Alert.alert('Payment cancelled', 'You cancelled the payment.');
      } else {
        Alert.alert(
          'Payment failed',
          err?.description || err?.message || 'Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading quote...</Text>
      </View>
    );
  }

  if (error || !quote) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Quote not available'}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => void loadQuote()}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => router.back()}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.successWrap}>
          <View style={[styles.successCircleOuter, { backgroundColor: isDark ? 'rgba(249,115,22,0.2)' : '#ffe7dc' }]}>
            <View style={[styles.successCircleInner, { backgroundColor: '#ff5b14' }]}>
              <CheckCircle2 size={28} color="#fff" />
            </View>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Payment Successful</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>Quote accepted for {formatAmount(quote.total_amount)}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}> 
          <Row label="Transaction ID" value={transactionId} color={colors.text} />
          <Row label="Date" value={new Date().toLocaleDateString()} color={colors.text} />
          <Row label="Type" value={paymentMode === 'cash' ? 'Cash' : paymentMode === 'card' ? 'Credit/Debit Card' : 'UPI'} color={colors.text} />
          <Row label="Amount" value={formatAmount(quote.total_amount)} color={colors.text} />
          <Row label="Status" value="Success" color="#3d8b2f" />
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#ff5b14' }]} onPress={() => router.replace(`/profile/orders/${parsedOrderId}` as any)}>
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Method</Text>
        <View style={[styles.iconBtn, { backgroundColor: colors.surface }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quote Summary</Text>
          {quote.items.map((item) => (
            <View key={`${item.product_id}`} style={styles.lineItemRow}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {item.actual_weight_kg}kg x {formatAmount(item.quoted_rate_per_kg)}
              </Text>
              <Text style={[styles.itemTotal, { color: colors.text }]}>{formatAmount(item.subtotal)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}> 
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: '#ff5b14' }]}>{formatAmount(quote.total_amount)}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.methodRow}>
            <MethodChip
              title="Cash"
              icon={<IndianRupee size={16} color={paymentMode === 'cash' ? '#fff' : colors.textSecondary} />}
              selected={paymentMode === 'cash'}
              onPress={() => setPaymentMode('cash')}
            />
            <MethodChip
              title="UPI"
              icon={<Smartphone size={16} color={paymentMode === 'upi' ? '#fff' : colors.textSecondary} />}
              selected={paymentMode === 'upi'}
              onPress={() => setPaymentMode('upi')}
            />
            <MethodChip
              title="Card"
              icon={<CreditCard size={16} color={paymentMode === 'card' ? '#fff' : colors.textSecondary} />}
              selected={paymentMode === 'card'}
              onPress={() => setPaymentMode('card')}
            />
          </View>

          {paymentMode === 'cash' && (
            <View style={[styles.noteBox, { backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#e9f9ef' }]}> 
              <Text style={[styles.noteText, { color: colors.text }]}>Pay cash directly to the vendor at pickup completion.</Text>
            </View>
          )}

          {paymentMode === 'upi' && (
            <View style={styles.formWrap}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Your UPI ID</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="name@upi"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>UPI ID is mapped to backend and sent to Razorpay collect flow for payment authorization.</Text>
            </View>
          )}

          {paymentMode === 'card' && (
            <View style={styles.formWrap}>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Card payment is handled in Razorpay Checkout directly. No card number or CVV is collected in-app.</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectButton, { borderColor: '#dc2626' }, (!canRespond || submitting) && styles.disabled]}
            onPress={() => void handleReject()}
            disabled={!canRespond || submitting}
          >
            <Text style={styles.rejectButtonText}>Reject Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: '#ff5b14' }, (!canRespond || submitting) && styles.disabled]}
            onPress={() => void handleAccept()}
            disabled={!canRespond || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptButtonText}>Accept & Continue</Text>}
          </TouchableOpacity>
        </View>

        {!canRespond && (
          <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>Quote status is {quote.status}. This quote is already processed.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function MethodChip({
  title,
  icon,
  selected,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.methodChip, selected ? styles.methodChipSelected : undefined]}>
      {icon}
      <Text style={[styles.methodChipText, selected ? styles.methodChipTextSelected : undefined]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  lineItemRow: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  itemTotal: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  methodChipSelected: {
    borderColor: '#ff5b14',
    backgroundColor: '#ff5b14',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  methodChipTextSelected: {
    color: '#fff',
  },
  formWrap: {
    marginTop: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
  },
  noteBox: {
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  footerInfo: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
  },
  successWrap: {
    alignItems: 'center',
    marginTop: 42,
  },
  successCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  successCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 18,
    marginHorizontal: 16,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 26,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
