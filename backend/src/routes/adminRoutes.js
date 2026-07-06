const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAllPayments } = require('../controllers/adminController');

// Both middlewares applied: authenticate first, then verify admin role
router.use(protect, adminOnly);

// GET /api/admin/payments
router.get('/payments', getAllPayments);

module.exports = router;
