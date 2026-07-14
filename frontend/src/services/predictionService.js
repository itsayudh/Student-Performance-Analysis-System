import api from "./api";

// POST /api/v1/predictions/predict
// Runs the ML model for a student and returns the prediction result.
// `data` must match the PredictionInput schema you built in FastAPI:
// student_id, subject_id, attendance_percentage, midterm_score,
// historical_gpa, study_hours_per_week, subject_difficulty_score,
// quiz_score_avg, assignment_score_avg
export const runPrediction = (data) => {
  return api.post("/api/v1/predictions/predict", data);
};

// GET /api/v1/predictions/{student_id}
// Returns the full prediction history for a student (every past run).
export const getStudentPredictions = (studentId) => {
  return api.get(`/api/v1/predictions/${studentId}`);
};

// GET /api/v1/predictions/{student_id}/latest
// Returns only the most recent prediction for a student.
export const getLatestPrediction = (studentId) => {
  return api.get(`/api/v1/predictions/${studentId}/latest`);
};

// GET /api/v1/predictions/{student_id}/autofill — 5 of 7 fields computed
// from real attendance/marks/GPA records. The other 2 keys come back
// null (no DB source) — the caller must treat null as "leave blank."
export const getPredictionAutofill = (studentId, subjectId) => {
  return api.get(`/api/v1/predictions/${studentId}/autofill`, {
    params: { subject_id: subjectId || undefined },
  });
};