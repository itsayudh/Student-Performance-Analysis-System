import { useState, useEffect, useCallback } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import RecommendationCard from "../../components/predictions/RecommendationCard";
import {
  getStudentRecommendations,
  markRecommendationRead,
} from "../../services/recommendationService";
import { useAuthContext } from "../../contexts/AuthContext";
import { PageHeader } from "../../components/gridline";

// Student portal — Recommendations page.
//
// DATA FLOW (end to end):
//   1. Prediction runs on the backend (POST /api/v1/predictions/predict)
//   2. prediction_service.py automatically calls
//      recommendation_service.generate_and_save_recommendations()
//      → rows land in the `recommendations` table
//   3. This page calls GET /api/v1/recommendations/{student_id}
//      via recommendationService.js → api.js (token auto-attached)
//   4. Backend returns { student_id, total, unread_count, recommendations[] }
//      already sorted: unread first, then most recent first —
//      so we render in the order received, no client-side sorting.
//   5. "Mark as read" → PATCH → backend flips is_read → we update
//      local state instead of refetching (see handleMarkRead).
export default function RecommendationsPage() {
  const { user } = useAuthContext();

  // ── INTEGRATION SEAM (discussed, pending conclusion with Roshan) ──
  // The login response's user object currently has users.id, NOT
  // students.id. Endpoints below need students.id. Planned fix:
  // backend enriches login response with student_id for STUDENT role,
  // AuthContext stores it. Until then this line yields undefined and
  // the page shows its "account not linked" state instead of crashing.
  const studentId = user?.student_id;

  const [recommendations, setRecommendations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    getStudentRecommendations(studentId)
      .then((res) => {
        setRecommendations(res.data.recommendations);
        setUnreadCount(res.data.unread_count);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Mark-as-read: PATCH the backend, then update ONLY the affected item
  // in local state rather than refetching the whole list. Two reasons:
  //   1. Instant UI feedback (the card fades via its is_read prop)
  //   2. Refetching would re-sort read items to the bottom mid-view,
  //      making the list jump around under the user's cursor.
  const handleMarkRead = (recommendationId) => {
    markRecommendationRead(studentId, recommendationId)
      .then(() => {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recommendationId ? { ...r, is_read: true } : r
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch((err) => setError(err));
  };

  // ── Render states, in priority order ──────────────────────────────
  if (!studentId) {
    return (
      <Alert severity="warning">
        Your account is not linked to a student profile yet. Please contact
        your administrator.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Could not load recommendations. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Recommendations"
        action={
          unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} color="secondary" size="small" />
          )
        }
      />

      {recommendations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recommendations yet. Recommendations are generated automatically
          whenever a new performance prediction is run for you.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 720 }}>
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onMarkRead={handleMarkRead}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}