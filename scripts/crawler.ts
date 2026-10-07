import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'news.json');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

const THEMED_IMAGES = {
  losTres: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
  ],
  pinkFloyd: [
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
  ],
  queen: [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520523839898-50712170362f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  ],
  musicaGeneral: [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
  ],
  ia: [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
  ],
  chile: [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  ],
  mundo: [
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  ],
};

function pickThemedImage(title: string, category: string, index: number): string {
  const t = title.toLowerCase();
  if (t.includes('tres') || t.includes('álvaro') || t.includes('henríquez')) {
    return THEMED_IMAGES.losTres[index % THEMED_IMAGES.losTres.length];
  }
  if (t.includes('pink floyd') || t.includes('gilmour') || t.includes('waters')) {
    return THEMED_IMAGES.pinkFloyd[index % THEMED_IMAGES.pinkFloyd.length];
  }
  if (t.includes('queen') || t.includes('mercury') || t.includes('brian may')) {
    return THEMED_IMAGES.queen[index % THEMED_IMAGES.queen.length];
  }
  if (category === 'musica') {
    return THEMED_IMAGES.musicaGeneral[index % THEMED_IMAGES.musicaGeneral.length];
  }
  if (category === 'ia') {
    return THEMED_IMAGES.ia[index % THEMED_IMAGES.ia.length];
  }
  if (category === 'chile') {
    return THEMED_IMAGES.chile[index % THEMED_IMAGES.chile.length];
  }
  return THEMED_IMAGES.mundo[index % THEMED_IMAGES.mundo.length];
}

const FEEDS = [
  {
    category: 'musica' as const,
    source: 'Google News - Los Tres',
    url: 'https://news.google.com/rss/search?q=%22Los+Tres%22+banda+OR+concierto+OR+gira+OR+disco&hl=es-419&gl=CL&ceid=CL:es-419',
  },
  {
    category: 'musica' as const,
    source: 'Google News - Pink Floyd & Gilmour',
    url: 'https://news.google.com/rss/search?q=(%22Pink+Floyd%22+OR+%22David+Gilmour%22)+AND+(disco+OR+album+OR+gira+OR+concierto+OR+remaster)&hl=es-419&gl=CL&ceid=CL:es-419',
  },
  {
    category: 'musica' as const,
    source: 'Google News - Queen',
    url: 'https://news.google.com/rss/search?q=%22Queen%22+AND+(%22Freddie+Mercury%22+OR+%22Brian+May%22+OR+musica+OR+disco+OR+homenaje)&hl=es-419&gl=CL&ceid=CL:es-419',
  },
  {
    category: 'ia' as const,
    source: 'Google News - IA Positiva',
    url: 'https://news.google.com/rss/search?q=(%22inteligencia+artificial%22+OR+IA)+AND+(medicina+OR+salud+OR+ciencia+OR+educacion+OR+energia+OR+descubrimiento)+-apocalipsis+-amenaza+-peligro&hl=es-419&gl=CL&ceid=CL:es-419',
  },
  {
    category: 'chile' as const,
    source: 'Google News - Chile Innovación',
    url: 'https://news.google.com/rss/search?q=Chile+AND+(innovacion+OR+astronomia+OR+premio+OR+medioambiente+OR+turismo+OR+parque+OR+patrimonio)+-homicidio+-asalto+-crimen+-corrupcion&hl=es-419&gl=CL&ceid=CL:es-419',
  },
  {
    category: 'mundo' as const,
    source: 'Google News - Buenas Noticias Mundo',
    url: 'https://news.google.com/rss/search?q=%22buenas+noticias%22+OR+(ciencia+descubrimiento+cura)+OR+(energia+renovable+record)&hl=es-419&gl=CL&ceid=CL:es-419',
  },
];

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
    .replace(/\s*[-–|]\s*(ADN Radio|El Correo|Rock&Pop|Futuro|Cooperativa|El Mostrador|La Tercera|Emol|BioBioChile|BBC News Mundo|Good News Network|Positive News).*$/i, '')
    .trim();
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ');
}

export async function runCrawler() {
  console.log('🚀 Iniciando robot recolector de Good Vibrations (Español, Cero Duplicados, Thumbnails)...');

  let existingData: any = {
    lastUpdated: new Date().toISOString(),
    totalCount: 0,
    categories: { musica: 0, ia: 0, chile: 0, mundo: 0 },
    news: [],
  };

  if (fs.existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {}
  }

  const seenKeys = new Set(existingData.news.map((n: any) => normalizeKey(n.title)));
  const seenUrls = new Set(existingData.news.map((n: any) => n.sourceUrl.split('?')[0]));

  const newItems: any[] = [];
  let itemIndex = existingData.news.length;

  for (const feed of FEEDS) {
    try {
      console.log(`📡 Consultando feed [${feed.category.toUpperCase()}]: ${feed.source}...`);
      const res = await parser.parseURL(feed.url);

      for (const item of res.items.slice(0, 8)) {
        if (!item.title || !item.link) continue;

        const title = cleanHtml(item.title);
        const snippet = cleanHtml(item.contentSnippet || item.content || '');

        if (!title || title.length < 15) continue;
        if (!isCleanAndPositive(title, snippet)) continue;

        const key = normalizeKey(title);
        const urlKey = item.link.split('?')[0];

        if (seenKeys.has(key) || seenUrls.has(urlKey)) {
          continue;
        }
        seenKeys.add(key);
        seenUrls.add(urlKey);

        const imageUrl = pickThemedImage(title, feed.category, itemIndex++);
        const summary = snippet && snippet.length > 30 && snippet !== title
          ? snippet
          : 'Un hito constructivo e inspirador que destaca por su aporte positivo en la música, la ciencia o la comunidad.';

        newItems.push({
          id: crypto.randomUUID().substring(0, 8),
          title,
          summary,
          contentSnippet: summary.substring(0, 160),
          category: feed.category,
          sourceName: feed.source.replace('Google News - ', ''),
          sourceUrl: item.link,
          imageUrl,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          positivityScore: 88 + Math.floor(Math.random() * 10),
          readingTimeMinutes: Math.max(1, Math.ceil(summary.length / 350)),
          tags: [feed.category.toUpperCase()],
          featured: false,
        });
      }
    } catch (err: any) {
      console.warn(`⚠️ Error en feed ${feed.source}: ${err.message}`);
    }
  }

  const combined = [...newItems, ...existingData.news];
  // Deduplicación final
  const uniqueMap = new Map<string, any>();
  for (const item of combined) {
    const k = normalizeKey(item.title);
    if (!uniqueMap.has(k)) {
      uniqueMap.set(k, item);
    }
  }

  const finalNews = Array.from(uniqueMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 70);

  if (finalNews.length > 0) {
    finalNews[0].featured = true;
  }

  const counts = {
    musica: finalNews.filter((n: any) => n.category === 'musica').length,
    ia: finalNews.filter((n: any) => n.category === 'ia').length,
    chile: finalNews.filter((n: any) => n.category === 'chile').length,
    mundo: finalNews.filter((n: any) => n.category === 'mundo').length,
  };

  const output = {
    lastUpdated: new Date().toISOString(),
    totalCount: finalNews.length,
    categories: counts,
    news: finalNews,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`🎉 Finalizado: ${finalNews.length} noticias únicas guardadas en ${DATA_FILE}`);
}

runCrawler();
