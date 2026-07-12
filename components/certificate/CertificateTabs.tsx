'use client';

import { useState } from 'react';
import type { CertificateDisplay } from '@/types/certificate';

interface CertificateTabsProps {
  certificate: CertificateDisplay;
}

export default function CertificateTabs({ certificate }: CertificateTabsProps) {
  const [activeTab, setActiveTab] = useState<'certificate' | 'replay' | 'history'>('certificate');

  return (
    <>
      <div className="tabs-container">
        <div className="wrap">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'certificate' ? 'active' : ''}`}
              onClick={() => setActiveTab('certificate')}
            >
              Certificate
            </button>
            <button
              className={`tab ${activeTab === 'replay' ? 'active' : ''}`}
              onClick={() => setActiveTab('replay')}
            >
              Session Replay
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className={`tab-content ${activeTab === 'certificate' ? 'active' : ''}`}>
          <p style={{fontSize:'15px', color:'var(--ink-soft)', lineHeight:1.6, margin:'0 0 32px', maxWidth:'820px'}}>
            This certificate was issued by E Perkins Law, the independent Internet lead certification authority. It certifies the following information about this lead:
          </p>

          <h2 style={{fontFamily:'Fraunces,serif', fontSize:'24px', fontWeight:600, color:'var(--ink)', margin:'0 0 24px', paddingBottom:'18px', borderBottom:'1px solid var(--line)'}}>
            Session Information
          </h2>

          <div className="info-grid">
            <div className="info-field">
              <label>Date of Visit</label>
              <div>{certificate.dateOfVisit}</div>
            </div>
            <div className="info-field">
              <label>Time of Visit</label>
              <div>{certificate.timeOfVisit}</div>
            </div>
            <div className="info-field">
              <label>Time on Page</label>
              <div>{certificate.duration}</div>
            </div>
            <div className="info-field">
              <label>Remote IP Address</label>
              <div>{certificate.ipAddress}</div>
            </div>
            <div className="info-field">
              <label>Consent Version</label>
              <div>{certificate.consentVersion}</div>
            </div>
            <div className="info-field">
              <label>Certificate Number</label>
              <div style={{wordBreak:'break-all',fontFamily:'JetBrains Mono,monospace',fontSize:'12px'}}>
                {certificate.certificateId}
              </div>
            </div>
          </div>

          <h2 style={{fontFamily:'Fraunces,serif', fontSize:'24px', fontWeight:600, color:'var(--ink)', margin:'48px 0 24px', paddingBottom:'18px', borderBottom:'1px solid var(--line)'}}>
            Lead Information
          </h2>

          <div className="info-grid">
            <div className="info-field">
              <label>First Name</label>
              <div>{certificate.firstName}</div>
            </div>
            <div className="info-field">
              <label>Last Name</label>
              <div>{certificate.lastName}</div>
            </div>
            <div className="info-field">
              <label>Email</label>
              <div>{certificate.email}</div>
            </div>
            <div className="info-field">
              <label>Phone</label>
              <div>{certificate.phone}</div>
            </div>
            <div className="info-field wide">
              <label>Tax Debt Amount</label>
              <div>{certificate.taxDebtAmount}</div>
            </div>
          </div>

          <h2 style={{fontFamily:'Fraunces,serif', fontSize:'24px', fontWeight:600, color:'var(--ink)', margin:'48px 0 24px', paddingBottom:'18px', borderBottom:'1px solid var(--line)'}}>
            What did they see?
          </h2>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'32px', flexWrap:'wrap'}}>
            <p style={{fontSize:'14px', color:'var(--ink-soft)', lineHeight:1.7, margin:0, maxWidth:'640px'}}>
              E Perkins Law records both the web page content viewed by the visitor and the user actions performed on the page. These recorded events are then replayed, providing a session playback that showcases the user&apos;s interaction with the page.
            </p>
            <button
              onClick={() => setActiveTab('replay')}
              style={{background:'var(--verified)', color:'var(--paper)', border:'none', borderRadius:'4px', padding:'13px 22px', fontSize:'14px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif', transition:'background .15s ease'}}
              onMouseOver={(e) => e.currentTarget.style.background = '#26614A'}
              onMouseOut={(e) => e.currentTarget.style.background = '#2F6F4F'}
            >
              View Session Replay
            </button>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'replay' ? 'active' : ''}`}>
          <div className="video-container">
            <div className="video-wrapper">
              <video controls playsInline preload="metadata" src={certificate.videoFile}></video>
            </div>
            <div className="video-meta">
              <div className="video-meta-item">
                <label>Duration:</label>
                <span>{certificate.duration}</span>
              </div>
              <div className="video-meta-item">
                <label>Recorded:</label>
                <span>{certificate.signedDate}</span>
              </div>
              <div className="video-meta-item">
                <label>Format:</label>
                <span>{certificate.videoFormat}</span>
              </div>
            </div>
          </div>
          <p style={{color:'var(--ink-soft)',fontSize:'14px',lineHeight:1.6}}>
            This session replay shows the exact consent flow as experienced by the user. The recording is tamper-evident and locked at the time of capture.
          </p>
        </div>

        <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}>
          <div className="history-timeline">
            {certificate.historyEvents.map((event, index) => (
              <div className="history-item" key={index}>
                <div className="history-time">
                  {event.date}<br/>{event.time}
                </div>
                <div className="history-content">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
