// src/components/common/ConfirmDialog.jsx
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Reusable "Are you sure?" modal for every destructive or irreversible
 * action (deleting a student, deactivating a teacher, overwriting marks).
 *
 * Props:
 *  - open        : boolean — controls visibility (parent owns this state)
 *  - title       : heading, e.g. "Delete student?"
 *  - message     : body text, e.g. "This will permanently remove Ram Sharma."
 *  - confirmText : label for the confirm button (default "Confirm")
 *  - cancelText  : label for the cancel button (default "Cancel")
 *  - danger      : boolean — red confirm button for destructive actions
 *  - loading     : boolean — disables buttons + shows spinner while the
 *                  DELETE/PUT request is in flight
 *  - onConfirm   : called when user confirms
 *  - onClose     : called when user cancels / clicks backdrop / presses Esc
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose} // block closing mid-request
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      {message && (
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={danger ? "error" : "primary"}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {loading ? "Working..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
