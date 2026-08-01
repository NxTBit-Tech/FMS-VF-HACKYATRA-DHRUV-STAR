// routes/users.js
// Officer directory for custody handoff picker (authenticated).

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /users — id, name, role for dispatch recipient selection
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, role, department
       FROM users
       ORDER BY role, full_name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
