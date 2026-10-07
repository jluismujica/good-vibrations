import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Good Vibrations – Solo Noticias Positivas e Inspiradoras',
  description: 'Tu dosis diaria de optimismo: novedades de Los Tres, Pink Floyd, Queen, IA que transforma el mundo y avances destacados de Chile y el planeta.',
  keywords: ['buenas noticias', 'good news', 'Los Tres', 'Pink Floyd', 'Queen', 'IA positiva', 'Chile'],
  authors: [{ name: 'Jorge Mujica' }],
  openGraph: {
    title: 'Good Vibrations – Solo Noticias Positivas',
    description: 'El periódico digital libre de sensacionalismo. Música legendaria, IA para el bien y optimismo global.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="ambient-glow" />
        {children}
      </body>
    </html>
  );
}
