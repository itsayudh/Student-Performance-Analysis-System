import api from "./api";

// POST /reports/generate — returns a PDF STREAM, not JSON.
// responseType: "blob" tells axios to hand us raw binary instead of
// trying (and failing) to JSON-parse a PDF.
export const generateReport = (payload) => {
  return api.post("/reports/generate", payload, { responseType: "blob" });
};

// Browser-download trigger: wrap the blob in a temporary object URL,
// click an invisible <a download>, then release the URL (they leak
// memory if never revoked).
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};