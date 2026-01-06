import { useState, useEffect } from 'react';
import './App.css';
import { trackToken, getTokenFlows, TokenFlow, FlowsResponse } from './services/api';

function App() {
  const [tokenMint, setTokenMint] = useState('');
  const [trackedToken, setTrackedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');
  const [flowsData, setFlowsData] = useState<FlowsResponse | null>(null);
  const [timeWindow, setTimeWindow] = useState(60);

  const handleTrackToken = async () => {
    if (!tokenMint.trim()) {
      setStatusMessage('Please enter a token mint address');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      const response = await trackToken(tokenMint.trim());
      setTrackedToken(response.tokenMint);
      setStatusMessage(
        `Tracking ${response.tokenSymbol || response.tokenMint.slice(0, 8)}... (${response.holderCount} holders). Monitoring for swaps...`
      );
      setStatusType('success');

      // Start fetching flows
      fetchFlows(response.tokenMint);
    } catch (error: any) {
      setStatusMessage(`Error: ${error.response?.data?.error || error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlows = async (mint?: string) => {
    const targetMint = mint || trackedToken;
    if (!targetMint) return;

    try {
      const data = await getTokenFlows(targetMint, timeWindow);
      setFlowsData(data);
    } catch (error: any) {
      console.error('Error fetching flows:', error);
    }
  };

  // Auto-refresh flows every 30 seconds
  useEffect(() => {
    if (!trackedToken) return;

    fetchFlows();
    const interval = setInterval(() => {
      fetchFlows();
    }, 30000);

    return () => clearInterval(interval);
  }, [trackedToken, timeWindow]);

  return (
    <div className="app">
      <div className="header">
        <h1>Trench Maps</h1>
        <p>Track where memecoin holders are rotating their capital</p>
      </div>

      <div className="container">
        {/* Input Section */}
        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Solana token mint address..."
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackToken()}
            />
            <button onClick={handleTrackToken} disabled={loading}>
              {loading ? 'Tracking...' : 'Track Token'}
            </button>
          </div>

          {statusMessage && (
            <div className={`status ${statusType}`}>{statusMessage}</div>
          )}
        </div>

        {/* Stats Section */}
        {flowsData && (
          <div className="stats-section">
            <h2>Stats (Last {timeWindow} minutes)</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="value">{flowsData.stats.totalSwaps}</div>
                <div className="label">Total Swaps</div>
              </div>
              <div className="stat-card">
                <div className="value">{flowsData.stats.uniqueWallets}</div>
                <div className="label">Unique Wallets</div>
              </div>
              <div className="stat-card">
                <div className="value">{flowsData.stats.uniqueDestinations}</div>
                <div className="label">Destination Tokens</div>
              </div>
            </div>
          </div>
        )}

        {/* Flows Section */}
        {trackedToken && (
          <div className="flows-section">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Capital Flows</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className="refresh-btn" onClick={() => fetchFlows()}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="time-filters">
              <button
                className={`time-filter-btn ${timeWindow === 15 ? 'active' : ''}`}
                onClick={() => setTimeWindow(15)}
              >
                15 min
              </button>
              <button
                className={`time-filter-btn ${timeWindow === 60 ? 'active' : ''}`}
                onClick={() => setTimeWindow(60)}
              >
                1 hour
              </button>
              <button
                className={`time-filter-btn ${timeWindow === 240 ? 'active' : ''}`}
                onClick={() => setTimeWindow(240)}
              >
                4 hours
              </button>
              <button
                className={`time-filter-btn ${timeWindow === 1440 ? 'active' : ''}`}
                onClick={() => setTimeWindow(1440)}
              >
                24 hours
              </button>
            </div>

            {flowsData?.flows && flowsData.flows.length > 0 ? (
              <div className="flow-list">
                {flowsData.flows.map((flow: TokenFlow, index: number) => (
                  <div key={flow.tokenMint} className="flow-card">
                    <div className="flow-header">
                      <div className="flow-token">
                        <div className="flow-rank">#{index + 1}</div>
                        <div className="flow-token-info">
                          <h3>{flow.tokenSymbol || 'Unknown Token'}</h3>
                          <div className="token-address">
                            {flow.tokenMint.slice(0, 8)}...{flow.tokenMint.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flow-metrics">
                      <div className="metric">
                        <div className="value">{flow.uniqueWallets}</div>
                        <div className="label">Wallets</div>
                      </div>
                      <div className="metric">
                        <div className="value">{flow.totalSwaps}</div>
                        <div className="label">Swaps</div>
                      </div>
                      <div className="metric">
                        <div className="value">
                          {flow.totalVolume.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="label">Volume</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No swaps detected yet</h3>
                <p>
                  Monitoring holders for memecoin-to-memecoin swaps...
                  <br />
                  This may take a few minutes as we scan transactions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
