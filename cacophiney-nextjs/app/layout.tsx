import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cacophinney Tax Relief — Resolve IRS & State Tax Debt',
  description: 'Owe $10,000 or more in back taxes? Cacophinney helps taxpayers resolve IRS and state tax debt through settlement, penalty relief, and structured plans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
