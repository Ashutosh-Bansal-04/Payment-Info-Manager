const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Text filter fields — each maps a query-param name to the PaymentMethod
// field it should match against.  All use case-insensitive partial regex.
// ---------------------------------------------------------------------------
const TEXT_FILTERS = {
  bankName:     'bankName',
  ifscCode:     'ifscCode',
  paytmNumber:  'paytmNumber',
  upiId:        'upiId',
  paypalEmail:  'paypalEmail',
  usdtAddress:  'usdtAddress',
};

/**
 * GET /api/admin/payments
 *
 * Returns all PaymentMethod documents across every user, with the owning
 * user's username & email populated.
 *
 * Optional query params (all combinable):
 *   username     — partial, case-insensitive match against the User's username
 *   paymentType  — exact match against the enum (Bank, Paytm, UPI, PayPal, USDT)
 *   bankName, ifscCode, paytmNumber, upiId, paypalEmail, usdtAddress
 *                — partial, case-insensitive regex match
 *   page         — page number (default 1)
 *   limit        — results per page (default 20, max 100)
 */
const getAllPayments = async (req, res) => {
  try {
    // ---- Build the PaymentMethod filter object dynamically ----
    // We start with an empty query and ONLY add conditions for params that
    // were actually provided.  This keeps the query minimal — an empty {}
    // means "match everything", and each supplied param narrows the results.
    const filter = {};

    // Exact enum match for paymentType (no regex needed — it's a controlled enum)
    if (req.query.paymentType) {
      filter.paymentType = req.query.paymentType;
    }

    // Partial, case-insensitive regex for each text field
    for (const [param, field] of Object.entries(TEXT_FILTERS)) {
      if (req.query[param]) {
        filter[field] = new RegExp(req.query[param], 'i');
      }
    }

    // ---- Handle username filter (lives on User, not PaymentMethod) ----
    // If the admin filters by username we first find matching User IDs,
    // then constrain the PaymentMethod query to those users.
    if (req.query.username) {
      const matchingUsers = await User.find({
        username: new RegExp(req.query.username, 'i'),
      }).select('_id');

      filter.user = { $in: matchingUsers.map((u) => u._id) };
    }

    // ---- Pagination ----
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip  = (page - 1) * limit;

    // ---- Execute query ----
    const [methods, total] = await Promise.all([
      PaymentMethod.find(filter)
        .populate('user', 'username email')   // attach owner's name & email
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PaymentMethod.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      results: methods,
    });
  } catch (err) {
    console.error('getAllPayments (admin) error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { getAllPayments };
