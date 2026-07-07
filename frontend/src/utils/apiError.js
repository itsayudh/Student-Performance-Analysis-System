// src/utils/apiError.js

/**
 * Translates any axios/FastAPI error into { title, messages } that
 * AlertBanner can render directly.
 *
 * FastAPI (our backend) fails in exactly these shapes:
 *
 * 1. HTTPException  -> { "detail": "Invalid credentials" }
 *    (string detail — auth failures, not-found, permission denied)
 *
 * 2. 422 Validation -> { "detail": [ { "loc": ["body","email"],
 *                                      "msg": "value is not a valid email",
 *                                      "type": "value_error.email" }, ... ] }
 *    (array detail — Pydantic schema rejections, one entry per bad field)
 *
 * 3. Network error  -> no err.response at all (backend down, CORS, timeout)
 */
export function parseApiError(err) {
  // Case 3: request never reached the backend
  if (!err?.response) {
    return {
      title: "Connection problem",
      messages:
        "Could not reach the server. Check that the backend is running.",
    };
  }

  const { status, data } = err.response;
  const detail = data?.detail;

  // Case 2: Pydantic validation errors (array of field errors)
  if (Array.isArray(detail)) {
    return {
      title: "Please fix the following",
      messages: detail.map((e) => {
        // loc is like ["body", "email"] — last element is the field name
        const field = e.loc?.[e.loc.length - 1] ?? "field";
        return `${field}: ${e.msg}`;
      }),
    };
  }

  // Case 1: plain string detail from HTTPException
  if (typeof detail === "string") {
    return { title: statusTitle(status), messages: detail };
  }

  // Fallback: something unexpected
  return {
    title: statusTitle(status),
    messages: "An unexpected error occurred. Please try again.",
  };
}

function statusTitle(status) {
  const map = {
    400: "Bad request",
    401: "Not authorized",
    403: "Permission denied",
    404: "Not found",
    409: "Conflict",
    422: "Validation error",
    500: "Server error",
  };
  return map[status] || `Error ${status}`;
}
