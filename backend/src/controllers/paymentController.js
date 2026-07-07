const PaymentMethod = require('../models/PaymentMethod');
const AppError = require('../utils/AppError');

const FIELDS_BY_TYPE = {
  Bank:   ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'branchName'],
  Paytm:  ['paytmNumber'],
  UPI:    ['upiId'],
  PayPal: ['paypalEmail'],
  USDT:   ['usdtAddress'],
};

// Max length for any text field — prevents oversized payloads
const MAX_FIELD_LEN = 200;

const getMissingFields = (paymentType, body) => {
  const required = FIELDS_BY_TYPE[paymentType];
  if (!required) return [];
  return required.filter((f) => !body[f] || String(body[f]).trim() === '');
};

/** Validate that no text field exceeds MAX_FIELD_LEN */
const checkFieldLengths = (paymentType, body) => {
  const fields = FIELDS_BY_TYPE[paymentType] || [];
  for (const f of fields) {
    if (body[f] && String(body[f]).length > MAX_FIELD_LEN) {
      throw new AppError(`${f} must be at most ${MAX_FIELD_LEN} characters.`, 400);
    }
  }
};

// --------------- Controllers ---------------

/**
 * POST /api/payments
 */
const addPaymentMethod = async (req, res, next) => {
  try {
    const { paymentType } = req.body;

    if (!paymentType) {
      throw new AppError('paymentType is required.', 400);
    }

    const missing = getMissingFields(paymentType, req.body);
    if (missing.length > 0) {
      throw new AppError(`Missing required fields for ${paymentType}: ${missing.join(', ')}`, 400);
    }

    checkFieldLengths(paymentType, req.body);

    const doc = await PaymentMethod.create({
      ...req.body,
      user: req.user._id, // always server-set
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments
 */
const getMyPaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(methods);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/payments/:id
 */
const updatePaymentMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (!method) {
      throw new AppError('Payment method not found.', 404);
    }

    // ---- Ownership check ----
    if (method.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorised to update this payment method.', 403);
    }

    // Validate if type is changing
    if (req.body.paymentType && req.body.paymentType !== method.paymentType) {
      const missing = getMissingFields(req.body.paymentType, req.body);
      if (missing.length > 0) {
        throw new AppError(
          `Missing required fields for ${req.body.paymentType}: ${missing.join(', ')}`,
          400
        );
      }
    }

    const effectiveType = req.body.paymentType || method.paymentType;
    checkFieldLengths(effectiveType, req.body);

    Object.assign(method, req.body);
    method.user = req.user._id; // prevent user field override
    const updated = await method.save();

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/payments/:id
 */
const deletePaymentMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (!method) {
      throw new AppError('Payment method not found.', 404);
    }

    // ---- Ownership check ----
    if (method.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorised to delete this payment method.', 403);
    }

    await method.deleteOne();
    res.json({ message: 'Payment method deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addPaymentMethod,
  getMyPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
};
