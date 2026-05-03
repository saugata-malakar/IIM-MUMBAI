import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedShield — DPDP-Compliant Medical Anonymization',
  description: "India's first production-grade medical data anonymization platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
