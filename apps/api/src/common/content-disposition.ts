/**
 * `attachment` Content-Disposition with a safe file name. Names can come from imported XML
 * (Numero is not validated by the XSD there): quotes, CR/LF and non-ASCII characters are
 * replaced, so they cannot inject header parameters or make Node reject the header.
 */
export function attachment(fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]/g, '_') || 'download';
  return `attachment; filename="${safe}"`;
}
