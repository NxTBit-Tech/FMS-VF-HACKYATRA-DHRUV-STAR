// routes/files.js
// File CREATION is a separate entry point from transitions — it isn't
// a "move" in allowed_transitions, it's the origin of a file's life.
// Mounted after verifyJWT in app.js.

const express = require('express');
const router = express.Router();

const pool = require('../db/pool');
const { requireRole } = require('../middleware/requireRole');
const { buildQrPayload, buildBarcodePayload } = require('../services/payloadService');
const { generateLabelImages, ensureLabelsForFile } = require('../services/labelService');
const { getFileLabels } = require('../services/scanService');

function generateReferenceNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `TP-${datePart}-${randomPart}`;
}

async function insertFileWithLabels({
  referenceNumber,
  applicantName,
  applicantContact,
  propertyAddress,
  stage1Id,
  creatorId,
  creatorName,
  department,
  createdAt,
}) {
  const qrPayload = buildQrPayload({
    referenceNumber,
    department,
    createdByName: creatorName,
    createdAt,
  });
  const barcodePayload = buildBarcodePayload({ referenceNumber });

  const { qrImagePath, barcodeImagePath } = await generateLabelImages({
    referenceNumber,
    qrPayload,
    barcodePayload,
  });

  const insertResult = await pool.query(
    `INSERT INTO files
       (reference_number, applicant_name, applicant_contact, property_address,
        department, current_stage_id, current_holder_id,
        qr_payload, barcode_payload, qr_image_path, barcode_image_path, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $7)
     RETURNING id, reference_number, current_stage_id, status,
               qr_payload, barcode_payload, qr_image_path, barcode_image_path`,
    [
      referenceNumber,
      applicantName,
      applicantContact || null,
      propertyAddress || null,
      department,
      stage1Id,
      creatorId,
      qrPayload,
      barcodePayload,
      qrImagePath,
      barcodeImagePath,
    ]
  );

  return insertResult.rows[0];
}

// POST /files
// Only revenue_inspector can create a file — they own stage 1 (Submitted).
// body: { applicantName, applicantContact, propertyAddress }
router.post('/', requireRole('revenue_inspector'), async (req, res, next) => {
  try {
    const { applicantName, applicantContact, propertyAddress } = req.body;

    if (!applicantName) {
      return res.status(400).json({ error: 'applicantName is required.' });
    }

    const stageResult = await pool.query(
      `SELECT id FROM stages WHERE stage_order = 1 AND department_id = 1`
    );
    if (stageResult.rows.length === 0) {
      return res.status(500).json({ error: 'Stage 1 not configured for this department.' });
    }
    const stage1Id = stageResult.rows[0].id;

    const creatorResult = await pool.query(
      `SELECT full_name, department FROM users WHERE id = $1`,
      [req.user.id]
    );
    const creatorName = creatorResult.rows[0]?.full_name || 'Unknown';
    const department = creatorResult.rows[0]?.department || 'Town Planning';
    const createdAt = new Date().toISOString();

    let fileRecord;
    const referenceNumber = generateReferenceNumber();

    try {
      fileRecord = await insertFileWithLabels({
        referenceNumber,
        applicantName,
        applicantContact,
        propertyAddress,
        stage1Id,
        creatorId: req.user.id,
        creatorName,
        department,
        createdAt,
      });
    } catch (err) {
      if (err.code === '23505') {
        fileRecord = await insertFileWithLabels({
          referenceNumber: generateReferenceNumber(),
          applicantName,
          applicantContact,
          propertyAddress,
          stage1Id,
          creatorId: req.user.id,
          creatorName,
          department,
          createdAt,
        });
      } else {
        throw err;
      }
    }

    res.status(201).json(fileRecord);
  } catch (err) {
    next(err);
  }
});

// GET /files/:id/labels — QR/barcode PNG paths for print screen (regenerates if missing)
router.get('/:id/labels', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const result = await getFileLabels(pool, fileId);

    if (result.reason === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid file id.' });
    }
    if (result.reason === 'NOT_FOUND') {
      return res.status(404).json({ error: 'File not found.' });
    }

    return res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
});

// GET /files/:id — basic detail view for the file detail screen
router.get('/:id', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ error: 'Invalid file id.' });
    }

    const result = await pool.query(
      `SELECT f.*, s.stage_name, s.id AS stage_id, s.sla_hours,
              holder.full_name AS current_holder_name,
              pending.full_name AS pending_holder_name,
              EXTRACT(EPOCH FROM (now() - f.stage_entered_at)) / 3600 AS hours_at_stage,
              CASE WHEN f.pending_holder_id IS NOT NULL THEN (
                SELECT cl.to_stage_id FROM custody_log cl
                WHERE cl.file_id = f.id AND cl.transition_type = 'dispatch'
                ORDER BY cl.scanned_at DESC LIMIT 1
              ) END AS pending_to_stage_id
       FROM files f
       JOIN stages s ON f.current_stage_id = s.id
       LEFT JOIN users holder ON f.current_holder_id = holder.id
       LEFT JOIN users pending ON f.pending_holder_id = pending.id
       WHERE f.id = $1`,
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = result.rows[0];
    try {
      const labelMeta = await ensureLabelsForFile(pool, file);
      file.qr_image_path = labelMeta.qrImagePath;
      file.barcode_image_path = labelMeta.barcodeImagePath;
    } catch (err) {
      console.error('Failed to auto-heal labels:', err);
    }

    res.status(200).json(file);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
