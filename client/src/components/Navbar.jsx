import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Study Buddy</Link>
      {user && (
        <div className="nav-right">
          <span>{user.name}</span>
          <button className="btn btn-small" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}