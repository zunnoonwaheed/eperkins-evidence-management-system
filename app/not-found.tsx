import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="error-card">
        <h1>Page Not Found</h1>
        <p>
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved or deleted.
        </p>
        <Link href="/" className="btn-primary">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
