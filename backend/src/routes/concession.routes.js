const express = require('express');
const router = express.Router();
const { listConcessions } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');

// Concessions are available to all authenticated users during booking
router.use(protect);

router.get('/', listConcessions);

module.exports = router;
