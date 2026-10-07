'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sun, Moon, ArrowUpRight } from 'lucide-react';
import rawData from '@/data/news.json';
import { Category, NewsItem, NewsDatabase } from '@/lib/types';

const data = rawData as unknown as NewsDatabase;
const allNews: NewsItem[] = data.news;

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Inicializar tema y detectar preferencia
  useEffect(() => {
    const saved = localStorage.getItem('gv-theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gv-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Motion: Intersection Observer para elementos .reveal
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selectedCategory, searchQuery]);

  const [greeting, setGreeting] = useState('Buenos días. Esto salió bien hoy.');
  const [todayFormatted, setTodayFormatted] = useState('Hoy');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Buenos días. Esto salió bien hoy.');
    else if (hour < 20) setGreeting('Buenas tardes. Esto salió bien hoy.');
    else setGreeting('Buenas noches. Esto salió bien hoy.');

    try {
      setTodayFormatted(
        new Intl.DateTimeFormat('es-CL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(now)
      );
    } catch {}
  }, []);

  // Filtrado de noticias
  const filteredNews = useMemo(() => {
    return allNews.filter((item) => {
      const matchesCat = selectedCategory === 'todas' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Noticia destacada para Hero
  const heroItem = useMemo(() => {
    return filteredNews.find((n) => n.featured) || filteredNews[0];
  }, [filteredNews]);

  // Lista restante para el Bento Grid
  const gridItems = useMemo(() => {
    if (!heroItem) return filteredNews;
    return filteredNews.filter((n) => n.id !== heroItem.id);
  }, [filteredNews, heroItem]);

  return (
    <>
      {/* 4.1 Header de vidrio */}
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="logo">
            <span className="logo-dot" />
            <span>Good Vibrations</span>
          </a>

          <nav className="header-center" aria-label="Categorías principales">
            <button
              onClick={() => setSelectedCategory('todas')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'todas' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'todas' ? 600 : 500 }}
            >
              Inicio
            </button>
            <button
              onClick={() => setSelectedCategory('musica')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'musica' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'musica' ? 600 : 500 }}
            >
              Música
            </button>
            <button
              onClick={() => setSelectedCategory('ia')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'ia' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'ia' ? 600 : 500 }}
            >
              Ciencia & IA
            </button>
            <button
              onClick={() => setSelectedCategory('chile')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'chile' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'chile' ? 600 : 500 }}
            >
              Chile
            </button>
            <button
              onClick={() => setSelectedCategory('mundo')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'mundo' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'mundo' ? 600 : 500 }}
            >
              Planeta
            </button>
          </nav>

          <div className="header-right">
            <span style={{ textTransform: 'capitalize' }}>{todayFormatted}</span>
            <button onClick={toggleTheme} className="theme-btn" aria-label="Cambiar tema">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* 4.2 Hero (Noticia del día) */}
      {heroItem && !searchQuery && selectedCategory === 'todas' && (
        <section className="hero-wrapper reveal">
          <div className="hero-saludo">{greeting}</div>
          <article className="hero-article">
            <div className="hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroItem.imageUrl}
                alt={heroItem.title}
                className="hero-img"
                loading="eager"
              />
            </div>
            <div className="hero-gradient" />

            <div className="hero-content">
              <span className="hero-eyebrow">
                {heroItem.category} · Noticia del día
              </span>
              <h1 className="hero-title">{heroItem.title}</h1>
              <p className="hero-dek">{heroItem.summary}</p>
              <div className="hero-meta">
                <span>{heroItem.sourceName}</span>
                <span>·</span>
                <span>{heroItem.readingTimeMinutes} min de lectura</span>
                <span>·</span>
                <a
                  href={heroItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 500 }}
                >
                  <span>Leer fuente</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* 4.4 Filtro de Categorías (Pills) & Buscador */}
      <section className="controls-section reveal">
        <div className="pills-row" role="tablist">
          <button
            onClick={() => setSelectedCategory('todas')}
            className="pill"
            aria-pressed={selectedCategory === 'todas'}
          >
            Todas ({data.totalCount})
          </button>
          <button
            onClick={() => setSelectedCategory('musica')}
            className="pill"
            aria-pressed={selectedCategory === 'musica'}
          >
            Música ({data.categories.musica})
          </button>
          <button
            onClick={() => setSelectedCategory('ia')}
            className="pill"
            aria-pressed={selectedCategory === 'ia'}
          >
            Ciencia & IA ({data.categories.ia})
          </button>
          <button
            onClick={() => setSelectedCategory('chile')}
            className="pill"
            aria-pressed={selectedCategory === 'chile'}
          >
            Chile ({data.categories.chile})
          </button>
          <button
            onClick={() => setSelectedCategory('mundo')}
            className="pill"
            aria-pressed={selectedCategory === 'mundo'}
          >
            Planeta ({data.categories.mundo})
          </button>
        </div>

        <div className="search-field">
          <Search size={14} className="search-icon-svg" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar historia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* 3. Bento Grid (12 columnas) */}
      <main className="bento-section">
        {filteredNews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--text-tertiary)' }}>
            <p style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>
              Por ahora no hay más historias con ese criterio.
            </p>
            <p style={{ fontSize: '14px' }}>
              Vuelve más tarde: el mundo sigue haciendo cosas buenas.
            </p>
          </div>
        ) : (
          <div className="bento">
            {gridItems.map((item, index) => {
              // Bento layout: el primer elemento es large (span 8, row span 2), los demás varían
              const isLarge = index === 0;
              const cardClass = isLarge ? 'card card--large reveal' : 'card card--medium reveal';

              return (
                <article key={item.id} className={cardClass}>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card__link"
                  >
                    <div className="card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="card__body">
                      <span className={`eyebrow eyebrow--${item.category}`}>
                        {item.category}
                      </span>
                      <h3 className="card__title">{item.title}</h3>
                      <p className="card__dek">{item.summary}</p>
                      <div className="card__meta">
                        <span>{item.sourceName} · {item.readingTimeMinutes} min</span>
                        <ArrowUpRight size={14} style={{ color: 'var(--sky)' }} />
                      </div>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 4.5 "Un dato para hoy" */}
      <section className="fact-section reveal">
        <div className="fact-container">
          <div className="fact-eyebrow">Un dato para hoy</div>
          <div className="fact-number">{data.totalCount}</div>
          <p className="fact-text">
            Historias positivas y verificadas registradas en nuestra base hoy, demostrando que los avances en música, ciencia y comunidad siguen adelante.
          </p>
          <div className="fact-source">Good Vibrations · Actualizado dos veces al día</div>
        </div>
      </section>

      {/* Footer Mínimo */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-copy">
            Good Vibrations · El antídoto diario al ruido mediático
          </div>
          <div className="footer-note">
            Curado para Jorge Mujica · Desplegado en Vercel
          </div>
        </div>
      </footer>
    </>
  );
}
