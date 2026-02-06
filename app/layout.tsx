import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fishtank Game',
  description: 'A game built with fishtank-game-template',
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
