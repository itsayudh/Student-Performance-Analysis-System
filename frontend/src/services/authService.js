import api, { setAccessToken } from "./api";

// Wraps every /auth/* endpoint from Section 7.1 of the documentation.
// Each function returns the parsed response data (or throws on error,
// which the calling component/hook is expected to catch).

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // Immediately register the token with api.js's interceptor so every
  // subsequent request automatically carries it.
  setAccessToken(data.access_token);
  return data; // { access_token, token_type, expires_in, user }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    // Clear locally regardless of whether the server call succeeded —
    // the user should never be "stuck" logged in on the frontend just
    // because the logout request failed (e.g. network blip).
    setAccessToken(null);
  }
}

export async function refreshToken() {
  const { data } = await api.post("/auth/refresh");
  setAccessToken(data.access_token);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data; // always a generic success message per Section 7.1
}

export async function resetPassword(token, newPassword, confirmPassword) {
  const { data } = await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

