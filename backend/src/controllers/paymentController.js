const PaymentMethod = require('../models/PaymentMethod');

// Re-use the same field map from the model so validation stays in sync.
const FIELDS_BY_TYPE = {
  Bank:   ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'branchName'],
  Paytm:  ['paytmNumber'],
  UPI:    ['upiId'],
  PayPal: ['paypalEmail'],
  USDT:   ['usdtAddress'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that every field required for the given paymentType is present
 * in the request body. Returns an array of missing field names (empty = valid).
 */
const getMissingFields = (paymentType, body) => {
  const required = FIELDS_BY_TYPE[paymentType];
  if (!required) return []; // schema enum validation will catch invalid types
  return required.filter((f) => !body[f] || String(body[f]).trim() === '');
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * POST /api/payments
 * Creates a new payment method for the logged-in user.
 */
const addPaymentMethod = async (req, res) => {
  try {
    const { paymentType } = req.body;

    if (!paymentType) {
      return res.status(400).json({ message: 'paymentType is required.' });
    }

    // Validate type-specific required fields before hitting Mongoose
    const missing = getMissingFields(paymentType, req.body);
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields for ${paymentType}: ${missing.join(', ')}`,
      });
    }

    const doc = await PaymentMethod.create({
      ...req.body,
      user: req.user._id, // always override with authenticated user
    });

    res.status(201).json(doc);
  } catch (err) {
    // Mongoose validation errors (e.g. invalid enum value)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('addPaymentMethod error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * GET /api/payments
 * Returns all payment methods belonging to the logged-in user, newest first.
 */
const getMyPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(methods);
  } catch (err) {
    console.error('getMyPaymentMethods error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * PUT /api/payments/:id
 * Updates an existing payment method — only if it belongs to the logged-in user.
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    // ---- Ownership check ----
    // Compare the document's `user` field against the authenticated user.
    // Without this, any logged-in user could update another user's payment
    // info simply by guessing or enumerating document IDs.
    if (method.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to update this payment method.' });
    }

    // If paymentType is being changed, validate the new type's required fields
    const effectiveType = req.body.paymentType || method.paymentType;
    if (req.body.paymentType && req.body.paymentType !== method.paymentType) {
      const missing = getMissingFields(req.body.paymentType, req.body);
      if (missing.length > 0) {
        return res.status(400).json({
          message: `Missing required fields for ${req.body.paymentType}: ${missing.join(', ')}`,
        });
      }
    }

    // Apply updates
    Object.assign(method, req.body);
    method.user = req.user._id; // prevent user field from being overwritten
    const updated = await method.save(); // triggers Mongoose validation

    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Payment method not found.' });
    }
    console.error('updatePaymentMethod error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * DELETE /api/payments/:id
 * Deletes a payment method — only if it belongs to the logged-in user.
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    // ---- Ownership check (same pattern as update) ----
    if (method.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to delete this payment method.' });
    }

    await method.deleteOne();
    res.json({ message: 'Payment method deleted.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Payment method not found.' });
    }
    console.error('deletePaymentMethod error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = {
  addPaymentMethod,
  getMyPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
};
