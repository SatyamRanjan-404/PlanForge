import React, { useState, useEffect, useRef } from 'react';
import TaskSubmit from './TaskSubmit';
import TaskDetail from './TaskDetail';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [dbStatus, setDbStatus] = useState('connected'); // 'connected' | 'reconnecting' | 'offline'
  const consecutiveFailsRef = useRef(0);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);

      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        consecutiveFailsRef.current = 0;
        setDbStatus('connected');
      } else if (res.status === 503) {
        // DB is temporarily reconnecting — keep stale data visible
        consecutiveFailsRef.current += 1;
        setDbStatus(consecutiveFailsRef.current > 3 ? 'offline' : 'reconnecting');
      }
    } catch (err) {
      // Network-level error (server fully down)
      consecutiveFailsRef.current += 1;
      setDbStatus('offline');
    }
  };

  // Poll every 5 seconds — fast enough to feel live, slow enough not to hammer the DB
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedTask = tasks.find(t => t._id === selectedTaskId) || null;

  return (
    <div className="app-container">
      <h1 className="header-title">PlanForge Orchestrator</h1>
      <p className="header-subtitle">Multi-Agent State Machine &amp; Live Execution Tracker</p>

      {/* DB Connection Status Banner */}
      {dbStatus !== 'connected' && (
        <div className={`connection-banner ${dbStatus}`}>
          <span className="connection-dot"></span>
          {dbStatus === 'reconnecting'
            ? 'Reconnecting to database — task list is temporarily paused…'
            : 'Database offline — check your connection or MongoDB Atlas whitelist.'}
        </div>
      )}

      <TaskSubmit onTaskSubmitted={fetchTasks} />

      <div className="dashboard-grid">
        <div className="glass-panel tasks-list">
          <h2 className="section-title">
            Queue History
            {dbStatus === 'connected' && <span className="live-dot" title="Live"></span>}
          </h2>
          {tasks.length === 0 && dbStatus === 'connected' && (
            <p className="no-selection">No tasks found. Dispatch one above!</p>
          )}
          
          {tasks.map(task => (
            <div 
              key={task._id} 
              className={`task-card ${selectedTaskId === task._id ? 'active' : ''}`}
              onClick={() => setSelectedTaskId(task._id)}
            >
              <div className="task-header">
                <span className="task-id">#{task._id.slice(-6)}</span>
                <span className={`badge status-${task.status}`}>{task.status}</span>
              </div>
              <div className="task-prompt">{task.originalPrompt}</div>
              
              {task.assignedAgent && (
                <div className="task-assigned">Active Agent: {task.assignedAgent}</div>
              )}
            </div>
          ))}
        </div>

        <TaskDetail task={selectedTask} />
      </div>
    </div>
  );
};

export default Dashboard;
