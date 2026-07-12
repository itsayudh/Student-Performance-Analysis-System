// src/services/studentService.js
import api from "./api";

// Wraps every /students endpoint. Pure HTTP — no React, no state.
// Returns parsed response data; throws on error (callers catch).
// The token header comes free from api.js's request interceptor.

/**
 * GET /students — paginated list.
 * params: { page, pageSize, search, department, isActive }
 * returns: { items, total, page, page_size }
 */
export async function getStudents({
  page = 1,
  pageSize = 25,
  search = "",
  department = "",
  isActive = null,
} = {}) {
  const params = { page, page_size: pageSize };
  // Only send filters that are actually set — sending search=""
  // is harmless here, but omitting keeps URLs clean and avoids
  // surprising backend behavior with empty-string filters.
  if (search) params.search = search;
  if (department) params.department = department;
  if (isActive !== null && isActive !== undefined) params.is_active = isActive;

  const { data } = await api.get("/students", { params });
  return data;
}

/** GET /students/{id} — one student's full detail. */
export async function getStudent(studentId) {
  const { data } = await api.get(`/students/${studentId}`);
  return data;
}

/** POST /students — payload shaped exactly like StudentForm's output. */
export async function createStudent(payload) {
  const { data } = await api.post("/students", payload);
  return data;
}

/** PUT /students/{id} — partial update (StudentUpdate schema). */
export async function updateStudent(studentId, payload) {
  const { data } = await api.put(`/students/${studentId}`, payload);
  return data;
}

/** DELETE /students/{id} */
export async function deleteStudent(studentId) {
  const { data } = await api.delete(`/students/${studentId}`);
  return data;
}
