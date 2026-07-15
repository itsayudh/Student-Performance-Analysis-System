import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Panel, PageHeader } from "../../components/gridline";
import { changePassword } from "../../services/authService";

// Shared across all three portals — reached via the Navbar avatar menu.
// Each of the three password fields gets its OWN visibility toggle.
//
// MUI v9 note: TextField adornments go through `slotProps={{ input: {
// endAdornment } }}` now, NOT the old `InputProps={{ endAdornment }}` —
// the old prop is silently ignored in this version (no error, no
// warning, the icon just never renders). This bit us across every
// password field in the app until confirmed via package.json.
export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Returns a ready-to-spread slotProps object for a given toggle pair.
  const eyeSlotProps = (show, setShow) => ({
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton size="small" onClick={() => setShow((s) => !s)} edge="end">
            {show ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  });

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
          type={showCurrent ? "text" : "password"}
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={Boolean(errors.currentPassword)}
          helperText={errors.currentPassword || " "}
          slotProps={eyeSlotProps(showCurrent, setShowCurrent)}
          sx={{ mb: 1.5 }}
        />
        <TextField
          fullWidth
          size="small"
          type={showNew ? "text" : "password"}
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={Boolean(errors.newPassword)}
          helperText={errors.newPassword || "At least 8 characters"}
          slotProps={eyeSlotProps(showNew, setShowNew)}
          sx={{ mb: 1.5 }}
        />
        <TextField
          fullWidth
          size="small"
          type={showConfirm ? "text" : "password"}
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword || " "}
          slotProps={eyeSlotProps(showConfirm, setShowConfirm)}
          sx={{ mb: 2 }}
        />

        <Button variant="contained" fullWidth disabled={submitting} onClick={handleSubmit}>
          {submitting ? <CircularProgress size={22} color="inherit" /> : "Change Password"}
        </Button>
      </Panel>
    </Box>
  );
}