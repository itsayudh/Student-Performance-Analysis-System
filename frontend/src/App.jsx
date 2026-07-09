import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppThemeProvider } from "./contexts/ThemeContext";
// src/App.jsx
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <AppRoutes />
        </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
