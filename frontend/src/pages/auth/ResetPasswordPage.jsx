// src/pages/auth/ResetPasswordPage.jsx
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
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
  // The reset link in the email looks like:
  //   http://localhost:5173/reset-password?token=abc123...
  // useSearchParams reads that query string — this is how the secret
  // travels from the email into this page.
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    // Cross-field check: both entered but different
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

  // No token in the URL → the page is useless; say so instead of letting
  // the submit fail with a confusing backend error.
  if (!token) {
    return (
      <Box>
        <AlertBanner
          severity="error"
          title="Invalid reset link"
          message="This link is missing its reset token. Please use the link from your email, or request a new one."
        />
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            underline="hover"
          >
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
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={values.password}
            onChange={handleChange("password")}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || " "}
            autoFocus
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={values.confirm}
            onChange={handleChange("confirm")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            error={!!fieldErrors.confirm}
            helperText={fieldErrors.confirm || " "}
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
        <Link
          component={RouterLink}
          to="/login"
          variant="body2"
          underline="hover"
        >
          Back to sign in
        </Link>
      </Box>
    </Box>
  );
}
