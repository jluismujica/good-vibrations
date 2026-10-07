export type Category = 'todas' | 'musica' | 'ia' | 'chile' | 'mundo';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  category: 'musica' | 'ia' | 'chile' | 'mundo';
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string;
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
