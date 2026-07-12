import CertificateNav from './CertificateNav';
import CertificateTabs from './CertificateTabs';
import CertificateAge from './CertificateAge';
import PrintButton from './PrintButton';
import Footer from '@/components/layout/Footer';
import type { CertificateDisplay } from '@/types/certificate';

interface CertificateTemplateProps {
  certificate: CertificateDisplay;
}

export default function CertificateTemplate({ certificate }: CertificateTemplateProps) {
  return (
    <>
      <CertificateNav />

      <header className="cert-header">
        <div className="wrap">
          <div className="cert-header-top">
            <div>
              <div className="eyebrow">Certificate of Recorded Consent</div>
              <h1>{certificate.fullName}</h1>
              <div className="cert-id">Certificate ID: {certificate.certificateId}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
              <span className="status-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Verified
              </span>
              <PrintButton />
            </div>
          </div>
          <div className="cert-meta">
            <div className="cert-meta-item">
              <label>Signed</label>
              <div>{certificate.signedDate}</div>
            </div>
            <div className="cert-meta-item">
              <label>Age</label>
              <div>
                <CertificateAge signedDateISO={certificate.signedDateISO} />
              </div>
            </div>
            <div className="cert-meta-item">
              <label>Duration</label>
              <div>{certificate.duration}</div>
            </div>
            <div className="cert-meta-item">
              <label>IP Address</label>
              <div>{certificate.ipAddress}</div>
            </div>
          </div>
        </div>
      </header>

      <CertificateTabs certificate={certificate} />

      <Footer />
    </>
  );
}
