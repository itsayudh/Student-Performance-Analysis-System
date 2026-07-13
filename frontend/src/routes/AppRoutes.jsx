// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import StudentsPage from "../pages/admin/StudentsPage";
import AddStudentPage from "../pages/admin/AddStudentPage";
import StudentDetailPage from "../pages/admin/StudentDetailPage";
import TeachersPage from "../pages/admin/TeachersPage";
import TeacherDetailPage from "../pages/admin/TeacherDetailPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AddTeacherPage from "../pages/admin/AddTeacherPage";





// added by ayudh
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import PredictionsPage from "../pages/admin/PredictionsPage";
import StudentPerformancePage from "../pages/teacher/StudentPerformancePage";
import EarlyWarningPage from "../pages/teacher/EarlyWarningPage";
import MyPerformancePage from "../pages/student/MyPerformancePage";
import RecommendationsPage from "../pages/student/RecommendationsPage";
import MarksPage from "../pages/teacher/MarksPage";
import MyMarksPage from "../pages/student/MyMarksPage";
import AttendancePage from "../pages/teacher/AttendancePage";
import MyAttendancePage from "../pages/student/MyAttendancePage";
import MyClassesPage from "../pages/teacher/MyClassesPage";
import ClassesPage from "../pages/admin/ClassesPage";
import ReportsPage from "../pages/admin/ReportsPage";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import StudentDashboard from "../pages/student/StudentDashboard";
import { login as apiLogin } from "../services/authService";

// TODO: replace each placeholder below with the real page import once built
function Placeholder({ label }) {
  return <h2>{label} — page not built yet</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Public routes (wrapped in AuthLayout) ---------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ---------- Authenticated routes ---------- */}
      <Route element={<ProtectedRoute />}>
        {/* Admin portal */}
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentsPage />} />;
            <Route path="/admin/students/add" element={<AddStudentPage />} />
            <Route path="/admin/students/:id" element={<StudentDetailPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/teachers/:id" element={<TeacherDetailPage />} />
            <Route path="/admin/teachers/add" element={<AddTeacherPage />} />
            <Route
              path="/admin/classes"
              element={<ClassesPage />}  
            />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/predictions" element={<PredictionsPage />} />
            <Route
              path="/admin/reports"
              element={<ReportsPage />}  //change here
            />
          </Route>
        </Route>

        {/* Teacher portal */}
        <Route element={<RoleRoute allowedRoles={["TEACHER"]} />}>
          <Route element={<TeacherLayout />}>
            <Route
              path="/teacher/dashboard"
              element={<TeacherDashboard />}  //change here
            />
            <Route
              path="/teacher/classes"
              element={<MyClassesPage />}  //change here
            />
            <Route
              path="/teacher/attendance"
              element={<AttendancePage />}  //change here
            />
            <Route
              path="/teacher/marks"
              element={<MarksPage />}  //change here
            />
            <Route
              path="/teacher/performance"
              element={<StudentPerformancePage />}
            />
            <Route
              path="/teacher/early-warning"
              element={<EarlyWarningPage />}
            />
          </Route>
        </Route>

        {/* Student portal */}
        <Route element={<RoleRoute allowedRoles={["STUDENT"]} />}>
          <Route element={<StudentLayout />}>
            <Route
              path="/student/dashboard"
              element={<StudentDashboard />}  //change here
            />
            <Route
              path="/student/attendance"
              element={<MyAttendancePage />}  //change here
            />
            <Route
              path="/student/marks"
              element={<MyMarksPage />}  //change here
            />
            <Route
              path="/student/performance"
              element={<MyPerformancePage />}
            />
            <Route
              path="/student/recommendations"
              element={<RecommendationsPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* ---------- Fallback ---------- */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
