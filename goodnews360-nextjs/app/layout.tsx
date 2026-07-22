import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '2026 National Household Savings Survey',
  description: 'Answer six quick questions about your household finances and get matched with federal, state, and private programs you may qualify for.',
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
