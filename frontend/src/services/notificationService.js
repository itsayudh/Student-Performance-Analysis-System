import api from "./api";

// GET /api/v1/notifications/{student_id}
// Returns: { student_id, total, unresolved_count, notifications: [
//   { id, notification_type, severity, message, is_resolved, created_at }
// ] }
// severity is one of LOW/MEDIUM/HIGH/CRITICAL — same shape as risk_level,
// so RiskBadge can be reused here if you map severity -> level.
//
// unresolvedOnly=true filters server-side to only unresolved alerts —
// use this on EarlyWarningPage so the teacher isn't scrolling through
// history that's already been handled.
export const getStudentNotifications = (studentId, unresolvedOnly = false) => {
  return api.get(`/api/v1/notifications/${studentId}`, {
    params: { unresolved_only: unresolvedOnly || undefined },
  });
};

// PATCH /api/v1/notifications/{student_id}/{notification_id}
// Marks one notification as resolved. Backend restricts this to
// ADMIN and TEACHER roles only (students can't resolve their own
// early-warning alerts — that's intentional, not a bug to "fix" later).
export const resolveNotification = (studentId, notificationId) => {
  return api.patch(`/api/v1/notifications/${studentId}/${notificationId}`);
};