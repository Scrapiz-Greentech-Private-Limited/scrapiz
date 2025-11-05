
export type DeletionReason =
  | 'better_alternative'
  | 'not_using'
  | 'privacy_concerns'
  | 'too_many_notifications'
  | 'difficult_to_use'
  | 'other';
export interface DeletionFeedback {
  reason: DeletionReason;
  comments?: string;
}

export const DELETION_REASONS: Array<{
  value: DeletionReason;
  label: string;
}> = [
  { value: 'better_alternative', label: 'Found a better alternative' },
  { value: 'not_using', label: 'Not using the service anymore' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'difficult_to_use', label: 'Difficult to use' },
  { value: 'other', label: 'Other' },
];
