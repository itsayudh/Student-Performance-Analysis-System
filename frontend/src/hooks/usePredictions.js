import { useState, useEffect, useCallback } from "react";
import { runPrediction, getStudentPredictions, getLatestPrediction } from "../services/predictionService";

// Fetches the LATEST prediction for a student and keeps loading/error state.
// Use this on dashboards/cards that just need to show "where does this
// student currently stand" — e.g. StudentDashboard, PredictionCard usage.
//
// Usage: const { prediction, loading, error, refetch } = useLatestPrediction(studentId);
export function useLatestPrediction(studentId) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    getLatestPrediction(studentId)
      .then((res) => setPrediction(res.data))
      .catch((err) => {
        // A 404 here means "no predictions exist yet" — not a real error,
        // just an empty state. Treat it as prediction = null, not a crash.
        if (err.response && err.response.status === 404) {
          setPrediction(null);
        } else {
          setError(err);
        }
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return { prediction, loading, error, refetch: fetchLatest };
}

// Fetches the FULL prediction HISTORY for a student.
// Use this where multiple past predictions need to be shown,
// e.g. a "prediction history" table or trend over time.
//
// Usage: const { predictions, total, loading, error, refetch } = usePredictionHistory(studentId);
export function usePredictionHistory(studentId) {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    getStudentPredictions(studentId)
      .then((res) => {
        setPredictions(res.data.predictions);
        setTotal(res.data.total);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { predictions, total, loading, error, refetch: fetchHistory };
}

// Runs a NEW prediction (POST /predict) — this is an ACTION, not a
// fetch-on-mount hook like the two above. The component calls
// `submit(data)` manually, usually from a button click or form submit.
//
// Usage:
//   const { submit, result, submitting, error } = useRunPrediction();
//   <button onClick={() => submit({ student_id, attendance_percentage, ... })}>Predict</button>
export function useRunPrediction() {
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback((data) => {
    setSubmitting(true);
    setError(null);

    return runPrediction(data)
      .then((res) => {
        setResult(res.data);
        return res.data;
      })
      .catch((err) => {
        setError(err);
        throw err; // re-throw so the caller's form can also react if needed
      })
      .finally(() => setSubmitting(false));
  }, []);

  return { submit, result, submitting, error };
}