import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: '60px',
      paddingTop: '40px',
      paddingBottom: '40px',
      background: 'var(--bg-subtle)'
    }}>
      <div className="wrap">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '32px'
        }}>
          {/* Brand */}
          <div>
            <div className="brand display" style={{ marginBottom: '8px' }}>Certificate System</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
              Consent verification certificates
            </div>
          </div>

          {/* System Info */}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              System
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                color: 'var(--ink-soft)',
                fontSize: '14px'
              }}>
                🔒 Tamper-evident
              </div>
              <div style={{
                color: 'var(--ink-soft)',
                fontSize: '14px'
              }}>
                ✓ Independently verifiable
              </div>
              <div style={{
                color: 'var(--ink-soft)',
                fontSize: '14px'
              }}>
                📹 Video evidence
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--ink-soft)',
          fontSize: '13px'
        }}>
          © {new Date().getFullYear()} Certificate System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
