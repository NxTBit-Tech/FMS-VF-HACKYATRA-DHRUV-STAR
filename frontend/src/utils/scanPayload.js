// Client-side scan normalization — mirrors backend payloadService.resolveScanInput.

export function extractReferenceNumber(text) {
  const match = String(text).match(/TP-\d{8}-\d{4}/i);
  if (match) return match[0].toUpperCase();
  return String(text).trim();
}

export function normalizeScanPayload(raw) {
  if (raw == null) return null;

  let text = String(raw).trim();
  if (!text) return null;

  try {
    text = decodeURIComponent(text);
  } catch {
    /* not encoded */
  }

  text = text.replace(/[\x00-\x1f\x7f]/g, '').trim();

  try {
    const parsed = JSON.parse(text);
    if (parsed?.referenceNumber) {
      return {
        payload: text,
        referenceNumber: extractReferenceNumber(parsed.referenceNumber),
        scanType: 'qr',
      };
    }
  } catch {
    /* not JSON */
  }

  const referenceNumber = extractReferenceNumber(text);
  return {
    payload: referenceNumber,
    referenceNumber,
    scanType: 'barcode',
  };
}
