/** Labels for how complete the data behind a risk score is. */
export const DATA_STATUS_LABELS = {
  COMPLETE: 'Complete data',
  PROVISIONAL: 'Provisional',
  INSUFFICIENT_DATA: 'Insufficient data',
};

export const RISK_REVIEW_FILTERS = [
  { value: 'needs', label: 'Awaiting review' },
  { value: 'reviewed', label: 'Reviewed' },
];
