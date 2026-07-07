const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');

/**
 * Escape special regex characters in user-supplied strings.
 * Prevents NoSQL injection via $regex and ReDoS via crafted patterns.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 */
const getAllPayments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.paymentType) {
      // Exact match — no regex needed for enum
      const validTypes = ['Bank', 'Paytm', 'UPI', 'PayPal', 'USDT'];
      if (validTypes.includes(req.query.paymentType)) {
        filter.paymentType = req.query.paymentType;
      }
    }

    for (const [param, field] of Object.entries(TEXT_FILTERS)) {
      if (req.query[param]) {
        // Escape regex special chars before building the pattern
        filter[field] = new RegExp(escapeRegex(req.query[param]), 'i');
      }
    }

    if (req.query.username) {
      const matchingUsers = await User.find({
        username: new RegExp(escapeRegex(req.query.username), 'i'),
      }).select('_id');

      filter.user = { $in: matchingUsers.map((u) => u._id) };
    }

    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip  = (page - 1) * limit;

    const [methods, total] = await Promise.all([
      PaymentMethod.find(filter)
        .populate('user', 'username email')
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
    next(err);
  }
};

module.exports = { getAllPayments };
