// src/components/common/AlertBanner.jsx
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";

/**
 * Consistent success/error/info/warning banner for every page.
 *
 * Props:
 *  - severity : "error" | "warning" | "info" | "success" (default "info")
 *  - title    : optional bold heading line
 *  - message  : string OR array of strings (arrays render as a list —
 *               used for backend 422 validation errors, which return
 *               multiple field errors at once)
 *  - onClose  : optional — if provided, banner becomes dismissible
 *  - show     : boolean (default true) — lets pages toggle visibility
 *               with a smooth collapse animation instead of unmounting
 */
export default function AlertBanner({
  severity = "info",
  title,
  message,
  onClose,
  show = true,
}) {
  if (!message && !title) return null;

  const isList = Array.isArray(message);

  return (
    <Collapse in={show}>
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{ mb: 2, alignItems: "flex-start" }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {isList ? (
          <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
            {message.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : (
          message
        )}
      </Alert>
    </Collapse>
  );
}
