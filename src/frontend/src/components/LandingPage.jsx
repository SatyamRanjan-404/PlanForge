import React, { useState } from 'react';
import Dashboard from './Dashboard';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'app'

  const scrollToSection = (id) => {
    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="starlink-theme">
      {/* Navigation Header */}
      <nav className="starlink-nav">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setActiveTab('landing')}>
            <span className="brand-logo">⚡</span>
            <span className="brand-name">PLANFORGE</span>
            <span className="brand-tag">ORCHESTRATOR</span>
          </div>

          <div className="nav-links">
            <button className={`nav-link ${activeTab === 'landing' ? 'active' : ''}`} onClick={() => setActiveTab('landing')}>
              OVERVIEW
            </button>
            <button className="nav-link" onClick={() => scrollToSection('capabilities')}>
              CAPABILITIES
            </button>
            <button className="nav-link" onClick={() => scrollToSection('workflow')}>
              WORKFLOW
            </button>
            <button className={`nav-link ${activeTab === 'app' ? 'active' : ''}`} onClick={() => setActiveTab('app')}>
              LIVE ORCHESTRATOR
            </button>
          </div>

          <div className="nav-actions">
            <button 
              className="btn-starlink-cta" 
              onClick={() => {
                if (activeTab === 'app') {
                  setActiveTab('landing');
                } else {
                  setActiveTab('app');
                }
              }}
            >
              {activeTab === 'app' ? 'VIEW LANDING PAGE' : 'LAUNCH APP'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main View Switcher */}
      {activeTab === 'app' ? (
        <div className="app-wrapper">
          <div className="app-top-banner">
            <span>🚀 PlanForge Live Multi-Agent Orchestrator</span>
            <button className="btn-text-back" onClick={() => setActiveTab('landing')}>← Back to Landing Page</button>
          </div>
          <Dashboard />
        </div>
      ) : (
        <main className="landing-main">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-bg-grid"></div>
            <div className="hero-glow-overlay"></div>
            
            <div className="hero-content">
              <div className="hero-badge">AUTONOMOUS MULTI-AGENT SYSTEM</div>
              <h1 className="hero-title">
                PLANFORGE
              </h1>
              <p className="hero-subtitle">
                An intelligent multi-agent platform that turns high-level goals into fully executed, verified results with zero human friction.
              </p>
              
              <div className="hero-actions">
                <button className="btn-starlink-primary" onClick={() => setActiveTab('app')}>
                  LAUNCH ORCHESTRATOR
                </button>
                <button className="btn-starlink-secondary" onClick={() => scrollToSection('capabilities')}>
                  EXPLORE CAPABILITIES
                </button>
              </div>

              {/* High-Impact Stat Counters */}
              <div className="telemetry-bar">
                <div className="telemetry-item">
                  <span className="telemetry-val">3-Tier</span>
                  <span className="telemetry-lbl">Specialized AI Agents</span>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                  <span className="telemetry-val">100%</span>
                  <span className="telemetry-lbl">Grounded Intelligence</span>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                  <span className="telemetry-val">Self-Healing</span>
                  <span className="telemetry-lbl">Quality Validation</span>
                </div>
                <div className="telemetry-divider"></div>
                <div className="telemetry-item">
                  <span className="telemetry-val">Real-Time</span>
                  <span className="telemetry-lbl">Execution Tracking</span>
                </div>
              </div>

              {/* Hero Image Graphic */}
              <div className="hero-graphic-container">
                <div className="graphic-frame">
                  <img src="/images/hero_network.png" alt="PlanForge Multi-Agent Neural Constellation Network" className="hero-graphic-img" />
                  <div className="graphic-overlay-badge">
                    <span className="live-dot"></span> MULTI-AGENT NETWORK ACTIVE
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Functional Capabilities Section */}
          <section id="capabilities" className="capabilities-section">
            <div className="section-container">
              <div className="section-header-center">
                <div className="section-subtitle-tag">WHAT PLANFORGE DOES</div>
                <h2 className="section-main-title">AUTONOMOUS INTELLIGENCE AT SCALE</h2>
                <p className="section-description">
                  PlanForge coordinates specialized autonomous agents to break down complex goals, generate precise answers, and ensure quality control automatically.
                </p>
              </div>

              <div className="features-grid">
                {/* Feature 1 */}
                <div className="feature-card">
                  <div className="feature-icon">🧭</div>
                  <h3 className="feature-title">Strategic Goal Planning</h3>
                  <div className="feature-role">Planner Agent</div>
                  <p className="feature-text">
                    Instantly transforms open-ended instructions into structured execution roadmaps with clear sub-goals and optimal task ordering.
                  </p>
                  <ul className="feature-bullets">
                    <li>✓ Automatic Subtask Decomposition</li>
                    <li>✓ Smart Dependency Mapping</li>
                    <li>✓ Instant Goal Structuring</li>
                  </ul>
                </div>

                {/* Feature 2 */}
                <div className="feature-card highlighted">
                  <div className="feature-badge">GROUNDED AI</div>
                  <div className="feature-icon">⚡</div>
                  <h3 className="feature-title">Grounded Task Execution</h3>
                  <div className="feature-role">Executor Agent</div>
                  <p className="feature-text">
                    Executes complex research, code generation, and technical tasks using verified factual references for high accuracy.
                  </p>
                  <ul className="feature-bullets">
                    <li>✓ Knowledge-Grounded Reasoning</li>
                    <li>✓ Comprehensive Code &amp; Content Generation</li>
                    <li>✓ Zero-Hallucination Results</li>
                  </ul>
                </div>

                {/* Feature 3 */}
                <div className="feature-card">
                  <div className="feature-icon">🛡️</div>
                  <h3 className="feature-title">Automated Quality Assurance</h3>
                  <div className="feature-role">Validator Agent</div>
                  <p className="feature-text">
                    Evaluates completed work against strict quality benchmarks. Automatically refines and polishes outputs before final delivery.
                  </p>
                  <ul className="feature-bullets">
                    <li>✓ Automated Quality Auditing</li>
                    <li>✓ Self-Healing Iteration Loops</li>
                    <li>✓ High Precision Verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Autonomous Workflow Showcase Section */}
          <section id="workflow" className="architecture-section">
            <div className="section-container">
              <div className="architecture-grid">
                <div className="architecture-text-side">
                  <div className="section-subtitle-tag">HOW IT WORKS</div>
                  <h2 className="section-main-title">SEAMLESS MULTI-AGENT WORKFLOW</h2>
                  <p className="section-description">
                    From initial idea to verified completion, PlanForge automates every stage of project orchestration seamlessly.
                  </p>

                  <div className="arch-steps-list">
                    <div className="arch-step-item">
                      <div className="arch-step-num">01</div>
                      <div>
                        <h4>Submit Any Objective</h4>
                        <p>Input a high-level goal in natural language — from application design to in-depth research topics.</p>
                      </div>
                    </div>
                    <div className="arch-step-item">
                      <div className="arch-step-num">02</div>
                      <div>
                        <h4>Collaborative Agent Execution</h4>
                        <p>Specialized agents autonomously break down, research, and build out each component step-by-step.</p>
                      </div>
                    </div>
                    <div className="arch-step-item">
                      <div className="arch-step-num">03</div>
                      <div>
                        <h4>Verified Final Delivery</h4>
                        <p>Receive rich, structured, validated outputs with complete real-time tracking from start to finish.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="architecture-image-side">
                  <div className="graphic-frame">
                    <img src="/images/architecture_diagram.png" alt="PlanForge Autonomous Workflow Diagram" className="arch-graphic-img" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Call-To-Action Banner (No dashboard preview image) */}
          <section className="preview-section">
            <div className="section-container">
              <div className="cta-banner-card">
                <div className="cta-banner-content">
                  <div className="section-subtitle-tag">GET STARTED NOW</div>
                  <h2 className="cta-title">READY TO ORCHESTRATE YOUR OBJECTIVES?</h2>
                  <p className="cta-desc">
                    Experience autonomous multi-agent intelligence in action right now with the live PlanForge application.
                  </p>
                  <button className="btn-starlink-primary" onClick={() => setActiveTab('app')}>
                    LAUNCH PLANFORGE ORCHESTRATOR
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Starlink Style Footer */}
          <footer className="starlink-footer">
            <div className="footer-container">
              <div className="footer-brand">
                <span>⚡ PLANFORGE</span>
                <span className="footer-copy">© 2026 PLANFORGE INC. ALL RIGHTS RESERVED.</span>
              </div>
              <div className="footer-links">
                <button onClick={() => setActiveTab('landing')}>HOME</button>
                <button onClick={() => scrollToSection('capabilities')}>CAPABILITIES</button>
                <button onClick={() => scrollToSection('workflow')}>WORKFLOW</button>
                <button onClick={() => setActiveTab('app')}>LIVE APP</button>
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
};

export default LandingPage;
