// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import ClassIcon from "@mui/icons-material/Class";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GradeIcon from "@mui/icons-material/Grade";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import AlertBanner from "../../components/common/AlertBanner";
import BarChart from "../../components/charts/BarChart";
import { getAdminDashboard } from "../../services/analyticsService";
import { parseApiError } from "../../utils/apiError";
import { useAuthContext } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // NOTE: Ayudh's service functions return the raw axios response,
    // so we unwrap .data here (unlike our own services, which unwrap
    // inside the service). Style seam — flagged for team convention.
    getAdminDashboard()
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title={`Welcome${user?.full_name ? `, ${user.full_name}` : ""}`}
        //subtitle="Institution overview at a glance"
      />

      <AlertBanner
        severity="error"
        title={error?.title}
        message={error?.messages}
        show={!!error}
      />

      {/* ---- Stat tiles ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Students"
            value={stats?.total_students}
            icon={<GroupsIcon />}
            loading={isLoading}
            useTicker
            format={(n) => Math.round(n)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Teachers"
            value={stats?.total_teachers}
            icon={<SchoolIcon />}
            color="secondary"
            loading={isLoading}
            useTicker
            format={(n) => Math.round(n)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Classes"
            value={stats?.total_classes}
            icon={<ClassIcon />}
            color="info"
            loading={isLoading}
            useTicker
            format={(n) => Math.round(n)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Avg GPA"
            value={stats?.overall_gpa_avg}
            icon={<GradeIcon />}
            color="success"
            loading={isLoading}
            useTicker
            format={(n) => n.toFixed(2)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Attendance"
            value={stats?.overall_attendance_rate}
            icon={<EventAvailableIcon />}
            color="success"
            loading={isLoading}
            useTicker
            format={(n) => `${Math.round(n)}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="At-Risk Students"
            value={stats?.at_risk_students}
            icon={<WarningAmberIcon />}
            color="error"
            loading={isLoading}
            useTicker
            format={(n) => Math.round(n)}
          />
        </Grid>
      </Grid>

      {/* ---- Department performance chart ---- */}
      {!isLoading && stats?.department_performance?.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Average GPA by Department
          </Typography>
          <BarChart
            data={stats.department_performance.map((d) => ({
              name: d.department,
              value: d.avg_gpa,
            }))}
            xKey="name"
            yKey="value"
            height={300}
          />
          <Typography variant="caption" color="text.secondary">
            Based on{" "}
            {stats.department_performance.reduce(
              (n, d) => n + (d.student_count || 0),
              0,
            )}{" "}
            students across {stats.department_performance.length} departments
          </Typography>
        </Paper>
      )}

      <Box sx={{ height: 24 }} />
    </>
  );
}
