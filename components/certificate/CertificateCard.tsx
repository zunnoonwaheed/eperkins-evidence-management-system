'use client';

import Link from 'next/link';
import type { CertificateDisplay } from '@/types/certificate';

interface CertificateCardProps {
  certificate: CertificateDisplay;
}

export default function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <Link
      href={`/certificates/${certificate.certificateId}`}
      style={{
        display: 'block',
        padding: '24px',
        background: 'var(--paper-raised)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        textDecoration: 'none',
        transition: 'all .15s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--seal)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>
            {certificate.fullName}
          </h3>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '12px' }}>
            {certificate.certificateId}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--ink-soft)' }}>
            <div>
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Signed:</span> {certificate.signedDate}
            </div>
            <div>
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Duration:</span> {certificate.duration}
            </div>
          </div>
        </div>
        <span className="status-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Verified
        </span>
      </div>
    </Link>
  );
}
