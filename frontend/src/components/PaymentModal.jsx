import { useState, useEffect } from 'react';
import '../styles/payments.css';

/* -----------------------------------------------------------------------
   FIELD DEFINITIONS — single source of truth for which fields each
   payment type needs. Used to render inputs and validate before save.
   ----------------------------------------------------------------------- */
const FIELD_DEFS = {
  Bank: [
    { key: 'ifscCode',          label: 'IFSC Code',             placeholder: 'e.g. HDFC0001234' },
    { key: 'branchName',        label: 'Branch Name',           placeholder: 'e.g. Andheri West' },
    { key: 'bankName',          label: 'Bank Name',             placeholder: 'e.g. HDFC Bank' },
    { key: 'accountNumber',     label: 'Account Number',        placeholder: 'e.g. 12345678901234' },
    { key: 'accountHolderName', label: 'Account Holder Name',   placeholder: 'e.g. John Doe' },
  ],
  Paytm:  [{ key: 'paytmNumber',  label: 'Paytm Number',        placeholder: 'e.g. 9876543210' }],
  UPI:    [{ key: 'upiId',        label: 'UPI ID',              placeholder: 'e.g. name@upi' }],
  PayPal: [{ key: 'paypalEmail',  label: 'PayPal Email',        placeholder: 'e.g. you@paypal.com' }],
  USDT:   [{ key: 'usdtAddress',  label: 'USDT Wallet Address', placeholder: 'e.g. TXqZ5...' }],
};

const PAYMENT_TYPES = ['Bank', 'Paytm', 'UPI', 'PayPal', 'USDT'];

const TYPE_ICONS = { Bank: '🏦', Paytm: '📱', UPI: '⚡', PayPal: '🅿️', USDT: '💲' };

/**
 * PaymentModal — add or edit a payment method.
 *
 * Props:
 *   isOpen      – boolean, whether the modal is visible
 *   onClose     – callback to close
 *   onSave      – async callback(formData) that hits the API
 *   initialData – null for "add", or an existing doc for "edit"
 */
export default function PaymentModal({ isOpen, onClose, onSave, initialData }) {
  const isEdit = !!initialData;

  const [paymentType, setPaymentType] = useState('');
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /* ------ Populate form when modal opens / initialData changes ------ */
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPaymentType(initialData.paymentType);
        // Copy only the relevant fields for this type
        const typeFields = FIELD_DEFS[initialData.paymentType] || [];
        const prefilled = {};
        typeFields.forEach((f) => {
          prefilled[f.key] = initialData[f.key] || '';
        });
        setFields(prefilled);
      } else {
        setPaymentType('');
        setFields({});
      }
      setError('');
    }
  }, [isOpen, initialData]);

  /* ------ When paymentType changes, reset fields (add mode only) ------ */
  const handleTypeChange = (type) => {
    setPaymentType(type);
    setError('');
    if (!isEdit) {
      const blank = {};
      (FIELD_DEFS[type] || []).forEach((f) => {
        blank[f.key] = '';
      });
      setFields(blank);
    }
  };

  /* ------ Field change handler ------ */
  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  /* ------ Submit ------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!paymentType) {
      setError('Please select a payment type.');
      return;
    }

    // Validate all required fields for the selected type
    const typeDefs = FIELD_DEFS[paymentType] || [];
    for (const f of typeDefs) {
      if (!fields[f.key]?.trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({ paymentType, ...fields });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentDefs = FIELD_DEFS[paymentType] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* ---- Header ---- */}
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ---- Payment type selector ---- */}
          <div className="form-group">
            <label htmlFor="pm-type">Payment Type</label>
            {isEdit ? (
              /* In edit mode, type is locked (can't change type without re-creating) */
              <div className="type-badge-locked">
                <span className="type-icon">{TYPE_ICONS[paymentType]}</span>
                {paymentType}
              </div>
            ) : (
              <div className="type-selector">
                {PAYMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`type-chip ${paymentType === t ? 'active' : ''}`}
                    onClick={() => handleTypeChange(t)}
                  >
                    <span className="type-icon">{TYPE_ICONS[t]}</span>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- Conditional fields based on selected paymentType ----
               This is the key UX pattern: the form only shows fields
               relevant to the chosen type. FIELD_DEFS[paymentType]
               drives both the rendering and the validation above.
               -------------------------------------------------------- */}
          {currentDefs.length > 0 && (
            <div className="conditional-fields">
              {currentDefs.map((f) => (
                <div className="form-group" key={f.key}>
                  <label htmlFor={`pm-${f.key}`}>{f.label}</label>
                  <input
                    id={`pm-${f.key}`}
                    type="text"
                    value={fields[f.key] || ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ---- Actions ---- */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !paymentType}
            >
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
