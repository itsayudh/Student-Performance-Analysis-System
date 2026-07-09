// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";
import { useAuthContext } from "../contexts/AuthContext";


//add by ayudh
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import PredictionsPage from "../pages/admin/PredictionsPage";
import StudentPerformancePage from "../pages/teacher/StudentPerformancePage";
import EarlyWarningPage from "../pages/teacher/EarlyWarningPage";
import MyPerformancePage from "../pages/student/MyPerformancePage";
import RecommendationsPage from "../pages/student/RecommendationsPage";
import { login as apiLogin } from "../services/authService";

// TODO: replace each placeholder below with the real page import once built
// e.g. import LoginPage from "../pages/auth/LoginPage";
function Placeholder({ label }) {
  return <h2>{label} — page not built yet</h2>;
}

// // TEMPORARY — only for testing, remove before Layer E (real LoginPage.jsx)
// function FakeLoginTestOnly() {
//   const { login } = useAuthContext();
//   const navigate = useNavigate();

//   const loginAs = (role) => {
//     login("fake-token", { role, email: `${role.toLowerCase()}@test.com` });
//     navigate(`/${role.toLowerCase()}/dashboard`);
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <button onClick={() => loginAs("ADMIN")}>Login as Admin</button>{" "}
//       <button onClick={() => loginAs("TEACHER")}>Login as Teacher</button>{" "}
//       <button onClick={() => loginAs("STUDENT")}>Login as Student</button>
//     </div>
//   );
// }






////////////// Real token to the send to the backend/////////////////////
// TEMPORARY — real-backend login for testing; Roshan's LoginPage.jsx
// replaces this later.
function FakeLoginTestOnly() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  

 const loginAs = async (email, password) => {
    try {
      // authService.login does BOTH jobs: calls the backend AND
      // registers the token with api.js so axios attaches it everywhere
      const data = await apiLogin(email, password);
      login(data.access_token, data.user); // fills AuthContext (guards/UI)
      navigate(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      alert(`Login failed (${err.response?.status ?? "network"})`);
    }
  };
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => loginAs("admin@spas.com", "Admin1234")}>Admin</button>{" "}
      <button onClick={() => loginAs("teacher@spas.com", "Teacher1234")}>Teacher</button>{" "}
      <button onClick={() => loginAs("student@spas.com", "Student1234")}>Student</button>
    </div>
  );
}
  






export default function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Public routes (wrapped in AuthLayout) ---------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<FakeLoginTestOnly />} />
        <Route
          path="/forgot-password"
          element={<Placeholder label="Forgot Password" />}
        />
        <Route
          path="/reset-password"
          element={<Placeholder label="Reset Password" />}
        />
      </Route>

      {/* ---------- Authenticated routes ---------- */}
      <Route element={<ProtectedRoute />}>
        {/* Admin portal */}
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/dashboard"
              element={<Placeholder label="Admin Dashboard" />}
            />
            <Route
              path="/admin/students"
              element={<Placeholder label="Students" />}
            />
            <Route
              path="/admin/students/add"
              element={<Placeholder label="Add Student" />}
            />
            <Route
              path="/admin/students/:id"
              element={<Placeholder label="Student Detail" />}
            />
            <Route
              path="/admin/teachers"
              element={<Placeholder label="Teachers" />}
            />
            <Route
              path="/admin/teachers/:id"
              element={<Placeholder label="Teacher Detail" />}
            />
            <Route
              path="/admin/classes"
              element={<Placeholder label="Classes" />}
            />
            <Route
              path="/admin/analytics"
              element={<AnalyticsPage/>}   //change here
            />
            <Route
              path="/admin/predictions"
              element={<PredictionsPage/>}  //change here
            />
            <Route
              path="/admin/reports"
              element={<Placeholder label="Reports" />}
            />
          </Route>
        </Route>

        {/* Teacher portal */}
        <Route element={<RoleRoute allowedRoles={["TEACHER"]} />}>
          <Route element={<TeacherLayout />}>
            <Route
              path="/teacher/dashboard"
              element={<Placeholder label="Teacher Dashboard" />}
            />
            <Route
              path="/teacher/classes"
              element={<Placeholder label="My Classes" />}
            />
            <Route
              path="/teacher/attendance"
              element={<Placeholder label="Attendance" />}
            />
            <Route
              path="/teacher/marks"
              element={<Placeholder label="Marks" />}
            />
            <Route
              path="/teacher/performance"
              element={<StudentPerformancePage/>}  //change here
            />
            <Route
              path="/teacher/early-warning"
              element={<EarlyWarningPage/>}  //change here
            />
          </Route>
        </Route>

        {/* Student portal */}
        <Route element={<RoleRoute allowedRoles={["STUDENT"]} />}>
          <Route element={<StudentLayout />}>
            <Route
              path="/student/dashboard"
              element={<Placeholder label="Student Dashboard" />}
            />
            <Route
              path="/student/attendance"
              element={<Placeholder label="My Attendance" />}
            />
            <Route
              path="/student/marks"
              element={<Placeholder label="My Marks" />}
            />
            <Route
              path="/student/performance"
              element={<MyPerformancePage/>}  //change here
            />
            <Route
              path="/student/recommendations"
              element={<RecommendationsPage />}  //change here
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
