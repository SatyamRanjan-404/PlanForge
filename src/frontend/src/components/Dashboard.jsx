import React, { useState, useEffect } from 'react';
import TaskSubmit from './TaskSubmit';
import TaskDetail from './TaskDetail';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  // Short Polling implementation (pings REST API every 2 seconds)
  useEffect(() => {
    fetchTasks(); // initial fetch
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const selectedTask = tasks.find(t => t._id === selectedTaskId) || null;

  return (
    <div className="app-container">
      <h1 className="header-title">Nexus Orchestrator</h1>
      <p className="header-subtitle">Multi-Agent State Machine & Live Execution Tracker</p>

      <TaskSubmit onTaskSubmitted={fetchTasks} />

      <div className="dashboard-grid">
        <div className="glass-panel tasks-list">
          <h2 className="section-title">Queue History</h2>
          {tasks.length === 0 && <p className="no-selection">No tasks found. Dispatch one above!</p>}
          
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
