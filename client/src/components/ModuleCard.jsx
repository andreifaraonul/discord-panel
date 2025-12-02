import React from 'react';

export default function ModuleCard({ module, loading, onToggle }) {
  return (
    <article className="card">
      <header>
        <div>
          <p className="badge">Module</p>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.1rem' }}>{module.name}</h3>
        </div>
        <button
          className={`module-toggle ${module.enabled ? 'active' : ''}`}
          disabled={loading}
          onClick={() => onToggle(module.id)}
        >
          {module.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </header>
      <p style={{ margin: 0, color: '#cbd5e1' }}>{module.description || 'No description yet.'}</p>
    </article>
  );
}
