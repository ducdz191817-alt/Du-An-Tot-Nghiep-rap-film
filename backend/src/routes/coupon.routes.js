const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../controllers/coupon.controller');
const { protect } = require('../middleware/auth.middleware');

// Validate a coupon (requires login)
router.post('/validate', protect, validateCoupon);

module.exports = router;
