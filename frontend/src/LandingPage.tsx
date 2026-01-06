import { useState } from 'react';
import './LandingPage.css';

function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add email to waitlist
    console.log('Email submitted:', email);
    setSubmitted(true);
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <img src="/skull-logo.png" alt="Skull Logo" className="skull-logo" />

        <div className="hero-badge">
          <span className="live-dot"></span>
          VAMP SECURITY AGENT
        </div>

        <h1 className="hero-title">
          Bag Watcher
        </h1>

        <p className="hero-subtitle">
          Your bags are being drained. You just don't know it yet.
        </p>

        <p className="hero-description">
          Real-time vamp detection. We monitor where your holders rotate their liquidity —
          so you can see the drain before it shows up on the chart.
        </p>

        <div className="hero-cta">
          <a href="#app" className="btn-primary">
            Start Watching Your Bags
          </a>
          <a href="#how-it-works" className="btn-secondary">
            See How It Works
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">&lt;1s</div>
            <div className="stat-label">Detection Speed</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem" id="problem">
        <h2>You're Trading Blind</h2>

        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon">📉</div>
            <h3>Price Lags Flow</h3>
            <p>
              By the time the chart shows it, the smart money already rotated.
              You're always one step behind.
            </p>
          </div>

          <div className="problem-card">
            <div className="problem-icon">🧛</div>
            <h3>Vamps Are Silent</h3>
            <p>
              New tokens don't announce themselves. They just quietly drain your bag
              while you're watching charts.
            </p>
          </div>

          <div className="problem-card">
            <div className="problem-icon">⏰</div>
            <h3>You React Too Late</h3>
            <p>
              You notice the bleed after -30%. The whales noticed at -5%.
              That's the difference.
            </p>
          </div>
        </div>

        <div className="problem-statement">
          <p className="big-text">
            On Solana, your bags don't die because the token is bad.
          </p>
          <p className="big-text">
            They die because <span className="highlight">something better vamped the liquidity</span>.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution" id="how-it-works">
        <h2>Watch the Money, Not the Chart</h2>

        <div className="solution-flow">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Enter Your Bags</h3>
              <p>Add the tokens you're holding. We monitor ALL their holders in real-time.</p>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>We Track Every Swap</h3>
              <p>When holders sell, we see exactly where they rotate the liquidity.</p>
            </div>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>You See the Vamp</h3>
              <p>Get alerts when your bag is being drained to another token — before it's obvious.</p>
            </div>
          </div>
        </div>

        <div className="solution-example">
          <div className="example-header">
            <h4>Example: You're holding $PEPE2</h4>
          </div>
          <div className="example-content">
            <div className="example-before">
              <h5>Without Bag Watcher:</h5>
              <ul>
                <li>Price slowly bleeds</li>
                <li>You check the charts</li>
                <li>Down 25% already</li>
                <li>Panic sell at the bottom</li>
              </ul>
            </div>
            <div className="example-after">
              <h5>With Bag Watcher:</h5>
              <ul>
                <li>Alert: "50 holders rotated to $PEPE3"</li>
                <li>You see it at -5%</li>
                <li>Exit early or rotate with them</li>
                <li>Avoid the -25% dump</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Features That Actually Matter</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Flow Detection</h3>
            <p>
              Webhooks catch every swap the instant it happens. Not 15 seconds later.
              Not on the next candle. Instantly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Vamp Rankings</h3>
            <p>
              See which tokens are pulling the most liquidity from your bags,
              ranked by number of rotators and volume.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>All Holders, Not Just Top 100</h3>
            <p>
              We monitor up to 100,000 holders per token. When the bottom
              starts rotating, you'll know.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Flow Momentum</h3>
            <p>
              Is the rotation accelerating or slowing down? Momentum matters
              more than total count.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Alerts</h3>
            <p>
              Only get notified when it matters. We filter out noise and show
              you actual vamp threats.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Solana Native</h3>
            <p>
              Built specifically for Pump.fun and Solana memecoin mechanics.
              Not a generic crypto tool.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta" id="app">
        <h2>Start Protecting Your Bags</h2>
        <p className="cta-subtitle">
          Free during launch. No credit card. Just paste your token address.
        </p>

        <div className="cta-buttons">
          <a href="/app" className="btn-primary large">
            Launch App
          </a>
        </div>

        <p className="cta-note">
          ⚠️ This is NOT financial advice. This is liquidity intelligence.
        </p>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <h2>Questions</h2>

        <div className="faq-grid">
          <div className="faq-item">
            <h4>Is this trading advice?</h4>
            <p>
              No. We show you data. What you do with it is your call.
              We're not telling you what to buy or sell.
            </p>
          </div>

          <div className="faq-item">
            <h4>How is this different from price alerts?</h4>
            <p>
              Price alerts tell you what already happened. We show you where
              the liquidity is flowing BEFORE it shows up on the chart.
            </p>
          </div>

          <div className="faq-item">
            <h4>Does it work for all Solana tokens?</h4>
            <p>
              Yes. Standard SPL tokens and Token-2022 (Pump.fun) tokens.
              We automatically detect which type.
            </p>
          </div>

          <div className="faq-item">
            <h4>Why is it free?</h4>
            <p>
              It's free during launch to build the user base. Premium features
              and alerts coming soon.
            </p>
          </div>

          <div className="faq-item">
            <h4>Can I track multiple bags?</h4>
            <p>
              Coming soon. Right now it's one token at a time. Multi-bag
              dashboard is in development.
            </p>
          </div>

          <div className="faq-item">
            <h4>How fast is "real-time"?</h4>
            <p>
              Less than 1 second from swap to notification. We use Helius
              webhooks, not polling.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Bag Watcher AI</h3>
            <p>Vamp detection for your liquidity</p>
          </div>

          <div className="footer-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#app">Launch App</a>
            <a href="https://twitter.com" target="_blank" rel="noopener">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p>
            ⚠️ NOT FINANCIAL ADVICE. This tool shows liquidity flows.
            Use at your own risk. Crypto is volatile. DYOR.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
