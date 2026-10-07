import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'news.json');

interface RawFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  enclosure?: { url?: string };
  category?: string;
  source?: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  category: 'musica' | 'ia' | 'chile' | 'mundo';
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  positivityScore: number;
  readingTimeMinutes: number;
  tags: string[];
  featured?: boolean;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

// Feeds organizados por categoría
const FEEDS = [
  // --- MÚSICA (Los Tres, Pink Floyd, Queen, Rock) ---
  {
    category: 'musica' as const,
    source: 'Google News - Los Tres',
    url: 'https://news.google.com/rss/search?q=%22Los+Tres%22+banda+OR+concierto+OR+gira+OR+disco&hl=es-419&gl=CL&ceid=CL:es-419',
    defaultTags: ['Los Tres', 'Música Chilena', 'Rock Latino'],
  },
  {
    category: 'musica' as const,
    source: 'Google News - Pink Floyd & Gilmour',
    url: 'https://news.google.com/rss/search?q=(%22Pink+Floyd%22+OR+%22David+Gilmour%22)+AND+(disco+OR+album+OR+gira+OR+concierto+OR+remaster)&hl=es-419&gl=CL&ceid=CL:es-419',
    defaultTags: ['Pink Floyd', 'David Gilmour', 'Rock Progresivo'],
  },
  {
    category: 'musica' as const,
    source: 'Google News - Queen',
    url: 'https://news.google.com/rss/search?q=%22Queen%22+AND+(%22Freddie+Mercury%22+OR+%22Brian+May%22+OR+musica+OR+disco+OR+homenaje)&hl=es-419&gl=CL&ceid=CL:es-419',
    defaultTags: ['Queen', 'Brian May', 'Rock Clásico'],
  },

  // --- INTELIGENCIA ARTIFICIAL POSITIVA ---
  {
    category: 'ia' as const,
    source: 'Google News - IA Positiva & Ciencia',
    url: 'https://news.google.com/rss/search?q=(%22inteligencia+artificial%22+OR+IA)+AND+(medicina+OR+salud+OR+ciencia+OR+educacion+OR+energia+OR+descubrimiento)+-apocalipsis+-amenaza+-peligro&hl=es-419&gl=CL&ceid=CL:es-419',
    defaultTags: ['IA', 'Ciencia', 'Innovación'],
  },

  // --- CHILE POSITIVO ---
  {
    category: 'chile' as const,
    source: 'Google News - Chile Innovación y Cultura',
    url: 'https://news.google.com/rss/search?q=Chile+AND+(innovacion+OR+astronomia+OR+premio+OR+medioambiente+OR+turismo+OR+parque+OR+patrimonio)+-homicidio+-asalto+-crimen+-corrupcion&hl=es-419&gl=CL&ceid=CL:es-419',
    defaultTags: ['Chile', 'Desarrollo', 'Cultura'],
  },

  // --- MUNDO POSITIVO ---
  {
    category: 'mundo' as const,
    source: 'Good News Network',
    url: 'https://www.goodnewsnetwork.org/feed/',
    defaultTags: ['Optimismo', 'Inspiración', 'Planeta'],
  },
  {
    category: 'mundo' as const,
    source: 'Positive News UK',
    url: 'https://www.positive.news/feed/',
    defaultTags: ['Sociedad', 'Esperanza', 'Mundo'],
  },
];

// Palabras prohibidas para evitar cualquier contenido negativo / bajón
const FORBIDDEN_WORDS = [
  'muerte', 'muerto', 'asesin', 'homicid', 'crimen', 'robo', 'asalto', 'tragedia',
  'accidente fatal', 'guerra', 'bomba', 'secuestr', 'violenc', 'tiroteo', 'masacre',
  'apocalipsis', 'colapso', 'fraude', 'estafa', 'escandalo', 'corrupci', 'crisis terminal',
  'morir', 'falleci', 'terrorismo', 'fatal', 'catastrofe', 'devastad', 'pesimismo', 'desastre'
];

function isCleanAndPositive(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) return false;
  }
  return true;
}

function extractImage(item: any): string | undefined {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.[0]?.url) return item.mediaContent[0].url;
  if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;

  // Buscar etiqueta <img src="..." en el contenido HTML
  const content = item.content || item['content:encoded'] || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) return match[1];

  return undefined;
}

function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function createId(title: string, url: string): string {
  return crypto.createHash('sha256').update(`${title}-${url}`).digest('hex').substring(0, 16);
}

// Curación con Gemini Flash si hay API Key disponible
async function summarizeWithGemini(
  items: Array<{ title: string; snippet: string; category: string; source: string; link: string; image?: string; pubDate?: string }>
): Promise<NewsItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('ℹ️ Sin GEMINI_API_KEY: Usando motor heurístico de optimismo local.');
    return items.map((item, index) => {
      const cleanedTitle = cleanHtml(item.title);
      const cleanedSnippet = cleanHtml(item.snippet);
      return {
        id: createId(cleanedTitle, item.link),
        title: cleanedTitle,
        summary: cleanedSnippet || 'Una gran noticia que destaca por su aporte constructivo e inspirador.',
        contentSnippet: cleanedSnippet.substring(0, 160),
        category: item.category as any,
        sourceName: item.source,
        sourceUrl: item.link,
        imageUrl: item.image,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        positivityScore: 85 + Math.floor(Math.random() * 15),
        readingTimeMinutes: Math.max(1, Math.ceil((cleanedSnippet.length || 200) / 400)),
        tags: [item.category.toUpperCase(), 'Buenas Noticias'],
        featured: index === 0,
      };
    });
  }

  console.log('✨ Procesando con Gemini 2.0 Flash para curación editorial y filtro de positividad...');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Eres el editor en jefe de "Good Vibrations", un periódico digital dedicado EXCLUSIVAMENTE a buenas noticias, optimismo, música legendaria (Los Tres, Pink Floyd, Queen), IA con impacto positivo, y noticias destacadas de Chile y el Mundo.

A continuación te paso una lista de noticias recolectadas.
Debes:
1. Filtrar y DESCARTAR cualquier noticia negativa, polémica tóxica, sensacionalista o que no sea constructiva.
2. Si una noticia está en inglés, traduce el título y escribe un resumen entusiasta de 1 o 2 párrafos en español neutro / chileno elegante.
3. Asigna un "positivityScore" entre 70 y 100.
4. Devuelve ÚNICAMENTE un array JSON válido con los campos:
[
  {
    "id": "string",
    "title": "Titular positivo y atractivo en español",
    "summary": "Resumen conciso y esperanzador de 1-2 párrafos",
    "category": "musica" | "ia" | "chile" | "mundo",
    "sourceName": "string",
    "sourceUrl": "string",
    "imageUrl": "string o null",
    "positivityScore": number (70-100),
    "readingTimeMinutes": number,
    "tags": ["Tag1", "Tag2"]
  }
]

Noticias a evaluar:
${JSON.stringify(items.slice(0, 30), null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    console.log(`✅ Gemini aprobó y redactó ${parsed.length} noticias positivas.`);
    return parsed.map((item: any, idx: number) => ({
      ...item,
      publishedAt: new Date().toISOString(),
      featured: idx === 0,
    }));
  } catch (err: any) {
    console.warn(`⚠️ Error al llamar a Gemini (${err.message}). Utilizando modo heurístico.`);
    return items.map((item, index) => {
      const cleanedTitle = cleanHtml(item.title);
      const cleanedSnippet = cleanHtml(item.snippet);
      return {
        id: createId(cleanedTitle, item.link),
        title: cleanedTitle,
        summary: cleanedSnippet || 'Una noticia constructiva e inspiradora.',
        category: item.category as any,
        sourceName: item.source,
        sourceUrl: item.link,
        imageUrl: item.image,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        positivityScore: 88,
        readingTimeMinutes: 2,
        tags: [item.category.toUpperCase()],
        featured: index === 0,
      };
    });
  }
}

export async function runCrawler() {
  console.log('🚀 Iniciando robot recolector de Good Vibrations...');

  // 1. Cargar noticias existentes para deduplicación
  let existingData: { lastUpdated: string; totalCount: number; categories: any; news: NewsItem[] } = {
    lastUpdated: new Date().toISOString(),
    totalCount: 0,
    categories: { musica: 0, ia: 0, chile: 0, mundo: 0 },
    news: [],
  };

  if (fs.existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      console.log('Creando nuevo archivo de datos.');
    }
  }

  const existingIds = new Set(existingData.news.map((n) => n.id));
  const existingTitles = new Set(existingData.news.map((n) => n.title.toLowerCase().trim()));

  const candidateItems: Array<{
    title: string;
    snippet: string;
    category: string;
    source: string;
    link: string;
    image?: string;
    pubDate?: string;
  }> = [];

  // 2. Extraer de cada Feed
  for (const feed of FEEDS) {
    try {
      console.log(`📡 Consultando feed [${feed.category.toUpperCase()}]: ${feed.source}...`);
      const res = await parser.parseURL(feed.url);

      for (const item of res.items.slice(0, 10)) {
        if (!item.title || !item.link) continue;

        const rawTitle = cleanHtml(item.title);
        const rawSnippet = cleanHtml(item.contentSnippet || item.content || '');

        // Filtro básico de deduplicación preliminar
        const testId = createId(rawTitle, item.link);
        if (existingIds.has(testId) || existingTitles.has(rawTitle.toLowerCase().trim())) {
          continue;
        }

        // Filtro preventivo de positividad
        if (!isCleanAndPositive(rawTitle, rawSnippet)) {
          continue;
        }

        candidateItems.push({
          title: rawTitle,
          snippet: rawSnippet,
          category: feed.category,
          source: feed.source,
          link: item.link,
          image: extractImage(item),
          pubDate: item.pubDate,
        });
      }
    } catch (err: any) {
      console.warn(`⚠️ Error leyendo feed ${feed.source}: ${err.message}`);
    }
  }

  console.log(`🔍 Candidatas positivas encontradas tras filtro inicial: ${candidateItems.length}`);

  if (candidateItems.length === 0) {
    console.log('✅ No hay nuevas noticias hoy o ya todas estaban registradas.');
    return;
  }

  // 3. Procesar y enriquecer
  const processedNewItems = await summarizeWithGemini(candidateItems);

  // 4. Fusionar, deduplicar y mantener hasta 80 noticias más recientes
  const combined = [...processedNewItems, ...existingData.news];
  const uniqueMap = new Map<string, NewsItem>();

  for (const item of combined) {
    const key = item.title.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  const finalNews = Array.from(uniqueMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 80);

  // Asegurar que al menos el primero sea featured
  if (finalNews.length > 0) {
    finalNews[0].featured = true;
  }

  const counts = {
    musica: finalNews.filter((n) => n.category === 'musica').length,
    ia: finalNews.filter((n) => n.category === 'ia').length,
    chile: finalNews.filter((n) => n.category === 'chile').length,
    mundo: finalNews.filter((n) => n.category === 'mundo').length,
  };

  const outputData = {
    lastUpdated: new Date().toISOString(),
    totalCount: finalNews.length,
    categories: counts,
    news: finalNews,
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`🎉 Éxito: Base de datos actualizada con ${finalNews.length} noticias positivas en ${DATA_FILE}`);
}

runCrawler();
