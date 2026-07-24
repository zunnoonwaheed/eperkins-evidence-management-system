import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CertificateCard from '@/components/certificate/CertificateCard';
import { getAllCertificates } from '@/lib/database/certificate-repository';

export const metadata = {
  title: 'All Certificates',
  description: 'View all consent verification certificates',
};

import type { CertificateDisplay } from '@/types/certificate';

export default async function CertificatesPage() {
  let certificates: CertificateDisplay[] = [];
  let error = false;

  try {
    certificates = await getAllCertificates();
  } catch (err) {
    console.error('Failed to load certificates:', err);
    error = true;
  }

  return (
    <>
      <Navigation />

      <div className="wrap" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '800px' }}>
          <div className="eyebrow" style={{ marginBottom: '12px' }}>All Certificates</div>
          <h1 style={{ marginBottom: '16px' }}>Consent Verification Certificates</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', lineHeight: 1.6, marginBottom: '48px' }}>
            Browse all verified consent certificates. Each certificate is tamper-evident and independently verifiable.
          </p>

          {error && (
            <div style={{
              padding: '20px',
              background: '#FEE',
              border: '1px solid #C44536',
              borderRadius: '6px',
              marginBottom: '24px',
              color: '#C44536'
            }}>
              Failed to load certificates. Please try again later.
            </div>
          )}

          {!error && certificates.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--ink-soft)'
            }}>
              No certificates found.
            </div>
          )}

          {!error && certificates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {certificates.map((cert) => (
                <CertificateCard key={cert.certificateId} certificate={cert} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
