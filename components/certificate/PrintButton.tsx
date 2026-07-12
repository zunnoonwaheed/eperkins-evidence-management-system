'use client';

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="btn-print"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        border: '1px solid var(--ink)',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 500,
        borderRadius: '3px',
        cursor: 'pointer',
        fontFamily: 'Inter,sans-serif',
        transition: 'background .15s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--seal-dark)';
        e.currentTarget.style.borderColor = 'var(--seal-dark)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--ink)';
        e.currentTarget.style.borderColor = 'var(--ink)';
      }}
    >
      Print Certificate
    </button>
  );
}
