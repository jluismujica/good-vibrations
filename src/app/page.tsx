'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Search, 
  ExternalLink, 
  Music, 
  Cpu, 
  MapPin, 
  Globe, 
  Sparkles, 
  Clock, 
  Share2, 
  Check, 
  Radio
} from 'lucide-react';
import rawData from '@/data/news.json';
import { Category, NewsItem, NewsDatabase } from '@/lib/types';

const data = rawData as unknown as NewsDatabase;
const allNews: NewsItem[] = data.news;

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle Dark/Light Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleShare = (item: NewsItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.sourceUrl);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter news by category and search
  const filteredNews = useMemo(() => {
    return allNews.filter((item) => {
      const matchesCategory = selectedCategory === 'todas' || item.category === selectedCategory;
      const matchesQuery = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const featuredItem = useMemo(() => {
    return filteredNews.find((n) => n.featured) || filteredNews[0];
  }, [filteredNews]);

  const regularNews = useMemo(() => {
    if (!featuredItem) return filteredNews;
    return filteredNews.filter((n) => n.id !== featuredItem.id);
  }, [filteredNews, featuredItem]);

  const categoryIcons: Record<string, React.ReactNode> = {
    todas: <Sparkles size={16} />,
    musica: <Music size={16} />,
    ia: <Cpu size={16} />,
    chile: <MapPin size={16} />,
    mundo: <Globe size={16} />,
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Reciente';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header-container">
        <div className="header-content">
          <a href="#" className="logo-area">
            <div className="logo-badge">
              <Sun size={24} />
            </div>
            <div>
              <div className="logo-title">Good Vibrations</div>
              <div className="logo-tagline">Solo Buenas Noticias • Música & IA</div>
            </div>
          </a>

          <div className="header-actions">
            <div className="live-pill" title="Actualizado automáticamente 2 veces al día">
              <span className="live-dot" />
              <span>Robot Activo</span>
            </div>

            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Alternar tema"
              title="Alternar modo oscuro / claro"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Radio size={14} />
          <span>El antídoto diario al ruido y la negatividad</span>
        </div>
        <h1 className="hero-heading">
          Tu dosis diaria de <span>optimismo</span>, ciencia y buen rock.
        </h1>
        <p className="hero-subtitle">
          Un espacio libre de sensacionalismo. Avances de Inteligencia Artificial que mejoran el mundo,
          novedades de <b>Los Tres</b>, <b>Pink Floyd</b> y <b>Queen</b>, y las mejores noticias constructivas de Chile y el planeta.
        </p>
      </section>

      {/* Filters & Search */}
      <div className="filter-wrapper">
        <div className="categories-bar">
          <button
            onClick={() => setSelectedCategory('todas')}
            className={`category-chip ${selectedCategory === 'todas' ? 'active' : ''}`}
          >
            {categoryIcons.todas}
            <span>Todas ({data.totalCount})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('musica')}
            className={`category-chip ${selectedCategory === 'musica' ? 'active' : ''}`}
          >
            {categoryIcons.musica}
            <span>Música ({data.categories.musica})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('ia')}
            className={`category-chip ${selectedCategory === 'ia' ? 'active' : ''}`}
          >
            {categoryIcons.ia}
            <span>IA Positiva ({data.categories.ia})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('chile')}
            className={`category-chip ${selectedCategory === 'chile' ? 'active' : ''}`}
          >
            {categoryIcons.chile}
            <span>Chile ({data.categories.chile})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('mundo')}
            className={`category-chip ${selectedCategory === 'mundo' ? 'active' : ''}`}
          >
            {categoryIcons.mundo}
            <span>Mundo ({data.categories.mundo})</span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por artista, tema o palabra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-container">
        {filteredNews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <Sparkles size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No encontramos noticias con ese criterio
            </h3>
            <p>Intenta con otra palabra clave o selecciona otra categoría.</p>
          </div>
        ) : (
          <>
            {/* Featured Story */}
            {featuredItem && !searchQuery && selectedCategory === 'todas' && (
              <article className="featured-card">
                <div className="featured-image-wrapper">
                  {featuredItem.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredItem.imageUrl}
                      alt={featuredItem.title}
                      className="featured-img"
                    />
                  ) : (
                    <div className="featured-placeholder">
                      <Sparkles size={48} style={{ marginBottom: '1rem' }} />
                      <div style={{ fontWeight: 700, letterSpacing: '0.05em' }}>NOTICIA DESTACADA DEL DÍA</div>
                    </div>
                  )}
                </div>

                <div className="featured-content">
                  <div className="badge-row">
                    <span className={`badge-category ${featuredItem.category}`}>
                      {featuredItem.category}
                    </span>
                    <span className="badge-sentiment">
                      <Sparkles size={12} /> {featuredItem.positivityScore}% Positividad
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {featuredItem.readingTimeMinutes} min de lectura
                    </span>
                  </div>

                  <h2 className="featured-title">{featuredItem.title}</h2>
                  <p className="featured-summary">{featuredItem.summary}</p>

                  <div className="card-footer">
                    <span>Fuente: <b>{featuredItem.sourceName}</b> • {formatDate(featuredItem.publishedAt)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={(e) => handleShare(featuredItem, e)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Copiar enlace"
                      >
                        {copiedId === featuredItem.id ? <Check size={16} color="var(--accent-green)" /> : <Share2 size={16} />}
                      </button>
                      <a
                        href={featuredItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="read-btn"
                      >
                        <span>Leer completa</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Grid of news */}
            <div className="news-grid">
              {regularNews.map((item) => (
                <article key={item.id} className="news-card">
                  {item.imageUrl && (
                    <div className="news-card-image-wrap">
                      <span className={`badge-category ${item.category} card-category-tag`}>
                        {item.category}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="news-card-image" loading="lazy" />
                    </div>
                  )}

                  <div className="news-card-body">
                    {!item.imageUrl && (
                      <div className="badge-row" style={{ marginBottom: '0.75rem' }}>
                        <span className={`badge-category ${item.category}`}>
                          {item.category}
                        </span>
                        <span className="badge-sentiment">
                          <Sparkles size={11} /> {item.positivityScore}%
                        </span>
                      </div>
                    )}

                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-summary">{item.summary}</p>

                    <div className="meta-tags">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag-item">#{tag}</span>
                      ))}
                    </div>

                    <div className="card-footer">
                      <span style={{ fontSize: '0.76rem' }}>
                        {item.sourceName.replace('Google News - ', '')} • {formatDate(item.publishedAt)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          onClick={(e) => handleShare(item, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Copiar enlace"
                        >
                          {copiedId === item.id ? <Check size={14} color="var(--accent-green)" /> : <Share2 size={14} />}
                        </button>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="read-btn"
                          title="Abrir fuente original"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <p className="footer-quote">
          “I’m pickin’ up good vibrations / She’s givin’ me the excitations”
        </p>
        <p className="footer-note">
          Good Vibrations © 2026 • Automatizado con GitHub Actions & Next.js para Jorge Mujica • Desplegado en Vercel
        </p>
      </footer>
    </>
  );
}
