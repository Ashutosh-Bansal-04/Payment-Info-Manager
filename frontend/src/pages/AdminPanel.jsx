import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getAdminPayments } from '../api';
import '../styles/admin.css';

const PAYMENT_TYPES = ['', 'Bank', 'Paytm', 'UPI', 'PayPal', 'USDT'];
const PAGE_SIZE = 10;

/** Return the single most relevant detail value for a payment row. */
const getDetail = (m) => {
  switch (m.paymentType) {
    case 'Bank':
      return `${m.bankName || '—'} / ${m.accountNumber || '—'} (IFSC: ${m.ifscCode || '—'})`;
    case 'Paytm':  return m.paytmNumber  || '—';
    case 'UPI':    return m.upiId        || '—';
    case 'PayPal': return m.paypalEmail  || '—';
    case 'USDT':   return m.usdtAddress  || '—';
    default:       return '—';
  }
};

const INITIAL_FILTERS = {
  username: '',
  paymentType: '',
  bankName: '',
  ifscCode: '',
  paytmNumber: '',
  upiId: '',
  paypalEmail: '',
  usdtAddress: '',
};

export default function AdminPanel() {
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false); // has the user searched at least once?
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /** Build query params — only include non-empty filters. */
  const buildParams = (pageNum) => {
    const params = { page: pageNum, limit: PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => {
      if (v.trim()) params[k] = v.trim();
    });
    return params;
  };

  const doSearch = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const { data } = await getAdminPayments(buildParams(pageNum));
      setResults(data.results);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalResults);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.request ? 'Cannot reach the server. Please check your connection.' : 'Failed to fetch payments.')
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(1);
  };

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS });
    setResults([]);
    setSearched(false);
    setPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setError('');
  };

  const goPrev = () => { if (page > 1) doSearch(page - 1); };
  const goNext = () => { if (page < totalPages) doSearch(page + 1); };

  return (
    <>
      <Navbar />

      <div className="admin-page">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p className="admin-subtitle">Search and filter all users' payment methods</p>
        </div>

        {/* ============ Filter Bar ============ */}
        <form className="admin-filters" onSubmit={handleSubmit} noValidate>
          <div className="filter-grid">
            <div className="filter-field">
              <label htmlFor="f-username">Username</label>
              <input
                id="f-username"
                type="text"
                value={filters.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="e.g. john"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-type">Payment Type</label>
              <select
                id="f-type"
                value={filters.paymentType}
                onChange={(e) => handleChange('paymentType', e.target.value)}
              >
                <option value="">All Types</option>
                {PAYMENT_TYPES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="f-bank">Bank Name</label>
              <input
                id="f-bank"
                type="text"
                value={filters.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. HDFC"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-ifsc">IFSC Code</label>
              <input
                id="f-ifsc"
                type="text"
                value={filters.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
                placeholder="e.g. HDFC0001234"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-paytm">Paytm Number</label>
              <input
                id="f-paytm"
                type="text"
                value={filters.paytmNumber}
                onChange={(e) => handleChange('paytmNumber', e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-upi">UPI ID</label>
              <input
                id="f-upi"
                type="text"
                value={filters.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="e.g. name@upi"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-paypal">PayPal Email</label>
              <input
                id="f-paypal"
                type="text"
                value={filters.paypalEmail}
                onChange={(e) => handleChange('paypalEmail', e.target.value)}
                placeholder="e.g. user@paypal.com"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="f-usdt">USDT Address</label>
              <input
                id="f-usdt"
                type="text"
                value={filters.usdtAddress}
                onChange={(e) => handleChange('usdtAddress', e.target.value)}
                placeholder="e.g. TXqZ5..."
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        {/* ============ Error ============ */}
        {error && <div className="admin-error">{error}</div>}

        {/* ============ Results ============ */}
        {loading && (
          <div className="admin-loading">
            <div className="spinner" />
            <p>Loading results…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="admin-empty">
            <p>No payment methods found matching your filters.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="admin-results-meta">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
              {' '}({totalResults} total result{totalResults !== 1 ? 's' : ''})
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((m) => (
                    <tr key={m._id}>
                      <td>{m.user?.username || '—'}</td>
                      <td>{m.user?.email || '—'}</td>
                      <td>
                        <span className="admin-type-badge">{m.paymentType}</span>
                      </td>
                      <td className="detail-cell">{getDetail(m)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={goPrev}
                disabled={page <= 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={goNext}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
