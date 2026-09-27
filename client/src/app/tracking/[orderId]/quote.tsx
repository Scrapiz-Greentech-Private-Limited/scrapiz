import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, IndianRupee, Smartphone } from 'lucide-react-native';
import { AuthService, BookingQuoteSummary } from '../../../api/apiService';
import { useTheme } from '../../../context/ThemeContext';

const formatAmount = (value: number) => `₹${Number(value || 0).toFixed(2)}`;

// ─────────────────────────────────────────────────────────────────────────
// QuoteDecisionScreen — NEW FLOW
// Vendor controls payment method. Customer only provides UPI VPA if required.
// Payment method is READ from the quote (preferred_payment_method field).
// ─────────────────────────────────────────────────────────────────────────

export default function QuoteDecisionScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors, isDark } = useTheme();

  const parsedOrderId = Number(orderId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<BookingQuoteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UPI details (only shown when vendor chose UPI)
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [saveUpi, setSaveUpi] = useState(false);
  const [savedUpiPrefilled, setSavedUpiPrefilled] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentTransactionData, setPaymentTransactionData] = useState<any>(null);

  // Vendor’s preferred payment method (from quote)
  const vendorPreferredMethod = useMemo(() => {
    return quote?.preferred_payment_method || quote?.payment_method || null;
  }, [quote]);

  const requiresUpi = vendorPreferredMethod === 'upi';

  const canRespond = useMemo(() => {
    if (!quote) return false;
    return (quote.status || '').toLowerCase() === 'submitted';
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

      // Pre-fill UPI from quote (if customer already provided it)
      if (response.quote?.customer_upi_id) {
        setUpiId(response.quote.customer_upi_id);
      }
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load quote details');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [parsedOrderId]);

  // Load saved UPI profile on mount
  useEffect(() => {
    const loadSavedUpi = async () => {
      try {
        const profile = await AuthService.getUpiProfile();
        if (profile.has_saved_upi && !upiId) {
          setUpiId(profile.default_upi_vpa);
          setUpiName(profile.default_upi_name || '');
          setSavedUpiPrefilled(true);
        }
      } catch {
        // non-fatal
      }
    };
    void loadSavedUpi();
  }, []);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const handleReject = async () => {
    if (!quote || submitting) return;
    setSubmitting(true);
    try {
      await AuthService.respondOrderQuoteV2(parsedOrderId, { action: 'reject' });
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

    // If vendor chose UPI, validate UPI ID
    if (requiresUpi && (!upiId || !upiId.includes('@'))) {
      Alert.alert('UPI ID required', 'Enter a valid UPI ID like name@bank to receive your payout.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await AuthService.respondOrderQuoteV2(parsedOrderId, {
        action: 'accept',
        ...(requiresUpi ? {
          customer_upi_vpa: upiId.trim(),
          customer_upi_name: upiName.trim(),
          save_upi_details: saveUpi,
        } : {}),
      });

      const ptData = result?.payment_transaction ?? null;
      setPaymentTransactionData(ptData);

      if (requiresUpi) {
        setSuccessMessage(
          'Your UPI ID has been shared with the vendor. They will scan your QR or transfer directly. ' +
          'Once they submit the payment reference, you can confirm receipt.'
        );
      } else {
        setSuccessMessage(
          'Vendor will pay you in cash. You can confirm once they hand over the amount.'
        );
      }

      setShowSuccess(true);
      await loadQuote();
    } catch (err: any) {
      Alert.alert('Unable to accept quote', err?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Success state ─────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successWrap}>
          <View style={[styles.successCircleOuter, { backgroundColor: isDark ? 'rgba(249,115,22,0.2)' : '#ffe7dc' }]}>
            <View style={[styles.successCircleInner, { backgroundColor: '#ff5b14' }]}>
              <CheckCircle2 size={28} color="#fff" />
            </View>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Quote Accepted!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Payout: {formatAmount(quote.total_amount)}
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {successMessage}
          </Text>
        </View>

        {/* Payment method indicator */}
        <View style={[styles.statusInfoCard, { backgroundColor: isDark ? 'rgba(251,146,60,0.18)' : '#fff2e6' }]}>
          <Text style={[styles.statusInfoTitle, { color: colors.text }]}>
            {requiresUpi ? 'UPI Payout Details' : 'Cash Payout'}
          </Text>
          {requiresUpi && (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>UPI: {upiId.trim()}</Text>
            </View>
          )}
          {!requiresUpi && (
            <Text style={[styles.statusInfoText, { color: colors.textSecondary }]}>
              Vendor will hand over cash directly. Confirm once received.
            </Text>
          )}
        </View>

        {/* Next step guidance */}
        {paymentTransactionData && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Row label="Amount" value={formatAmount(quote.total_amount)} color={colors.text} />
            <Row label="Method" value={requiresUpi ? 'UPI' : 'Cash'} color={colors.text} />
            <Row label="Status" value="Waiting for vendor to pay" color="#d97706" />
          </View>
        )}

        {/* Navigate to payment confirmation screen */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#ff5b14', marginHorizontal: 16 }]}
          onPress={() => router.replace(`/tracking/${parsedOrderId}/payment` as any)}
        >
          <Text style={styles.primaryButtonText}>Track Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border, marginHorizontal: 16 }]}
          onPress={() => router.replace(`/profile/orders/${parsedOrderId}` as any)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back to Order</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main quote decision screen ───────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm Payout</Text>
        <View style={[styles.iconBtn, { backgroundColor: colors.surface }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Quote items */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quote Summary</Text>
          {quote.items.map((item) => (
            <View key={`${item.product_id}`} style={styles.lineItemRow}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {item.actual_weight_kg}kg × {formatAmount(item.quoted_rate_per_kg)}
              </Text>
              <Text style={[styles.itemTotal, { color: colors.text }]}>{formatAmount(item.subtotal)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Payout</Text>
            <Text style={[styles.totalValue, { color: '#ff5b14' }]}>{formatAmount(quote.total_amount)}</Text>
          </View>
        </View>

        {/* Payment method (vendor-controlled, read-only to customer) */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>

          {vendorPreferredMethod ? (
            <View style={[styles.methodBadgeRow]}>
              <View style={[styles.methodBadge, { backgroundColor: requiresUpi ? '#e8f4fd' : '#e8fdf1' }]}>
                {requiresUpi
                  ? <Smartphone size={16} color="#0369a1" />
                  : <IndianRupee size={16} color="#166534" />}
                <Text style={[styles.methodBadgeText, { color: requiresUpi ? '#0369a1' : '#166534' }]}>
                  {requiresUpi ? 'UPI Transfer' : 'Cash'}
                </Text>
              </View>
              <Text style={[styles.methodNote, { color: colors.textSecondary }]}>
                Vendor will pay you via {requiresUpi ? 'UPI' : 'cash'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.methodNote, { color: colors.textSecondary }]}>
              Payment method will be set by vendor.
            </Text>
          )}

          {/* UPI ID input — only shown when vendor chose UPI */}
          {requiresUpi && (
            <View style={styles.formWrap}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Your UPI ID (to receive payout)</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. yourname@oksbi"
                autoCapitalize="none"
                autoCorrect={false}
                editable={canRespond && !submitting}
                keyboardType={Platform.OS === 'ios' ? 'email-address' : 'default'}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => undefined}
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={upiName}
                onChangeText={setUpiName}
                placeholder="Your name on UPI (optional)"
                autoCapitalize="words"
                autoCorrect={false}
                editable={canRespond && !submitting}
                returnKeyType="done"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: 8 }]}
              />
              {savedUpiPrefilled && (
                <Text style={[styles.helperText, { color: '#059669' }]}>
                  ✓ Pre-filled from your saved UPI profile
                </Text>
              )}
              <TouchableOpacity
                style={styles.saveToggleRow}
                onPress={() => setSaveUpi((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, saveUpi && styles.checkboxChecked]}>
                  {saveUpi && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Save UPI ID for future pickups
                </Text>
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Your UPI ID will be shared with the vendor to process the payout.
                You will confirm receipt after they complete the transfer.
              </Text>
            </View>
          )}

          {/* Cash guidance */}
          {!requiresUpi && vendorPreferredMethod === 'cash' && (
            <View style={[styles.noteBox, { backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#e9f9ef' }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                Vendor will hand you cash before leaving. After accepting you’ll be able to confirm receipt.
              </Text>
            </View>
          )}

          {/* Already awaiting payment */}
          {(quote.status || '').toLowerCase() === 'awaiting_payment' && (
            <View style={[styles.noteBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.2)' : '#fff2e6' }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                You’ve already accepted this quote. Waiting for vendor to complete payment.
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
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
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.acceptButtonText}>
                  {requiresUpi ? 'Accept & Share UPI' : 'Accept Cash Payout'}
                </Text>}
          </TouchableOpacity>
        </View>

        {!canRespond && (
          <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>
            Quote status: {quote.status}. Already processed.
          </Text>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    flex: 1,
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
  // ── Payment method badge (vendor-selected, read-only) ──────────────────────
  methodBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  methodBadgeText: {
    fontWeight: '700',
    fontSize: 13,
  },
  methodNote: {
    fontSize: 12,
    flex: 1,
  },
  // ── Legacy chip (kept for compatibility, unused in new flow) ──────────────
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
    marginBottom: 4,
    fontSize: 14,
  },
  saveToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ff5b14',
    borderColor: '#ff5b14',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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
  // ── Success screen ─────────────────────────────────────────────────────
  successWrap: {
    alignItems: 'center',
    marginTop: 42,
    paddingHorizontal: 24,
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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  statusInfoCard: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
  },
  statusInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusInfoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#ff8a3d',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
