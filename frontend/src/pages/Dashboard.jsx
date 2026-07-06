import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1>Dashboard</h1>
        <p>Welcome, <strong>{user?.username}</strong>!</p>
        <div className="dashboard-links">
          <Link to="/payments" className="btn btn-primary">Manage Payments</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-secondary">Admin Panel</Link>
          )}
        </div>
      </div>
    </>
  );
}
