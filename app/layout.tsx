import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Certificate System — Consent Verification Certificates",
  description: "Every recorded consent becomes a timestamped, tamper-evident certificate that can be independently verified.",
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
