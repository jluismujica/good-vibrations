import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Good Vibrations — Buenas Noticias',
  description: 'Un espacio calmo, luminoso y constructivo. Novedades de Los Tres, Pink Floyd, Queen, IA con impacto real, psicología formal y las mejores noticias de Chile y el mundo.',
  keywords: ['buenas noticias', 'Los Tres', 'Pink Floyd', 'Queen', 'IA positiva', 'Psicología', 'Salud Mental', 'Chile'],
  authors: [{ name: 'Jorge Mujica' }],
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icon-32.png',
  },
  openGraph: {
    title: 'Good Vibrations — Buenas Noticias',
    description: 'Un espacio calmo, luminoso y constructivo. Novedades de Los Tres, Pink Floyd, Queen, IA con impacto real, psicología formal y las mejores noticias de Chile y el mundo.',
    type: 'website',
    url: 'https://goodvib.app',
    images: [
      {
        url: 'https://goodvib.app/icon.png',
        width: 512,
        height: 512,
        alt: 'Good Vibrations',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
