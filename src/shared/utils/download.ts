/** Triggers a browser file download for a Blob — shared by every report
 *  exporter that produces a file (CSV today; Excel/PDF in Stage 5). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
