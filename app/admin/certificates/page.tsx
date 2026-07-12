/**
 * Admin Certificates Page
 *
 * Displays all certificates with filtering capabilities
 * Loads data from Supabase database
 *
 * Query Parameters:
 * - company: Filter by company ID
 * - leadId: Filter by lead ID
 * - status: Filter by certificate status
 * - from: Filter by start date (ISO format)
 * - to: Filter by end date (ISO format)
 *
 * TODO: Add authentication check when auth is implemented
 */

import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { getCertificatesWithFilters } from '@/lib/database/certificate-repository';
import { getAllCompanies } from '@/lib/database/company-repository';
import type { CertificateDisplay } from '@/types/certificate';
import type { CertificateStatus } from '@/types/certificate';

export const metadata = {
  title: 'Admin - All Certificates — E Perkins Law',
  description: 'Manage all consent verification certificates',
};

interface AdminCertificatesPageProps {
  searchParams: Promise<{
    company?: string;
    leadId?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminCertificatesPage({ searchParams }: AdminCertificatesPageProps) {
  const params = await searchParams;

  let certificates: CertificateDisplay[] = [];
  let companies = [];
  let error = false;

  try {
    // Load companies for filter dropdown
    companies = await getAllCompanies(true);

    // Load certificates with filters
    certificates = await getCertificatesWithFilters({
      companyId: params.company,
      leadId: params.leadId,
      status: params.status as CertificateStatus,
      from: params.from,
      to: params.to,
    });
  } catch (err) {
    console.error('Failed to load admin data:', err);
    error = true;
  }

  // Calculate stats
  const stats = {
    total: certificates.length,
    generated: certificates.filter(c => c.status === 'generated').length,
    pending: certificates.filter(c => c.status === 'pending').length,
    processing: certificates.filter(c => c.status === 'processing').length,
    failed: certificates.filter(c => c.status === 'failed').length,
    revoked: certificates.filter(c => c.status === 'revoked').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Admin header */}
      <header style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '16px 0',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="wrap" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <Link href="/" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to site
            </Link>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{ width: '120px' }} />
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
            All Certificates
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
            Manage and view all consent verification certificates
          </p>
        </div>

        {error && (
          <div style={{
            padding: '20px',
            background: '#FEE',
            border: '1px solid #C44536',
            borderRadius: '6px',
            marginBottom: '24px',
            color: '#C44536'
          }}>
            Failed to load certificates. Please check your database configuration.
          </div>
        )}

        {/* Stats cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <StatsCard
            label="Total Certificates"
            value={stats.total}
            color="var(--ink)"
          />
          <StatsCard
            label="Generated"
            value={stats.generated}
            color="var(--verified)"
          />
          <StatsCard
            label="Processing"
            value={stats.processing}
            color="#2563EB"
          />
          <StatsCard
            label="Pending"
            value={stats.pending}
            color="var(--seal)"
          />
          <StatsCard
            label="Failed"
            value={stats.failed}
            color="#C44536"
          />
          <StatsCard
            label="Revoked"
            value={stats.revoked}
            color="#6B7280"
          />
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--paper-raised)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
            Filters
          </div>
          <form method="get" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                Status
              </label>
              <select
                name="status"
                defaultValue={params.status || ''}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">All</option>
                <option value="generated">Generated</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--ink-soft)' }}>
                Lead ID
              </label>
              <input
                type="text"
                name="leadId"
                defaultValue={params.leadId || ''}
                placeholder="Search by lead ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Apply Filters
              </button>
              <Link
                href="/admin/certificates"
                style={{
                  padding: '8px 16px',
                  background: 'var(--paper-raised)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Clear
              </Link>
            </div>
          </form>
        </div>

        {/* Certificates table */}
        {!error && certificates.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--ink-soft)',
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
          }}>
            No certificates found. Try adjusting your filters.
          </div>
        )}

        {!error && certificates.length > 0 && (
          <div style={{
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            overflow: 'auto',
          }}>
            <table style={{
              width: '100%',
              minWidth: '900px',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ background: 'var(--paper-tint)', borderBottom: '1px solid var(--line)' }}>
                  <Th>Certificate ID</Th>
                  <Th>Company</Th>
                  <Th>Lead ID</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Lead Submitted</Th>
                  <Th>Video Generated</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <CertificateRow key={cert.id} certificate={cert} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--paper-raised)',
      border: '1px solid var(--line)',
      borderRadius: '6px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--ink-soft)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function CertificateRow({ certificate }: { certificate: CertificateDisplay }) {
  const statusColors: Record<string, string> = {
    generated: 'var(--verified)',
    processing: '#2563EB',
    pending: 'var(--seal)',
    failed: '#C44536',
    revoked: '#6B7280',
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--line)' }}>
      <td style={{ padding: '16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
        {certificate.cert_uuid.substring(0, 8)}...
      </td>
      <td style={{ padding: '16px', fontSize: '13px' }}>
        {certificate.company?.company_name || '-'}
      </td>
      <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
        {certificate.lead_id}
      </td>
      <td style={{ padding: '16px', fontWeight: 500, fontSize: '14px' }}>
        {certificate.fullName}
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 600,
          background: `${statusColors[certificate.status] || 'var(--ink-soft)'}15`,
          color: statusColors[certificate.status] || 'var(--ink-soft)',
          textTransform: 'capitalize',
        }}>
          {certificate.status}
        </span>
      </td>
      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}>
        {formatDate(certificate.lead_submitted_at)}
      </td>
      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}>
        {formatDate(certificate.video_generated_at)}
      </td>
      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}>
        {formatDate(certificate.created_at)}
      </td>
      <td style={{ padding: '16px' }}>
        <Link
          href={`/certificates/${certificate.certificateId}`}
          style={{
            padding: '6px 12px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          View
        </Link>
      </td>
    </tr>
  );
}
