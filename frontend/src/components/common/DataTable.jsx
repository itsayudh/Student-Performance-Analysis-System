// src/components/common/DataTable.jsx
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "./LoadingSpinner";
import { useState, useEffect } from "react";

/**
 * Server-side paginated table — matches the backend list-endpoint contract:
 *
 *   Request : GET /<resource>?page=1&page_size=25&search=ram
 *   Response: { items: [...], total: 248, page: 1, page_size: 25 }
 *
 * Props:
 *  - columns      : [{ key, label, render?, align? }]
 *                     key    → field name in the row object (e.g. "full_name")
 *                     label  → column header text
 *                     render → optional (row) => JSX, for custom cells
 *                              (status chips, action buttons, formatted dates)
 *                     align  → "left" (default) | "right" | "center"
 *  - rows         : array — the `items` from the API response
 *  - total        : number — the `total` from the API response
 *  - page         : 1-BASED page number (matches backend), parent owns it
 *  - pageSize     : rows per page, parent owns it
 *  - onPageChange     : (newPage) => void        — 1-based
 *  - onPageSizeChange : (newSize) => void
 *  - onSearch     : optional (text) => void — debounced 400ms internally;
 *                   if omitted, no search box is shown
 *  - searchPlaceholder : placeholder text for the search box
 *  - loading      : show inline spinner instead of rows
 *  - emptyMessage : text when there are zero rows (default "No records found")
 *  - onRowClick   : optional (row) => void — makes rows clickable
 *                   (e.g. navigate to /admin/students/{row.id})
 */
export default function DataTable({
  columns,
  rows = [],
  total = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  onSearch,
  searchPlaceholder = "Search...",
  loading = false,
  emptyMessage = "No records found",
  onRowClick,
}) {
  // --- Debounced search -------------------------------------------------
  // Local state holds what the user is typing; we only call onSearch()
  // after they stop typing for 400ms, so we don't fire one API request
  // per keystroke.
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => onSearch(searchText), 400);
    return () => clearTimeout(timer); // cancel if user types again
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Paper>
      {/* Search bar (only if the page wired onSearch) */}
      {onSearch && (
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align || "left"}
                  sx={{ fontWeight: 600 }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <LoadingSpinner fullPage={false} message="Loading..." />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ py: 4 }}
                  >
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align || "left"}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MUI TablePagination is 0-based; our backend is 1-based — convert here */}
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(_, newZeroBasedPage) =>
          onPageChange?.(newZeroBasedPage + 1)
        }
        onRowsPerPageChange={(e) => {
          onPageSizeChange?.(parseInt(e.target.value, 10));
          onPageChange?.(1); // reset to first page when size changes
        }}
      />
    </Paper>
  );
}
