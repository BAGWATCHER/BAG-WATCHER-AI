import { useState, useEffect, useCallback } from 'react';
import './App.css';
import {
  trackToken,
  getTokenFlows,
  getTokenHolders,
  getMonitoringStatus,
  getTokenSwaps,
  type TokenFlow,
  type FlowsResponse,
  type HoldersResponse,
  type MonitoringStatus,
  type SwapTransaction,
} from './services/api';

function App() {
  const [tokenMint, setTokenMint] = useState('');
  const [trackedToken, setTrackedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');
  const [flowsData, setFlowsData] = useState<FlowsResponse | null>(null);
  const [holdersData, setHoldersData] = useState<HoldersResponse | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [recentSwaps, setRecentSwaps] = useState<SwapTransaction[]>([]);
  const [timeWindow, setTimeWindow] = useState(60);
  const [tokenMetadata, setTokenMetadata] = useState<{ symbol?: string; name?: string }>({});

  const fetchAllData = useCallback(async (mint?: string) => {
    const targetMint = mint || trackedToken;
    if (!targetMint) return;

    try {
      // Fetch all data in parallel
      const [flows, holders, status, swaps] = await Promise.all([
        getTokenFlows(targetMint, timeWindow),
        getTokenHolders(targetMint),
        getMonitoringStatus(targetMint),
        getTokenSwaps(targetMint, timeWindow),
      ]);

      setFlowsData(flows);
      setHoldersData(holders);
      setMonitoringStatus(status);
      setRecentSwaps(swaps.swaps.slice(0, 10)); // Show last 10 swaps
    } catch (error: any) {
      console.error('Error fetching data:', error);
    }
  }, [trackedToken, timeWindow]);

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
      setTokenMetadata({
        symbol: response.tokenSymbol,
        name: response.tokenName,
      });
      setStatusMessage(
        `Tracking ${response.tokenSymbol || response.tokenMint.slice(0, 8)}... (${response.holderCount} holders). Monitoring for swaps...`
      );
      setStatusType('success');

      // Fetch all data
      fetchAllData(response.tokenMint);
    } catch (error: any) {
      setStatusMessage(`Error: ${error.response?.data?.error || error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 15 seconds
  useEffect(() => {
    if (!trackedToken) return;

    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [trackedToken, timeWindow, fetchAllData]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="app">
      <div className="header">
        <a href="/" className="back-link">← Back to Home</a>
        <img src="/skull-logo.png" alt="Bag Watcher AI" className="logo" />
        <h1>Bag Watcher AI</h1>
        <p>Real-time vamp detection for your bags</p>
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

        {/* Monitoring Status */}
        {monitoringStatus && (
          <div className="monitoring-status">
            <div className="status-indicator">
              <span className={`status-dot ${monitoringStatus.isMonitoring ? 'active' : 'inactive'}`}></span>
              <span>{monitoringStatus.isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}</span>
            </div>
            <div className="status-info">
              <span>Total Swaps Detected: {monitoringStatus.totalSwapsDetected}</span>
            </div>
          </div>
        )}

        {/* Main Grid */}
        {trackedToken && (
          <div className="main-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Token Info */}
              <div className="section token-info-section">
                <h2>Token Information</h2>
                <div className="token-info">
                  <div className="info-row">
                    <span className="label">Symbol:</span>
                    <span className="value">{tokenMetadata.symbol || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{tokenMetadata.name || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value mono">{shortenAddress(trackedToken)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Holders:</span>
                    <span className="value">{holdersData?.holderCount.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              {flowsData && (
                <div className="section stats-section">
                  <h2>Activity Stats (Last {timeWindow} min)</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="value">{flowsData.stats.totalSwaps}</div>
                      <div className="label">Total Swaps</div>
                    </div>
                    <div className="stat-card">
                      <div className="value">{flowsData.stats.uniqueWallets}</div>
                      <div className="label">Active Wallets</div>
                    </div>
                    <div className="stat-card">
                      <div className="value">{flowsData.stats.uniqueDestinations}</div>
                      <div className="label">Destinations</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Holders */}
              {holdersData && (
                <div className="section holders-section">
                  <h2>Top Holders</h2>
                  <div className="holders-list">
                    {holdersData.topHolders.slice(0, 10).map((holder, index) => (
                      <div key={holder.address} className="holder-row">
                        <div className="holder-rank">#{index + 1}</div>
                        <div className="holder-address mono">{shortenAddress(holder.address)}</div>
                        <div className="holder-balance">{holder.uiBalance.toLocaleString(undefined, {
                          maximumFractionDigits: 2
                        })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Capital Flows */}
              <div className="section flows-section">
                <div className="section-header">
                  <h2>Capital Flows</h2>
                  <button className="refresh-btn" onClick={() => fetchAllData()}>
                    Refresh
                  </button>
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
                      Monitoring {holdersData?.holderCount || 0} holders for memecoin-to-memecoin swaps...
                      <br />
                      Swaps will appear here as they are detected.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Swaps */}
              {recentSwaps.length > 0 && (
                <div className="section swaps-section">
                  <h2>Recent Swaps</h2>
                  <div className="swaps-list">
                    {recentSwaps.map((swap) => (
                      <div key={swap.signature} className="swap-row">
                        <div className="swap-time">{formatTimestamp(swap.timestamp)}</div>
                        <div className="swap-details">
                          <div className="swap-wallet mono">{shortenAddress(swap.wallet)}</div>
                          <div className="swap-arrow">→</div>
                          <div className="swap-token mono">{shortenAddress(swap.destinationToken)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
