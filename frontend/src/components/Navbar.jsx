import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/payments" className="navbar-brand">
          <span className="navbar-brand-icon">💳</span>
          <span className="navbar-brand-text">PayManager</span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/payments"
            className={`navbar-link ${isActive('/payments') ? 'active' : ''}`}
          >
            Payments
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="navbar-username">{user?.username}</span>
          <button className="navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
