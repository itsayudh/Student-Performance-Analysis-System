// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppThemeProvider } from "./contexts/ThemeContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}
