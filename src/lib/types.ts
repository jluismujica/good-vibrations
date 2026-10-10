export type Category = 'todas' | 'musica' | 'ia' | 'chile' | 'mundo';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullStory: string; // Noticia resumen completa (2 a 4 párrafos en español)
  whyGoodNews: string; // Sección destacada: Por qué es una buena noticia
  contentSnippet?: string;
  category: 'musica' | 'ia' | 'chile' | 'mundo';
  sourceName: string;
  sourceUrl: string;
  imageUrl: string; // 100% obligatoria: foto oficial o creada
  imageSourceType?: 'official' | 'curated';
  publishedAt: string; // ISO format
  positivityScore: number; // 0 - 100
  readingTimeMinutes: number;
  tags: string[];
  featured?: boolean;
}

export interface NewsDatabase {
  lastUpdated: string;
  totalCount: number;
  categories: {
    musica: number;
    ia: number;
    chile: number;
    mundo: number;
  };
  news: NewsItem[];
}
