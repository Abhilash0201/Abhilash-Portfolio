import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Abhilash Uppunuthala — AI & Machine Learning Engineer',
  description: 'AI/ML Engineer and GenAI Architect crafting interactive intelligence systems',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
