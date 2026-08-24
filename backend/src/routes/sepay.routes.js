const express = require('express');
const router = express.Router();
const { sepayWebhook } = require('../controllers/sepay.controller');

// Webhook từ SePay (Public endpoint)
router.post('/webhook', sepayWebhook);

module.exports = router;
