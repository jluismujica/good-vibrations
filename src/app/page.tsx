'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sun, Moon, ArrowUpRight, X, Sparkles, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import rawData from '@/data/news.json';
import { Category, NewsItem, NewsDatabase } from '@/lib/types';

const data = rawData as unknown as NewsDatabase;
const allNews: NewsItem[] = data.news;

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' width='1200' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ffb36b'/%3E%3Cstop offset='50%25' stop-color='%23ff7a45'/%3E%3Cstop offset='100%25' stop-color='%23e8558a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='600' cy='400' r='90' fill='white' fill-opacity='0.25'/%3E%3Cpath d='M560 400 L640 400 M600 360 L600 440' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

function formatNewsDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
    }).format(d).replace('.', '');
  } catch {
    return '';
  }
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

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

  // Manejo de tecla ESC y bloqueo de scroll al abrir la vista de lectura
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArticle(null);
      }
    };

    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedArticle]);

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

  // Filtrado de noticias (Garantizando regla 1: 100% con fotografía)
  const filteredNews = useMemo(() => {
    return allNews
      .filter((item) => !!item.imageUrl && item.imageUrl.trim() !== '')
      .filter((item) => {
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
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setSelectedCategory('todas'); }}>
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
              onClick={() => setSelectedCategory('psicologia')}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCategory === 'psicologia' ? 'var(--text)' : undefined, fontWeight: selectedCategory === 'psicologia' ? 600 : 500 }}
            >
              Psicología
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
          <article
            className="hero-article"
            onClick={() => setSelectedArticle(heroItem)}
            style={{ cursor: 'pointer' }}
          >
            <div className="hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroItem.imageUrl}
                alt={heroItem.title}
                className="hero-img"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>
            <div className="hero-gradient" />

            <div className="hero-content">
              <span className="hero-eyebrow">
                {heroItem.category === 'psicologia' ? 'Psicología & Salud Mental' : heroItem.category} · Noticia del día
              </span>
              <h1 className="hero-title">{heroItem.title}</h1>
              <p className="hero-dek">{heroItem.summary}</p>
              <div className="hero-meta">
                <span>{heroItem.sourceName}</span>
                <span>·</span>
                <span>{heroItem.readingTimeMinutes} min</span>
                <span>·</span>
                <span>{formatNewsDate(heroItem.publishedAt)}</span>
                <span>·</span>
                <span style={{ color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <BookOpen size={14} />
                  <span>Leer resumen completo</span>
                </span>
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
            onClick={() => setSelectedCategory('psicologia')}
            className="pill"
            aria-pressed={selectedCategory === 'psicologia'}
          >
            Psicología ({data.categories.psicologia})
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
            placeholder="Buscar historia o estudio..."
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
              const isLarge = index === 0;
              const cardClass = isLarge ? 'card card--large reveal' : 'card card--medium reveal';

              return (
                <article
                  key={item.id}
                  className={cardClass}
                  onClick={() => setSelectedArticle(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card__link">
                    <div className="card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                    <div className="card__body">
                      <span className={`eyebrow eyebrow--${item.category}`}>
                        {item.category === 'psicologia' ? 'Psicología' : item.category}
                      </span>
                      <h3 className="card__title">{item.title}</h3>
                      <p className="card__dek">{item.summary}</p>
                      <div className="card__meta">
                        <span>
                          {item.sourceName} · {item.readingTimeMinutes} min · {formatNewsDate(item.publishedAt)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sky)', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>
                          <span>Ver historia</span>
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
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
            Historias positivas y estudios científicos rigurosos registrados en nuestra base hoy, demostrando que los avances en psicología, ciencia, música y comunidad siguen adelante.
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
            Curado para Jorge Mujica · Desplegado en goodvib.app
          </div>
        </div>
      </footer>

      {/* 4.6 Modal de Lectura Interna (Reader View) */}
      {selectedArticle && (
        <div
          className="reader-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticle(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="reader-modal">
            {/* Barra superior de control */}
            <div className="reader-header-bar">
              <div className="reader-meta-source">
                <span>{selectedArticle.sourceName}</span>
                {selectedArticle.imageSourceType === 'official' ? (
                  <span className="reader-badge-official">Foto oficial</span>
                ) : (
                  <span className="reader-badge-official" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>Foto curada</span>
                )}
              </div>
              <button
                className="reader-close-btn"
                onClick={() => setSelectedArticle(null)}
                aria-label="Cerrar lectura (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Fotografía principal */}
            <div className="reader-hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>

            {/* Contenido del resumen en el sistema */}
            <div className="reader-content">
              <div className="reader-category-row">
                <span className={`eyebrow eyebrow--${selectedArticle.category}`}>
                  {selectedArticle.category === 'psicologia' ? 'Psicología & Salud Mental' : selectedArticle.category}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  {selectedArticle.readingTimeMinutes} min de lectura · {formatNewsDate(selectedArticle.publishedAt)}
                </span>
              </div>

              <h1 className="reader-title">{selectedArticle.title}</h1>
              <p className="reader-lead">{selectedArticle.summary}</p>

              {/* Bloque Destacado: Por qué es una buena noticia */}
              <div className="reader-why-box">
                <div className="reader-why-label">
                  <Sparkles size={15} />
                  <span>Por qué es una buena noticia</span>
                </div>
                <p className="reader-why-text">{selectedArticle.whyGoodNews}</p>
              </div>

              {/* Noticia Resumen Completa (2-4 párrafos estructurados) */}
              <div className="reader-body">
                {selectedArticle.fullStory.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Acciones y enlace a la fuente original */}
              <div className="reader-footer-actions">
                <button
                  className="reader-back-btn"
                  onClick={() => setSelectedArticle(null)}
                >
                  <ArrowLeft size={16} />
                  <span>Volver a la portada</span>
                </button>

                <a
                  href={selectedArticle.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reader-source-cta"
                >
                  <span>Indagar más: Ir a la fuente original en {selectedArticle.sourceName}</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
