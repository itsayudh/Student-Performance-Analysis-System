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