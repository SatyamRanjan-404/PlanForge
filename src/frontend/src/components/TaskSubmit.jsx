import React, { useState } from 'react';

const TaskSubmit = ({ onTaskSubmitted }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        setPrompt('');
        onTaskSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit task', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="glass-panel submit-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="input-glow"
        placeholder="Enter a complex objective (e.g., 'Research the latency differences between NVMe and SSD')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
      />
      <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
        {loading ? <div className="spinner"></div> : 'Dispatch'}
      </button>
    </form>
  );
};

export default TaskSubmit;
