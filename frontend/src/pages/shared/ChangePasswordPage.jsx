import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { Panel, PageHeader } from "../../components/gridline";
import { changePassword } from "../../services/authService";

// Shared across all three portals — reached via the Navbar avatar
// menu, not a sidebar link, since it's an account-level action rather
// than a portal-specific feature. One route (/change-password),
// registered outside any RoleRoute block in AppRoutes.jsx: any
// authenticated user can reach it, and the backend enforces "self
// only" by reading the user from the auth token rather than the body.
export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null); // { severity, text }

  const validate = () => {
    const errs = {};
    if (!currentPassword) errs.currentPassword = "Required";
    if (!newPassword) errs.newPassword = "Required";
    else if (newPassword.length < 8) errs.newPassword = "Must be at least 8 characters";
    if (newPassword && newPassword === currentPassword)
      errs.newPassword = "New password must be different from the current one";
    if (confirmPassword !== newPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    setBanner(null);
    if (!validate()) return;

    setSubmitting(true);
    changePassword(currentPassword, newPassword)
      .then(() => {
        setBanner({ severity: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      })
      .catch((err) => {
        // Backend's own message for the wrong-current-password case is
        // already clear ("Current password is incorrect") — pass it
        // through rather than replacing it with a generic string.
        const detail = err.response?.data?.detail;
        setBanner({
          severity: "error",
          text: typeof detail === "string" ? detail : "Could not change password. Please try again.",
        });
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ maxWidth: 440, mx: "auto", mt: 4 }}>
      <PageHeader title="Change Password" />

      <Panel>
        {banner && (
          <Alert severity={banner.severity} sx={{ mb: 2 }} onClose={() => setBanner(null)}>
            {banner.text}
          </Alert>
        )}

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={Boolean(errors.currentPassword)}
          helperText={errors.currentPassword || " "}
          sx={{ mb: 1.5 }}
        />
        <TextField
          fullWidth
          size="small"
          type="password"
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={Boolean(errors.newPassword)}
          helperText={errors.newPassword || "At least 8 characters"}
          sx={{ mb: 1.5 }}
        />
        <TextField
          fullWidth
          size="small"
          type="password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword || " "}
          sx={{ mb: 2 }}
        />

        <Button variant="contained" fullWidth disabled={submitting} onClick={handleSubmit}>
          {submitting ? <CircularProgress size={22} color="inherit" /> : "Change Password"}
        </Button>
      </Panel>
    </Box>
  );
}