import api from "./api";

// GET /api/v1/recommendations/{student_id}
// Returns: { student_id, total, unread_count, recommendations: [
//   { id, recommendation_type, message, priority, is_read, created_at }
// ] }
// Backend already sorts unread-first, then most-recent-first — no need
// to re-sort on the frontend.
export const getStudentRecommendations = (studentId) => {
  return api.get(`/api/v1/recommendations/${studentId}`);
};

// PATCH /api/v1/recommendations/{student_id}/{recommendation_id}
// Marks a single recommendation as read. Returns the updated
// RecommendationRecord (is_read: true).
// Used by RecommendationCard's onMarkRead callback (see component prop).
export const markRecommendationRead = (studentId, recommendationId) => {
  return api.patch(`/api/v1/recommendations/${studentId}/${recommendationId}`);
};