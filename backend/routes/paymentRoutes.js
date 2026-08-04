const express = require('express');
const router = express.Router();
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentSummary,
} = require('../controllers/paymentController');

const { auth, adminAuth } = require('../middleware/auth');

// ── User routes ──────────────────────────────────────
router.post('/', auth, createPayment);
router.get('/my-payments', auth, getMyPayments);

// ── Admin routes ─────────────────────────────────────
router.get('/admin/all', adminAuth, getAllPayments);
router.get('/admin/summary', adminAuth, getPaymentSummary);

module.exports = router;