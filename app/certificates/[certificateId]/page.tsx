import { notFound } from 'next/navigation';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';
import { getCertificateByUuid, getAllCertificates } from '@/lib/database/certificate-repository';
import type { Metadata } from 'next';

interface CertificatePageProps {
  params: Promise<{
    certificateId: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const certificates = await getAllCertificates();
    return certificates.map((cert) => ({
      certificateId: cert.certificateId,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
  const { certificateId } = await params;
  const certificate = await getCertificateByUuid(certificateId);

  if (!certificate) {
    return {
      title: 'Certificate Not Found',
    };
  }

  return {
    title: `Certificate — ${certificate.fullName}`,
    description: `Verified consent certificate for ${certificate.fullName}. Signed on ${certificate.signedDate}.`,
  };
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { certificateId } = await params;
  const certificate = await getCertificateByUuid(certificateId);

  if (!certificate) {
    notFound();
  }

  return <CertificateTemplate certificate={certificate} />;
}
