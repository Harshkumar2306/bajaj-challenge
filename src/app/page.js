'use client';

import { useState } from 'react';

export default function Home() {
  const [inputData, setInputData] = useState('[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(inputData);
      } catch (err) {
        throw new Error('Invalid JSON format. Please enter a valid JSON array of strings.');
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Input must be a JSON array.');
      }

      const API_URL = 'https://bajaj-challenge-g0fh.onrender.com/bfhl';
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Hierarchical Nexus</h1>
        <p>Process and visualize complex node relationships instantly.</p>
      </header>

      <main>
        <section className="card">
          <div className="input-group">
            <label htmlFor="node-input" className="input-label">Node Data (JSON Array)</label>
            <textarea
              id="node-input"
              className="textarea"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='["A->B", "B->C"]'
              spellCheck={false}
            />
            <button 
              className="btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner"></div> Processing...</>
              ) : (
                'Process Relationships'
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>

        {response && (
          <section className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Insights Summary</h2>
            
            <div className="summary-stats">
              <div className="stat-box">
                <div className="stat-value">{response.summary.total_trees}</div>
                <div className="stat-label">Valid Trees</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{response.summary.total_cycles}</div>
                <div className="stat-label">Cyclic Groups</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: '#818cf8' }}>
                  {response.summary.largest_tree_root || '-'}
                </div>
                <div className="stat-label">Largest Root</div>
              </div>
            </div>

            {(response.invalid_entries?.length > 0 || response.duplicate_edges?.length > 0) && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {response.invalid_entries?.length > 0 && (
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Invalid Entries</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {response.invalid_entries.map((entry, i) => (
                        <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                          {entry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {response.duplicate_edges?.length > 0 && (
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Duplicate Edges</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {response.duplicate_edges.map((edge, i) => (
                        <span key={i} style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                          {edge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem' }}>Hierarchies</h2>
            <div className="results-grid">
              {response.hierarchies.map((hierarchy, index) => (
                <div key={index} className="result-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>Root: {hierarchy.root}</h3>
                    {hierarchy.has_cycle ? (
                      <span className="badge cycle">Cycle Detected</span>
                    ) : (
                      <span className="badge">Depth: {hierarchy.depth}</span>
                    )}
                  </div>
                  <div className="tree-view">
                    {JSON.stringify(hierarchy.tree, null, 2)}
                  </div>
                </div>
              ))}
              {response.hierarchies.length === 0 && (
                <div style={{ color: 'var(--text-muted)' }}>No hierarchies generated.</div>
              )}
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Identified as: {response.user_id} | {response.email_id} | {response.college_roll_number}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
