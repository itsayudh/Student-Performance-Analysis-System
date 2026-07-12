import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import { useMarks } from "../../hooks/useMarks";
import { useAuthContext } from "../../contexts/AuthContext";
import { formatPercentage, gradeColor } from "../../utils/formatters";

// Student portal — My Marks: per-subject cards with every assessment.
//
// Data: useMarks hook → GET /marks/student/{id} → the same
// MarksSubjectBreakdown the teacher pages consume, but rendered for a
// different audience: the student wants ITEM-LEVEL detail (each quiz,
// what's still missing), not summary rows.
export default function MyMarksPage() {
  const { user } = useAuthContext();
  const studentId = user?.student_id; // filled by the login enrichment

  const { marks, loading, error } = useMarks(studentId);

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
    return <Alert severity="error">Could not load your marks. Please try again later.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Marks
      </Typography>

      {marks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No marks recorded yet.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {marks.map((m) => (
            <Grid item xs={12} md={6} key={m.subject_id}>
              <Box sx={cardSx}>
                {/* Subject header: name + overall standing */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="subtitle1">
                    {m.subject_name || m.subject_code}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${m.current_grade} · ${formatPercentage(m.current_percentage)}`}
                    sx={{
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: gradeColor(m.current_grade),
                    }}
                  />
                </Box>

                {/* Item-level rows. quiz/assignment are arrays; midterm/
                    final are single-or-null — "Not yet recorded" is shown
                    for nulls so the student knows what's PENDING, not
                    just what exists (the null-final path we seeded). */}
                <AssessmentRow label="Quizzes" items={m.quiz} />
                <AssessmentRow label="Assignments" items={m.assignment} />
                <AssessmentRow label="Midterm" items={m.midterm ? [m.midterm] : null} />
                <AssessmentRow label="Final" items={m.final ? [m.final] : null} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// One labeled row: "Quizzes   8/10 · 7/10". items === null → pending;
// items === [] → none recorded for an array type.
function AssessmentRow({ label, items }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6, borderTop: "1px solid #F0F1F3" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {items === null || items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#9AA0AB", fontStyle: "italic" }}>
          Not yet recorded
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {items.map((i) => `${i.score}/${i.max_score}`).join(" · ")}
        </Typography>
      )}
    </Box>
  );
}

const cardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
};