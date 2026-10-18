import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Hi, {user.name} 👋</h2>
      <div className="card">
        <p className="muted">Your uploads and study material will appear here (Piece 8).</p>
      </div>
    </div>
  );
}