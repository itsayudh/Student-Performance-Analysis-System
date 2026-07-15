// src/pages/auth/LoginPage.jsx
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
import { Link as RouterLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AlertBanner from "../../components/common/AlertBanner";
import { required, isEmail, validateForm } from "../../utils/validators";



export default function LoginPage() {
  const { loginUser, isSubmitting, error, clearError } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    const errs = validateForm(values, {
      email: [required("Email"), isEmail],
      password: [required("Password")],
    });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await loginUser(values.email, values.password);
    // On success, useAuth navigates by role; on failure, `error` is set
    // and rendered by the AlertBanner below. Nothing else to do here.
  };

  // Submit on Enter from either field — login forms must support this.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Student Performance Analysis System
      </Typography>

      <AlertBanner
        severity="error"
        title={error?.title}
        message={error?.messages}
        show={!!error}
        onClose={clearError}
      />

      <TextField
        label="Email"
        type="email"
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        value={values.email}
        onChange={handleChange("email")}
        onKeyDown={handleKeyDown}
        error={!!fieldErrors.email}
        helperText={fieldErrors.email || " "}
        autoFocus
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        fullWidth
        size="small"
        sx={{ mb: 1 }}
        value={values.password}
        onChange={handleChange("password")}
        onKeyDown={handleKeyDown}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || " "}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ textAlign: "right", mb: 2 }}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          underline="hover"
        >
          Forgot password?
        </Link>
      </Box>

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </Box>
  );
}
