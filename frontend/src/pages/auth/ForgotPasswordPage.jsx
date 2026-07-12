// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import { Link as RouterLink } from "react-router-dom";
import * as authService from "../../services/authService";
import AlertBanner from "../../components/common/AlertBanner";
import { required, isEmail, validateForm } from "../../utils/validators";
import { parseApiError } from "../../utils/apiError";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [alert, setAlert] = useState(null); // { severity, title, messages }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const errs = validateForm(
      { email },
      { email: [required("Email"), isEmail] },
    );
    setFieldError(errs.email || "");
    if (errs.email) return;

    setIsSubmitting(true);
    setAlert(null);
    try {
      const data = await authService.forgotPassword(email);
      // Backend always returns a generic success message — deliberately,
      // so nobody can probe which emails exist (see note below).
      setAlert({
        severity: "success",
        messages:
          data?.message ||
          "If that email is registered, a reset link has been sent.",
      });
      setSent(true);
    } catch (err) {
      setAlert({ severity: "error", ...parseApiError(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
        Forgot password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email and we'll send you a reset link.
      </Typography>

      <AlertBanner
        severity={alert?.severity}
        title={alert?.title}
        message={alert?.messages}
        show={!!alert}
        onClose={() => setAlert(null)}
      />

      {!sent && (
        <>
          <TextField
            label="Email"
            type="email"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            error={!!fieldError}
            helperText={fieldError || " "}
            autoFocus
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
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
