'use client';

import { useState } from 'react';

export default function FlipCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={`flip-shell ${isFlipped ? 'flipped' : ''}`} onClick={handleClick}>
      <div className="flip-inner">
        <div className="flip-face front">
          <div className="flip-front-inner">
            <div className="seal">
              <svg viewBox="0 0 24 24" fill="none" stroke="#A9702B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="display" style={{fontSize:'19px',fontWeight:600}}>Sample Certificate</div>
            <div className="flip-hint">Click to see what&apos;s inside →</div>
          </div>
        </div>
        <div className="flip-face back">
          <div className="back-row"><label>Certificate ID</label><div>7f3a2c9e1b6d…</div></div>
          <div className="back-row"><label>Timestamp</label><div>2026-07-04 08:41:03 UTC</div></div>
          <div className="back-row"><label>Consent text shown</label><div>v2026-06b</div></div>
          <div className="back-row"><label>Capture method</label><div>IP + form submit</div></div>
          <div className="back-row"><label>Hash algorithm</label><div>HMAC-SHA256</div></div>
          <div className="back-row"><label>Status</label><div style={{color:'#2F6F4F'}}>VERIFIED</div></div>
        </div>
      </div>
    </div>
  );
}
