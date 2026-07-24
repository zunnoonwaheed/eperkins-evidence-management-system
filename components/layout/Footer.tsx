export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: '60px',
      paddingTop: '24px',
      paddingBottom: '24px',
      background: 'var(--bg-subtle)'
    }}>
      <div className="wrap">
        <div style={{
          textAlign: 'center',
          color: 'var(--ink-soft)',
          fontSize: '13px'
        }}>
          © {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
