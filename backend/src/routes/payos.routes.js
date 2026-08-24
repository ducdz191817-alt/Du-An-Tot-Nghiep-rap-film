const express = require('express');
const router = express.Router();
const { payosWebhook, handleReturn, createPayosPayment } = require('../controllers/payos.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/webhook', payosWebhook);
router.get('/return', handleReturn);
router.post('/create', protect, createPayosPayment);

module.exports = router;
