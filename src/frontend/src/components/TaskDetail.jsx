import React from 'react';

const TaskDetail = ({ task }) => {
  if (!task) {
    return (
      <div className="glass-panel task-detail">
        <div className="no-selection">Select a task to view its orchestration journey</div>
      </div>
    );
  }

  const subtasks = task.metadata?.subtasks || [];

  return (
    <div className="glass-panel task-detail">
      <h2 className="section-title">Execution Breakdown</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Original Objective</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{task.originalPrompt}</p>
        {task.metadata?.error && (
           <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: '8px', border: '1px solid var(--accent-rose)'}}>
             <strong>Error Log:</strong> {task.metadata.error}
           </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Planner Output ({subtasks.length} Subtasks)</h3>
        
        {subtasks.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Waiting for Planner to decompose task...</p>
        ) : (
          <div>
            {subtasks.map((st) => (
              <div key={st.id} className={`subtask-item ${st.status}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong>Step {st.id}</strong>
                    <span className={`badge status-${st.status}`}>{st.status}</span>
                </div>
                <div className="subtask-desc">{st.description}</div>
                
                {st.result && (
                  <div className="subtask-meta">
                    <strong>Executor Result:</strong>
                    <pre>{st.result}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
