/**
 * Triggers a browser download for an in-memory blob.
 *
 * Two details matter and are easy to get wrong:
 * - the anchor must be in the document before it is clicked, or Firefox ignores it;
 * - the object URL must not be revoked in the same tick as the click, or WebKit
 *   cancels the download before it has started.
 */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}
