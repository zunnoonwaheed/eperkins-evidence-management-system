import Navigation from '@/components/layout/Navigation';
import FlipCard from '@/components/ui/FlipCard';

export default function HomePage() {
  return (
    <>
      <Navigation />

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Consent verification certificates</div>
            <h1>Verified consent.<br/><em>Defensible evidence.</em></h1>
            <p className="hero-sub">Every recorded consent becomes a timestamped, tamper-evident certificate that can be independently verified. When a dispute arises, the evidence is organized, authenticated, and ready to support your case.</p>
            <div className="hero-actions">
              <a href="#sample" className="btn-primary">View a sample certificate</a>
              <a href="#how" className="btn-text">See how it works</a>
            </div>
          </div>

          <div className="cert-shell">
            <div className="cert">
              <div className="cert-top">
                <div className="cert-title">
                  <b>Certificate of Recorded Consent</b>
                  Issued automatically at time of capture
                </div>
                <div className="seal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#A9702B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>

              <div className="cert-fields">
                <div className="cert-field">
                  <label>Issued</label>
                  <div>Jul 4, 2026 · 08:41 UTC</div>
                </div>
                <div className="cert-field">
                  <label>Record type</label>
                  <div>Voice consent recording</div>
                </div>
                <div className="cert-field wide">
                  <label>Certificate ID</label>
                  <div className="hash">7f3a2c9e1b6d4f80a5c7e2913b4d6f01c8e9a2b7</div>
                </div>
              </div>

              <div className="cert-status">
                <span className="status-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Verified
                </span>
                <div className="cert-note">Locked at creation. Not editable after issue.</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="what" className="on-line">
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">What you get</div>
            <h2>A certificate for every recording, without the extra work.</h2>
            <p>The system runs alongside the recordings you&apos;re already capturing — it doesn&apos;t ask anyone to do anything differently.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="num">01</div>
              <h3>Automatic</h3>
              <p>The moment a consent recording is captured, a certificate is generated. No manual filing, no separate upload, no one has to remember to do it.</p>
            </div>
            <div className="feature-card">
              <div className="num">02</div>
              <h3>Verifiable</h3>
              <p>Every certificate has its own link. Anyone reviewing a dispute can open it and confirm it&apos;s real — no account, no back-and-forth.</p>
            </div>
            <div className="feature-card">
              <div className="num">03</div>
              <h3>Tamper-evident</h3>
              <p>Certificates lock at the moment they&apos;re created. If a recording is ever questioned, the record hasn&apos;t moved since the day it was made.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="on-line">
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">How it works</div>
            <h2>Four steps, all of them automatic.</h2>
            <p>From recording to record — the certificate follows the consent, not the other way around.</p>
          </div>

          <div className="process">
            <div className="process-step">
              <div className="step-num">1</div>
              <h4>Recording captured</h4>
              <p>Consent is recorded through the normal flow — nothing changes for the person collecting it.</p>
            </div>
            <div className="process-step">
              <div className="step-num">2</div>
              <h4>Certificate generated</h4>
              <p>A unique certificate is created within seconds, with its own ID and timestamp.</p>
            </div>
            <div className="process-step">
              <div className="step-num">3</div>
              <h4>Certificate stored</h4>
              <p>The certificate is locked in place. It can be viewed, never edited.</p>
            </div>
            <div className="process-step">
              <div className="step-num">4</div>
              <h4>Record linked</h4>
              <p>The certificate link attaches back to the matching lead or account record automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="sample" className="flip-section on-line">
        <div className="wrap">
          <FlipCard />

          <div className="flip-copy">
            <div className="section-eyebrow">See it work</div>
            <h3>Every field, in the open.</h3>
            <p>A certificate isn&apos;t a summary — it&apos;s the actual record. The timestamp, the consent language shown, the capture method, and the verification hash are all right there, for anyone who needs to check.</p>
            <a href="#contact" className="btn-text">Talk to us about your setup</a>
          </div>
        </div>
      </section>

      <section id="contact" className="closing on-line">
        <div className="wrap">
          <h2>Get a certificate system built for what you&apos;re already recording.</h2>
          <p>If you&apos;re capturing consent today, we can have it generating certificates without changing your workflow.</p>
          <p style={{fontSize: '16px', color: 'var(--ink)', marginBottom: '24px'}}>
            Email us at <a href="mailto:support@eperkinslaw.com" style={{color: 'var(--seal-dark)', textDecoration: 'underline'}}>support@eperkinslaw.com</a>
          </p>
          <a href="mailto:support@eperkinslaw.com?subject=Certificate%20System%20Inquiry&body=Hello%2C%0A%0AI%27m%20interested%20in%20getting%20a%20certificate%20system%20built%20for%20what%20we%27re%20already%20recording.%0A%0AIf%20we%27re%20capturing%20consent%20today%2C%20I%27d%20like%20to%20learn%20how%20you%20can%20have%20it%20generating%20certificates%20without%20changing%20our%20workflow.%0A%0APlease%20write%20your%20message%20here%3A%0A%0A" className="btn-primary">Get in touch</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand display">Certificate System</div>
          <div>Consent verification certificates</div>
        </div>
      </footer>
    </>
  );
}
