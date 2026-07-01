import api from "./api";

// GET /analytics/student/{student_id}
// Returns: current_gpa, cgpa, gpa_trend[], attendance_trend[],
//          subject_performance[], risk_assessment{ risk_level, failure_probability, at_risk_subjects[] }
export const getStudentAnalytics = (studentId) => {
  return api.get(`/analytics/student/${studentId}`);
};

// GET /analytics/class/{class_id}
// Returns: class_name, student_count, class_gpa_avg,
//          grade_distribution{ A, B, C, D, F }, attendance_rate, at_risk_count
export const getClassAnalytics = (classId) => {
  return api.get(`/analytics/class/${classId}`);
};

// GET /analytics/subject/{subject_id}
// Returns: subject_name, subject_code, enrolled_count, class_average,
//          pass_rate, grade_distribution{ A, B, C, D, F }, attendance_avg, difficulty_score
export const getSubjectAnalytics = (subjectId) => {
  return api.get(`/analytics/subject/${subjectId}`);
};

// GET /analytics/dashboard
// Returns: total_students, total_teachers, total_classes, overall_gpa_avg,
//          overall_attendance_rate, at_risk_students, pass_rate_this_semester,
//          recent_alerts, department_performance[{ department, avg_gpa, student_count }]
export const getAdminDashboard = () => {
  return api.get("/analytics/dashboard");
};