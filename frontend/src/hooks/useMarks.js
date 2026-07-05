import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

// Fetches a student's marks, broken down by subject.
// Matches GET /marks/student/{student_id} actual response shape:
// {
//   student_id,
//   marks: [{
//     subject_id, subject_code, subject_name,
//     quiz: [{score, max_score}],
//     assignment: [{score, max_score}],
//     midterm: {score, max_score} | null,
//     final: {score, max_score} | null,
//     current_percentage,
//     current_grade   (9-tier: A+/A/B+/B/C+/C/D+/D/E)
//   }]
// }
export function useMarks(studentId, filters = {}) {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { subjectId, markType } = filters;

  const fetchMarks = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    // Same pattern as useAttendance: calling `api` directly rather than
    // a marksService.js, since that service file belongs to your friend's
    // task list and doesn't exist yet. Update this to import his service
    // function once it's built.
    api
      .get(`/marks/student/${studentId}`, {
        params: {
          subject_id: subjectId || undefined,
          mark_type: markType || undefined,
        },
      })
      .then((res) => setMarks(res.data.marks))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [studentId, subjectId, markType]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  return { marks, loading, error, refetch: fetchMarks };
}