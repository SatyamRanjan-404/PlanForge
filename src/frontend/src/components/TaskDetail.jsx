import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const TaskDetail = ({ task }) => {
  if (!task) {
    return (
      <div className="glass-panel task-detail">
        <div className="no-selection">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>⚡</div>
            <div>Select a task to view its orchestration journey</div>
          </div>
        </div>
      </div>
    );
  }

  const subtasks = task.metadata?.subtasks || [];

  return (
    <div className="glass-panel task-detail">
      <h2 className="section-title">Execution Breakdown</h2>
      
      {/* User Objective Prompt Card */}
      <div className="user-prompt-card">
        <div className="user-avatar">👤</div>
        <div className="user-prompt-body">
          <div className="prompt-label">User Objective</div>
          <div className="prompt-text">{task.originalPrompt}</div>
        </div>
      </div>

      {task.metadata?.error && (
        <div className="error-banner">
          <strong>⚠️ Execution Error:</strong> {task.metadata.error}
        </div>
      )}

      {/* Agent Response Stream */}
      <div className="agent-responses-container">
        <h3 className="subtasks-header">
          <span>Agent Execution Steps</span>
          <span className="subtask-count-badge">{subtasks.length} Subtasks</span>
        </h3>
        
        {subtasks.length === 0 ? (
          <div className="planning-loader">
            <div className="spinner"></div>
            <span>Planner agent is analyzing objective and generating execution subtasks...</span>
          </div>
        ) : (
          <div className="subtasks-list">
            {subtasks.map((st, index) => (
              <div key={st.id || index} className={`chatgpt-subtask-card ${st.status}`}>
                {/* Step Header */}
                <div className="subtask-card-header">
                  <div className="subtask-title-group">
                    <div className="agent-avatar">🤖</div>
                    <div>
                      <div className="subtask-step-id">Step {st.id || index + 1}</div>
                      <div className="subtask-desc">{st.description}</div>
                    </div>
                  </div>
                  <span className={`badge status-${st.status}`}>{st.status}</span>
                </div>
                
                {/* ChatGPT-style Formatted Response Body */}
                {st.result ? (
                  <div className="chatgpt-response-box">
                    <div className="response-box-header">
                      <span className="response-icon">✨</span>
                      <span>Executor Output</span>
                    </div>
                    <MarkdownRenderer content={st.result} />
                  </div>
                ) : st.status === 'EXECUTING' || st.status === 'VALIDATING' ? (
                  <div className="executing-placeholder">
                    <div className="spinner-small"></div>
                    <span>Agent working on this step...</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
