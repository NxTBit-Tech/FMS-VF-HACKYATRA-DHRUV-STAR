// services/labelService.js
//
// Generates printable QR and Code128 barcode PNGs at file creation.
// Image content matches payloadService — not separate semantics:
//   QR image      -> same static JSON string as files.qr_payload
//   Barcode image -> same reference number as files.barcode_payload
//
// ensureLabelsForFile() backfills PNGs for older rows missing paths/files.

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'public');
const QR_DIR = path.join(PUBLIC_ROOT, 'uploads', 'qr');
const BARCODE_DIR = path.join(PUBLIC_ROOT, 'uploads', 'barcodes');

function ensureUploadDirs() {
  fs.mkdirSync(QR_DIR, { recursive: true });
  fs.mkdirSync(BARCODE_DIR, { recursive: true });
}

function safeFilename(referenceNumber) {
  return referenceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function webPathToAbsolute(webPath) {
  if (!webPath) return null;
  const relative = webPath.replace(/^\/+/, '');
  return path.join(PUBLIC_ROOT, relative);
}

function fileExists(webPath) {
  const absolute = webPathToAbsolute(webPath);
  return absolute ? fs.existsSync(absolute) : false;
}

function labelsExistOnDisk(qrImagePath, barcodeImagePath) {
  return fileExists(qrImagePath) && fileExists(barcodeImagePath);
}

async function generateQrImage({ referenceNumber, qrPayload }) {
  ensureUploadDirs();
  const filename = `${safeFilename(referenceNumber)}.png`;
  const absolutePath = path.join(QR_DIR, filename);

  await QRCode.toFile(absolutePath, qrPayload, {
    type: 'png',
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  return `/uploads/qr/${filename}`;
}

async function generateBarcodeImage({ referenceNumber, barcodePayload }) {
  ensureUploadDirs();
  const filename = `${safeFilename(referenceNumber)}.png`;
  const absolutePath = path.join(BARCODE_DIR, filename);

  const pngBuffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: barcodePayload,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });

  fs.writeFileSync(absolutePath, pngBuffer);
  return `/uploads/barcodes/${filename}`;
}

async function generateLabelImages({ referenceNumber, qrPayload, barcodePayload }) {
  const [qrImagePath, barcodeImagePath] = await Promise.all([
    generateQrImage({ referenceNumber, qrPayload }),
    generateBarcodeImage({ referenceNumber, barcodePayload }),
  ]);

  return { qrImagePath, barcodeImagePath };
}

/**
 * Regenerate PNGs from stored payload strings and persist paths on the file row.
 * Safe to call when paths are null or image files were deleted from disk.
 */
async function ensureLabelsForFile(pool, file) {
  const needsRegeneration =
    !file.qr_image_path ||
    !file.barcode_image_path ||
    !labelsExistOnDisk(file.qr_image_path, file.barcode_image_path);

  if (!needsRegeneration) {
    return {
      qrImagePath: file.qr_image_path,
      barcodeImagePath: file.barcode_image_path,
      regenerated: false,
    };
  }

  if (!file.qr_payload || !file.barcode_payload || !file.reference_number) {
    const err = new Error('File is missing payload data required for label generation.');
    err.statusCode = 422;
    throw err;
  }

  const { qrImagePath, barcodeImagePath } = await generateLabelImages({
    referenceNumber: file.reference_number,
    qrPayload: file.qr_payload,
    barcodePayload: file.barcode_payload,
  });

  await pool.query(
    `UPDATE files
     SET qr_image_path = $1, barcode_image_path = $2
     WHERE id = $3`,
    [qrImagePath, barcodeImagePath, file.id]
  );

  return { qrImagePath, barcodeImagePath, regenerated: true };
}

module.exports = {
  generateLabelImages,
  ensureLabelsForFile,
  labelsExistOnDisk,
  webPathToAbsolute,
};
