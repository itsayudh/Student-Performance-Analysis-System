import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import api from "../../services/api";
import { useAuthContext } from "../../contexts/AuthContext";

// Teacher portal — My Classes: the classes this teacher teaches in
// (ClassSubject assignments) or homerooms, via the new
// GET /teachers/{teacher_id}/classes endpoint.
//
// Same seam pattern as the student pages: user.teacher_id comes from
// the login enrichment; absent → friendly notice, not a crash.
export default function MyClassesPage() {
  const { user } = useAuthContext();
  const teacherId = user?.teacher_id;

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    api
      .get(`/teachers/${teacherId}/classes`)
      .then((res) => setClasses(res.data.items))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [teacherId]);

  if (!teacherId) {
    return (
      <Alert severity="warning">
        Your account is not linked to a teacher profile yet. Please contact
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
    return <Alert severity="error">Could not load your classes. Please try again later.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Classes
      </Typography>

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          You have no class assignments yet. An administrator assigns
          subjects and homerooms from the Classes page.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {classes.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Box sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1">{c.class_code}</Typography>
                  {c.is_homeroom && (
                    <Chip size="small" label="Homeroom" color="primary" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {c.class_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.department} · Semester {c.semester} · {c.academic_year}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

const cardSx = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E6EB",
  borderRadius: "12px",
  p: 2.5,
  height: "100%",
};