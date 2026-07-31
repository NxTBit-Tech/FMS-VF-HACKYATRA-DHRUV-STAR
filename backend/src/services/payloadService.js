// services/payloadService.js
//
// Payload strings at file creation (stable, never updated on transition):
//   qr_payload      — static JSON identity blob
//   barcode_payload — plain reference_number
//
// Printable PNGs (labelService) encode the same strings.
// resolveScanInput() normalizes what a scanner/keyboard sends into a lookup key.

function buildQrPayload({ referenceNumber, department, createdByName, createdAt }) {
  return JSON.stringify({
    referenceNumber,
    department,
    createdBy: createdByName,
    createdAt,
  });
}

function buildBarcodePayload({ referenceNumber }) {
  return referenceNumber;
}

/**
 * Normalize raw scanner output to a reference number + scan kind.
 * Handles: Code128 plain ref, QR JSON blob, URL-encoded text.
 */
function resolveScanInput(raw) {
  if (raw == null) return null;

  let text = String(raw).trim();
  if (!text) return null;

  try {
    text = decodeURIComponent(text);
  } catch {
    // use as-is if not URI-encoded
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.referenceNumber === 'string' && parsed.referenceNumber.trim()) {
      return {
        referenceNumber: parsed.referenceNumber.trim(),
        rawPayload: text,
        scanType: 'qr',
      };
    }
  } catch {
    // not JSON — barcode or typed reference
  }

  return {
    referenceNumber: text.trim(),
    rawPayload: text,
    scanType: 'barcode',
  };
}

module.exports = {
  buildQrPayload,
  buildBarcodePayload,
  resolveScanInput,
};
