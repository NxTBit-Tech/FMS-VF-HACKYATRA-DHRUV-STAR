// services/scanService.js
//
// Shared lookup + response shaping for officer scan endpoints.
// Always returns LIVE file state from DB — never trust encoded label data.
// Backfills missing label PNGs via labelService when a file is resolved.

const { resolveScanInput } = require('./payloadService');
const { ensureLabelsForFile } = require('./labelService');

const FILE_SCAN_SQL = `
  SELECT f.id, f.reference_number, f.status, f.stage_entered_at,
         f.qr_payload, f.barcode_payload, f.qr_image_path, f.barcode_image_path,
         f.current_holder_id, f.pending_holder_id, f.dispatched_at,
         s.id AS stage_id, s.stage_name, s.sla_hours,
         holder.full_name AS current_holder_name,
         holder.role AS current_holder_role,
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
  WHERE UPPER(f.reference_number) = UPPER($1)
     OR UPPER(f.barcode_payload) = UPPER($1)
     OR f.barcode_payload = $2
     OR f.qr_payload = $2
  LIMIT 1
`;

const FILE_BY_ID_SQL = `
  SELECT f.id, f.reference_number, f.status, f.stage_entered_at,
         f.qr_payload, f.barcode_payload, f.qr_image_path, f.barcode_image_path,
         f.current_holder_id, f.pending_holder_id, f.dispatched_at,
         s.id AS stage_id, s.stage_name, s.sla_hours,
         holder.full_name AS current_holder_name,
         holder.role AS current_holder_role,
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
  WHERE f.id = $1
`;

function formatScanResponse(file, scanType, labelMeta = {}) {
  const hoursAtStage = Number(file.hours_at_stage) || 0;
  const slaHours = Number(file.sla_hours) || 0;

  return {
    fileId: file.id,
    referenceNumber: file.reference_number,
    scanType,
    status: file.status,
    labels: {
      qrPayload: file.qr_payload,
      barcodePayload: file.barcode_payload,
      qrImagePath: file.qr_image_path,
      barcodeImagePath: file.barcode_image_path,
      labelsRegenerated: labelMeta.regenerated || false,
    },
    currentStage: {
      id: file.stage_id,
      name: file.stage_name,
      slaHours,
    },
    hoursAtStage,
    slaStatus: hoursAtStage > slaHours ? 'overdue' : 'on_time',
    currentHolder: file.current_holder_id
      ? {
          id: file.current_holder_id,
          name: file.current_holder_name,
          role: file.current_holder_role,
        }
      : null,
    pendingHandoff: file.pending_holder_id
      ? {
          pendingHolderId: file.pending_holder_id,
          pendingHolderName: file.pending_holder_name,
          dispatchedAt: file.dispatched_at,
          pendingToStageId: file.pending_to_stage_id,
        }
      : null,
  };
}

async function attachLabels(pool, file, scanType = 'lookup') {
  const labelMeta = await ensureLabelsForFile(pool, file);
  file.qr_image_path = labelMeta.qrImagePath;
  file.barcode_image_path = labelMeta.barcodeImagePath;
  return formatScanResponse(file, scanType, labelMeta);
}

async function lookupFileByScan(pool, rawPayload) {
  const resolved = resolveScanInput(rawPayload);
  if (!resolved) {
    return { ok: false, reason: 'EMPTY_PAYLOAD' };
  }

  const result = await pool.query(FILE_SCAN_SQL, [
    resolved.referenceNumber,
    resolved.rawPayload,
  ]);

  if (result.rows.length === 0) {
    return { ok: false, reason: 'NOT_FOUND', referenceNumber: resolved.referenceNumber };
  }

  const data = await attachLabels(pool, result.rows[0], resolved.scanType);
  return { ok: true, data };
}

async function lookupFileById(pool, fileId) {
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return { ok: false, reason: 'INVALID_ID' };
  }

  const result = await pool.query(FILE_BY_ID_SQL, [fileId]);
  if (result.rows.length === 0) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const data = await attachLabels(pool, result.rows[0], 'lookup');
  return { ok: true, data };
}

/**
 * Returns label paths + payloads for print/download screens.
 */
async function getFileLabels(pool, fileId) {
  const lookup = await lookupFileById(pool, fileId);
  if (!lookup.ok) {
    return lookup;
  }

  return {
    ok: true,
    data: {
      fileId: lookup.data.fileId,
      referenceNumber: lookup.data.referenceNumber,
      qrPayload: lookup.data.labels.qrPayload,
      barcodePayload: lookup.data.labels.barcodePayload,
      qrImagePath: lookup.data.labels.qrImagePath,
      barcodeImagePath: lookup.data.labels.barcodeImagePath,
      labelsRegenerated: lookup.data.labels.labelsRegenerated,
    },
  };
}

module.exports = {
  lookupFileByScan,
  lookupFileById,
  getFileLabels,
  formatScanResponse,
};
