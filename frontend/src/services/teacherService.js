// src/services/teacherService.js
import api from "./api";

// Wraps every /teachers endpoint — mirror image of studentService.

export async function getTeachers({
  page = 1,
  pageSize = 25,
  search = "",
  department = "",
} = {}) {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;
  if (department) params.department = department;

  const { data } = await api.get("/teachers", { params });
  return data; // { items, total, page, page_size }
}

export async function getTeacher(teacherId) {
  const { data } = await api.get(`/teachers/${teacherId}`);
  return data;
}

export async function createTeacher(payload) {
  const { data } = await api.post("/teachers", payload);
  return data;
}

export async function updateTeacher(teacherId, payload) {
  const { data } = await api.put(`/teachers/${teacherId}`, payload);
  return data;
}

export async function deleteTeacher(teacherId) {
  const { data } = await api.delete(`/teachers/${teacherId}`);
  return data;
}
