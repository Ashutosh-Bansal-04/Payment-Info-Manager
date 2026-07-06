const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addPaymentMethod,
  getMyPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentController');

// All payment routes require authentication
router.use(protect);

// POST   /api/payments       — create a new payment method
router.post('/', addPaymentMethod);

// GET    /api/payments       — list all my payment methods
router.get('/', getMyPaymentMethods);

// PUT    /api/payments/:id   — update a payment method (ownership-checked)
router.put('/:id', updatePaymentMethod);

// DELETE /api/payments/:id   — delete a payment method (ownership-checked)
router.delete('/:id', deletePaymentMethod);

module.exports = router;
