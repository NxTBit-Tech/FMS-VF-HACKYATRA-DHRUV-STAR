// routes/public.js
// NO auth middleware on this router at all — mounted separately in
// app.js, before verifyJWT is applied. This is the one place req.user
// does not exist by design.
//
// Field discipline: this must NEVER grow to include applicant_name,
// applicant_contact, property_address, or officer names. If a future
// requirement needs those, add a NEW route — don't extend this one.

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const pool = require('../db/pool');

const publicLookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 requests/min per IP — prevents reference-number enumeration
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(publicLookupLimiter);

router.get('/status/:referenceNumber', async (req, res, next) => {
  try {
    const fileResult = await pool.query(
      `SELECT f.id, f.reference_number, s.stage_name, f.status, f.stage_entered_at,
              f.created_at, f.dispatched_at, f.pending_holder_id,
              u.full_name AS current_holder_name, u.role AS current_holder_role,
              creator.full_name AS creator_name, creator.role AS creator_role,
              pending.full_name AS pending_holder_name, pending.role AS pending_holder_role
       FROM files f
       JOIN stages s ON f.current_stage_id = s.id
       LEFT JOIN users u ON f.current_holder_id = u.id
       LEFT JOIN users creator ON f.created_by = creator.id
       LEFT JOIN users pending ON f.pending_holder_id = pending.id
       WHERE f.reference_number = $1`,
      [req.params.referenceNumber]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = fileResult.rows[0];

    const historyResult = await pool.query(
      `SELECT cl.id,
              cl.transition_type,
              cl.scanned_at,
              cl.time_at_previous_stage_hours,
              cl.transit_hours,
              fs.stage_name AS from_stage_name,
              ts.stage_name AS to_stage_name,
              u.full_name AS officer_name,
              u.role AS officer_role
       FROM custody_log cl
       LEFT JOIN stages fs ON cl.from_stage_id = fs.id
       LEFT JOIN stages ts ON cl.to_stage_id = ts.id
       LEFT JOIN users u ON cl.handled_by = u.id
       WHERE cl.file_id = $1
       ORDER BY cl.scanned_at ASC`,
      [file.id]
    );

    res.status(200).json({
      file,
      history: historyResult.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
