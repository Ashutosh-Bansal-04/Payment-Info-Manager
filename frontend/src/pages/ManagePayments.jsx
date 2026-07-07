import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PaymentModal from '../components/PaymentModal';
import { useToast } from '../context/ToastContext';
import { getMyPayments, addPayment, updatePayment, deletePayment } from '../api';
import '../styles/payments.css';

/* ---- Helpers ---- */
const TYPE_ICONS = { Bank: '🏦', Paytm: '📱', UPI: '⚡', PayPal: '🅿️', USDT: '💲' };

/**
 * Returns the "headline" value to display on a payment card.
 * Long values (like USDT addresses) are truncated with an ellipsis in the middle.
 */
const getHeadline = (method) => {
  switch (method.paymentType) {
    case 'Bank': {
      // Mask account number: show last 4 digits
      const acc = method.accountNumber || '';
      const masked = acc.length > 4 ? '•••• ' + acc.slice(-4) : acc;
      return `${method.bankName || 'Bank'} — ${masked}`;
    }
    case 'Paytm':
      return method.paytmNumber || '—';
    case 'UPI':
      return method.upiId || '—';
    case 'PayPal':
      return method.paypalEmail || '—';
    case 'USDT': {
      const addr = method.usdtAddress || '';
      if (addr.length > 16) {
        return addr.slice(0, 8) + '…' + addr.slice(-6);
      }
      return addr || '—';
    }
    default:
      return '—';
  }
};

export default function ManagePayments() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null); // null = add mode

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ------ Fetch payments ------ */
  const fetchPayments = useCallback(async () => {
    try {
      setError('');
      const { data } = await getMyPayments();
      setMethods(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.request ? 'Cannot reach the server. Please check your connection.' : 'Failed to load payment methods.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /* ------ Add ------ */
  const handleAdd = () => {
    setEditingMethod(null);
    setModalOpen(true);
  };

  /* ------ Edit ------ */
  const handleEdit = (method) => {
    setEditingMethod(method);
    setModalOpen(true);
  };

  /* ------ Save (add or edit) ------ */
  const handleSave = async (formData) => {
    if (editingMethod) {
      await updatePayment(editingMethod._id, formData);
      addToast('Payment method updated!', 'success');
    } else {
      await addPayment(formData);
      addToast('Payment method added!', 'success');
    }
    await fetchPayments();
  };

  /* ------ Delete ------ */
  const confirmDelete = (method) => {
    setDeleteTarget(method);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePayment(deleteTarget._id);
      setDeleteTarget(null);
      addToast('Payment method deleted.', 'success');
      await fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete.', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="payments-page">
        {/* ---- Header ---- */}
        <div className="payments-header">
          <h1>Manage Payment</h1>
          <p className="payments-subtitle">Your saved payment methods</p>
        </div>

        {/* ---- Add button ---- */}
        <button className="add-payment-btn" onClick={handleAdd}>
          <span className="add-payment-icon">+</span>
          <span>Add Payment Method</span>
        </button>

        {/* ---- Error ---- */}
        {error && <div className="payments-error">{error}</div>}

        {/* ---- Loading ---- */}
        {loading && (
          <div className="payments-loading">
            <div className="spinner" />
            <p>Loading payments…</p>
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!loading && methods.length === 0 && !error && (
          <div className="payments-empty">
            <div className="payments-empty-icon">💳</div>
            <h3>No payment methods yet</h3>
            <p>Add your first payment method to get started.</p>
          </div>
        )}

        {/* ---- Payment cards list ---- */}
        {!loading && methods.length > 0 && (
          <div className="payments-list">
            {methods.map((m) => (
              <div className="payment-card" key={m._id}>
                <div className="payment-card-left">
                  <div className="payment-type-badge">
                    <span className="payment-type-icon">{TYPE_ICONS[m.paymentType]}</span>
                    <span className="payment-type-label">{m.paymentType}</span>
                  </div>
                  <p className="payment-headline">{getHeadline(m)}</p>
                </div>

                <div className="payment-card-actions">
                  <button
                    className="card-action-btn edit"
                    onClick={() => handleEdit(m)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="card-action-btn delete"
                    onClick={() => confirmDelete(m)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Add / Edit Modal ---- */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingMethod}
      />

      {/* ---- Delete Confirmation ---- */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Payment Method?</h3>
            <p>
              Are you sure you want to delete this{' '}
              <strong>{deleteTarget.paymentType}</strong> payment method? This
              action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
