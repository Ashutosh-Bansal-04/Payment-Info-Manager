const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// FIELD MAP — defines which fields are relevant for each payment type.
// Used by both the conditional `required` validators and the toJSON transform.
// ---------------------------------------------------------------------------
const FIELDS_BY_TYPE = {
  Bank:   ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'branchName'],
  Paytm:  ['paytmNumber'],
  UPI:    ['upiId'],
  PayPal: ['paypalEmail'],
  USDT:   ['usdtAddress'],
};

// ---------------------------------------------------------------------------
// CONDITIONAL REQUIRED — helper factory
//
// Mongoose's `required` option accepts a function that receives the document
// as `this`. We use it to make a field required ONLY when the document's
// `paymentType` matches the type that needs that field.
//
// Example for `ifscCode`:
//   required: conditionalRequired('Bank', 'IFSC code')
//
// At validation time Mongoose calls the function:
//   • If this.paymentType === 'Bank'  → returns [true, 'IFSC code is required for Bank']
//   • If this.paymentType !== 'Bank'  → returns false  (field is optional / ignored)
// ---------------------------------------------------------------------------
function conditionalRequired(paymentType, label) {
  return [
    function () {
      return this.paymentType === paymentType;
    },
    `${label} is required for ${paymentType} payment type`,
  ];
}

// ---------------------------------------------------------------------------
// SCHEMA
// ---------------------------------------------------------------------------
const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    paymentType: {
      type: String,
      enum: {
        values: ['Bank', 'Paytm', 'UPI', 'PayPal', 'USDT'],
        message: '{VALUE} is not a supported payment type',
      },
      required: [true, 'Payment type is required'],
    },

    // ---- Bank fields ----
    accountHolderName: {
      type: String,
      trim: true,
      required: conditionalRequired('Bank', 'Account holder name'),
    },
    accountNumber: {
      type: String,
      trim: true,
      required: conditionalRequired('Bank', 'Account number'),
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      required: conditionalRequired('Bank', 'IFSC code'),
    },
    bankName: {
      type: String,
      trim: true,
      required: conditionalRequired('Bank', 'Bank name'),
    },
    branchName: {
      type: String,
      trim: true,
      required: conditionalRequired('Bank', 'Branch name'),
    },

    // ---- Paytm ----
    paytmNumber: {
      type: String,
      trim: true,
      required: conditionalRequired('Paytm', 'Paytm number'),
    },

    // ---- UPI ----
    upiId: {
      type: String,
      trim: true,
      required: conditionalRequired('UPI', 'UPI ID'),
    },

    // ---- PayPal ----
    paypalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: conditionalRequired('PayPal', 'PayPal email'),
    },

    // ---- USDT ----
    usdtAddress: {
      type: String,
      trim: true,
      required: conditionalRequired('USDT', 'USDT wallet address'),
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// toJSON TRANSFORM
//
// When a document is serialised (e.g. via res.json()), this transform removes
// any fields that are not relevant to the document's paymentType.
//
// For example, a UPI document will only return:
//   { _id, user, paymentType: "UPI", upiId, createdAt, updatedAt }
// and will NOT include accountNumber, ifscCode, paytmNumber, etc.
//
// This keeps API responses clean — the client never sees null/undefined fields
// that don't apply to the chosen payment type.
// ---------------------------------------------------------------------------
paymentMethodSchema.set('toJSON', {
  transform(_doc, ret) {
    const keepFields = FIELDS_BY_TYPE[ret.paymentType] || [];

    // Collect all type-specific field names across every payment type
    const allTypeFields = new Set(Object.values(FIELDS_BY_TYPE).flat());

    // Remove fields that belong to OTHER payment types (not the current one)
    for (const field of allTypeFields) {
      if (!keepFields.includes(field)) {
        delete ret[field];
      }
    }

    // Remove Mongoose internals
    delete ret.__v;

    return ret;
  },
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
