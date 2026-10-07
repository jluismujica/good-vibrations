import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Good Vibrations — Buenas Noticias',
  description: 'Un espacio calmo, luminoso y constructivo. Novedades de Los Tres, Pink Floyd, Queen, IA con impacto real y las mejores noticias de Chile y el mundo.',
  keywords: ['buenas noticias', 'Los Tres', 'Pink Floyd', 'Queen', 'IA positiva', 'Chile'],
  authors: [{ name: 'Jorge Mujica' }],
  openGraph: {
    title: 'Good Vibrations — Buenas Noticias',
    description: 'Un espacio calmo, luminoso y constructivo. Novedades de Los Tres, Pink Floyd, Queen, IA con impacto real y las mejores noticias de Chile y el mundo.',
    type: 'website',
    url: 'https://goodvib.app',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
