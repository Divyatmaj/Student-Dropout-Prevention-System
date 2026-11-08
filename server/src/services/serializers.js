/** API shapes shared by several services. */

/** Current risk assessment row → API shape (matches the web app's mock store). */
export function toRiskAssessment(r) {
  if (!r) return null;
  return {
    studentId: r.studentId,
    score: r.score,
    category: r.category,
    dataStatus: r.dataStatus,
    dataGaps: r.dataGaps ?? [],
    reasons: r.reasons ?? [],
    indicators: r.indicators ?? {},
    humanReviewRequired: r.humanReviewRequired,
    calculatedAt: r.calculatedAt,
    changedAt: r.changedAt,
    reviewedAt: r.reviewedAt,
    reviewedById: r.reviewedById,
    reviewedByName: r.reviewedBy?.name ?? null,
    reviewNote: r.reviewNote,
  };
}
