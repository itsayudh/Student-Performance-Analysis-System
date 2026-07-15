// src/pages/auth/ResetPasswordPage.jsx
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Link as RouterLink,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import * as authService from "../../services/authService";
import AlertBanner from "../../components/common/AlertBanner";
import { required, validateForm } from "../../utils/validators";
import { parseApiError } from "../../utils/apiError";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Independent toggle per field — MUI v9 uses slotProps.input.endAdornment,
  // not the old InputProps prop (silently ignored in this version).
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    const errs = validateForm(values, {
      password: [required("New password")],
      confirm: [required("Confirm password")],
    });
    if (!errs.password && !errs.confirm && values.password !== values.confirm) {
      errs.confirm = "Passwords do not match";
    }
    if (!errs.password && values.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setAlert(null);
    try {
      await authService.resetPassword(token, values.password, values.confirm);
      setDone(true);
      setAlert({
        severity: "success",
        messages: "Password reset successfully. Redirecting to sign in...",
      });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Box>
        <AlertBanner
          severity="error"
          title="Invalid reset link"
          message="This link is missing its reset token. Please use the link from your email, or request a new one."
        />
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
            Request a new reset link
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
        Reset password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a new password for your account.
      </Typography>

      <AlertBanner
        severity={alert?.severity}
        title={alert?.title}
        message={alert?.messages}
        show={!!alert}
        onClose={() => setAlert(null)}
      />

      {!done && (
        <>
          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={values.password}
            onChange={handleChange("password")}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || " "}
            slotProps={eyeSlotProps(showPassword, setShowPassword)}
            autoFocus
          />
          <TextField
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={values.confirm}
            onChange={handleChange("confirm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            error={!!fieldErrors.confirm}
            helperText={fieldErrors.confirm || " "}
            slotProps={eyeSlotProps(showConfirm, setShowConfirm)}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </>
      )}

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Link component={RouterLink} to="/login" variant="body2" underline="hover">
          Back to sign in
        </Link>
      </Box>
    </Box>
  );
}