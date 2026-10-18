import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
    const [stats, setStats] = useState(null);

  const loadDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocs(res.data);
    } catch (err) {
      setError('Could not load your documents');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

    useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please choose a PDF or TXT file first');
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());
      await api.post('/documents/upload', formData);
      setFile(null);
      setTitle('');
      setFileKey((k) => k + 1); // clears the file input
      await loadDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Hi, {user.name} 👋</h2>

      <div className="card">
        <h3>Upload your notes</h3>
        <form onSubmit={handleUpload}>
          <input
            key={fileKey}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={uploading}>
            {uploading ? 'Uploading and reading...' : 'Upload'}
          </button>
        </form>
      </div>

            {stats && stats.attempts > 0 && (
        <div className="card">
          <h3>Your weak topics</h3>
          <p className="muted small">
            Based on {stats.attempts} quiz attempt(s), average score {stats.averageScore}%
          </p>
          {stats.topics.slice(0, 5).map((t) => (
            <div key={t.topic} className="topic-row">
              <div className="row-between">
                <span>{t.topic}</span>
                <span className="muted small">{t.accuracy}% ({t.correct}/{t.total})</span>
              </div>
              <div className="bar">
                <div
                  className={t.accuracy < 60 ? 'bar-fill bar-low' : 'bar-fill'}
                  style={{ width: `${t.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <h3>Your documents</h3>
      {loadingList && <p className="muted">Loading...</p>}
      {!loadingList && docs.length === 0 && (
        <p className="muted">Nothing yet. Upload your first notes above.</p>
      )}
      {docs.map((d) => (
        <Link key={d._id} to={`/documents/${d._id}`} className="doc-item">
          <div>
            <strong>{d.title}</strong>
            <div className="muted small">
              {new Date(d.createdAt).toLocaleDateString()}
            </div>
          </div>
          <span className={d.summary ? 'badge badge-ready' : 'badge'}>
            {d.summary ? 'Study material ready' : 'Not generated yet'}
          </span>
        </Link>
      ))}
    </div>
  );
}