/**
 * Rating Type Definitions
 * 
 * This file contains TypeScript interfaces for the order rating and feedback system,
 * including rating tags, pending orders, and rating submission data.
 */

/**
 * RatingTag enum
 * Predefined feedback tags that users can select when rating an order
 */
export type RatingTag = 
  | 'POLITE'
  | 'ON_TIME'
  | 'ACCURATE_WEIGHT'
  | 'GOOD_PRICE'
  | 'PROFESSIONAL'
  | 'NEEDS_IMPROVEMENT';

/**
 * PendingOrder interface
 * Represents a completed order that is eligible for rating
 */
export interface PendingOrder {
  order_id: number;
  order_number: string;
  agent_id: number;
  agent_name: string;
  completed_at: string;
}

/**
 * RatingCheck interface
 * Response from checking if an order has been rated
 */
export interface RatingCheck {
  is_rated: boolean;
  agent_name: string;
}

/**
 * RatingSubmission interface
 * Payload for submitting a new order rating
 */
export interface RatingSubmission {
  order_id: number;
  rating: number;
  tags?: RatingTag[];
  feedback?: string;
}

/**
 * RatingResponse interface
 * Response from successful rating submission
 */
export interface RatingResponse {
  success: boolean;
  message: string;
  rating_id: number;
}

/**
 * PendingRatingsResponse interface
 * Response from fetching pending orders eligible for rating
 */
export interface PendingRatingsResponse {
  success: boolean;
  pending_orders: PendingOrder[];
}

/**
 * RatingCheckResponse interface
 * Full response from checking order rating status
 */
export interface RatingCheckResponse {
  success: boolean;
  is_rated: boolean;
  agent_name: string;
}
