import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme/theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ padding: "2rem" }}>
        <h1>SPAS</h1>
        <p>Theme is wired up. Auth, routing, and layouts come next.</p>
      </div>
    </ThemeProvider>
  );
}

export default App;
