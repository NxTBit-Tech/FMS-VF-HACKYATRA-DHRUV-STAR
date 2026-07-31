// routes/scan.js
//
// Officer scan entry point — bridges physical QR/barcode labels to live file state.
//
// Endpoints (all require JWT via app.js):
//   POST /files/scan          body: { payload }  — preferred for QR JSON from cameras
//   GET  /files/scan?ref=...  query — barcode guns / typed reference number
//   GET  /files/scan/:ref     path  — short refs only (e.g. TP-20250801-1234)
//
// Mounted BEFORE routes/files.js so GET /files/scan is not captured by /files/:id.

const express = require('express');
const router = express.Router();

const pool = require('../db/pool');
const { lookupFileByScan } = require('../services/scanService');

function respondScanResult(res, result) {
  if (result.ok) {
    return res.status(200).json(result.data);
  }
  if (result.reason === 'EMPTY_PAYLOAD') {
    return res.status(400).json({ error: 'Scan payload is required.' });
  }
  return res.status(404).json({
    error: 'No file matches this scan.',
    referenceNumber: result.referenceNumber,
  });
}

router.post('/scan', async (req, res, next) => {
  try {
    const payload = req.body.payload ?? req.body.value ?? req.body.ref;
    const result = await lookupFileByScan(pool, payload);
    return respondScanResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/scan', async (req, res, next) => {
  try {
    const payload = req.query.ref ?? req.query.payload ?? req.query.value;
    const result = await lookupFileByScan(pool, payload);
    return respondScanResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/scan/:ref', async (req, res, next) => {
  try {
    const result = await lookupFileByScan(pool, req.params.ref);
    return respondScanResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
