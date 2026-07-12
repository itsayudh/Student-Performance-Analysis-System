// src/hooks/useStudents.js
//
// Thin wrapper: all the list-fetching machinery (pagination state,
// deblatched search→page-1 reset, stale-response guard, refetch)
// lives in usePaginatedList. This file just binds it to the
// students endpoint. TeachersPage will bind the same hook to
// getTeachers directly.
import usePaginatedList from "./usePaginatedList";
import { getStudents } from "../services/studentService";

export default function useStudents(initial = {}) {
  return usePaginatedList(getStudents, initial);
}
