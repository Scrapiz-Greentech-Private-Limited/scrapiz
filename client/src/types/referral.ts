/**
 * Referral Type Definitions
 * 
 * This file contains TypeScript interfaces for the referral system,
 * including user referral data, referred users, transactions, and statistics.
 */

/**
 * ReferralData interface
 * Represents the core referral information for a user from the backend
 */
export interface ReferralData {
  referral_code: string;
  referral_balance: string; // Decimal as string from backend
  has_completed_first_order: boolean;
}

/**
 * ReferredUser interface
 * Represents a user who signed up using the current user's referral code
 */
export interface ReferredUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  has_completed_first_order: boolean;
  earned_amount: number; // Amount earned from this referral
}

/**
 * ReferralTransaction interface
 * Represents a single transaction in the referral system
 * (earnings from referrals or redemptions on orders)
 */
export interface ReferralTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'pending';
  amount: number;
  description: string;
  date: string;
  related_user?: string; // Name of referred user (for earned transactions)
  order_id?: string; // Order ID (for redeemed transactions)
}

/**
 * ReferralStats interface
 * Represents calculated statistics about a user's referral performance
 */
export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_earned: number;
  total_redeemed: number;
  available_balance: number;
  pending_balance: number;
}
