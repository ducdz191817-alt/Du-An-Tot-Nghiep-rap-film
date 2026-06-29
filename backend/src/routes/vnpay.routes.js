const express = require('express');
const router = express.Router();
const { createPayment, vnpayCallback } = require('../controllers/vnpay.controller');

router.post('/create', createPayment);
router.get('/callback', vnpayCallback);

module.exports = router;
