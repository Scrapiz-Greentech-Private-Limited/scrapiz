import { useState, useCallback } from 'react';
import { FeedbackService } from '../api/apiService';

interface UseFeedbackOptions {
  context?: string;
  onSubmitSuccess?: () => void;
}

interface UseFeedbackReturn {
  showFeedbackModal: boolean;
  orderId: number | null;
  openFeedback: (orderId?: number | null) => void;
  closeFeedback: () => void;
  checkAndShowFeedback: (orderId: number) => Promise<boolean>;
}

/**
 * Hook for managing feedback modal state and logic.
 * Can be used across different screens to collect feedback.
 * 
 * @example
 * const { showFeedbackModal, orderId, openFeedback, closeFeedback } = useFeedback();
 * 
 * // After order completion
 * openFeedback(orderId);
 * 
 * // In render
 * <FeedbackModal
 *   visible={showFeedbackModal}
 *   onClose={closeFeedback}
 *   orderId={orderId}
 * />
 */
export function useFeedback(options: UseFeedbackOptions = {}): UseFeedbackReturn {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const openFeedback = useCallback((newOrderId?: number | null) => {
    setOrderId(newOrderId ?? null);
    setShowFeedbackModal(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setShowFeedbackModal(false);
    // Delay clearing orderId to allow modal animation to complete
    setTimeout(() => {
      setOrderId(null);
    }, 300);
    options.onSubmitSuccess?.();
  }, [options.onSubmitSuccess]);

  /**
   * Check if feedback has already been submitted for an order.
   * If not, show the feedback modal.
   * @returns true if feedback modal was shown, false if already submitted
   */
  const checkAndShowFeedback = useCallback(async (checkOrderId: number): Promise<boolean> => {
    try {
      const hasSubmitted = await FeedbackService.checkFeedbackStatus(checkOrderId);
      if (!hasSubmitted) {
        openFeedback(checkOrderId);
        return true;
      }
      return false;
    } catch (error) {
      // On error, show feedback anyway (better to ask than miss feedback)
      openFeedback(checkOrderId);
      return true;
    }
  }, [openFeedback]);

  return {
    showFeedbackModal,
    orderId,
    openFeedback,
    closeFeedback,
    checkAndShowFeedback,
  };
}

export default useFeedback;
