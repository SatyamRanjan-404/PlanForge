import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TaskSubmit = ({ onTaskSubmitted }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        setPrompt('');
        onTaskSubmitted();
      } else if (res.status === 503) {
        setError('Database is reconnecting — please try again in a moment.');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to dispatch task. Please try again.');
      }
    } catch (err) {
      setError('Cannot reach the backend server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="glass-panel submit-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-glow"
          placeholder="Enter a complex objective (e.g., 'Research the latency differences between NVMe and SSD')"
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setError(null); }}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
          {loading ? <div className="spinner"></div> : 'Dispatch'}
        </button>
      </form>
      {error && (
        <div className="submit-error-banner">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default TaskSubmit;
