import Parser from 'rss-parser';
import { CuratedStory, curateAll } from './curate-news';

interface RSSFeedConfig {
  name: string;
  url: string;
  defaultCategory: 'musica' | 'ia' | 'psicologia' | 'liderazgo' | 'chile' | 'mundo';
}

const FEEDS: RSSFeedConfig[] = [
  {
    name: 'Positive News',
    url: 'https://www.positive.news/feed/',
    defaultCategory: 'mundo'
  },
  {
    name: 'Good News Network',
    url: 'https://www.goodnewsnetwork.org/feed/',
    defaultCategory: 'mundo'
  }
];

// Palabras clave para categorización inteligente
function detectCategory(title: string, content: string): 'musica' | 'ia' | 'psicologia' | 'liderazgo' | 'chile' | 'mundo' {
  const text = `${title} ${content}`.toLowerCase();
  
  if (/chile|santiago|valpara[ií]so|concepci[oó]n|atacama|patagonia|viña del mar/i.test(text)) {
    return 'chile';
  }
  if (/m[uú]sica|music|song|album|band|rock|concert|singer|canci[oó]n|melod[ií]a/i.test(text)) {
    return 'musica';
  }
  if (/psycholog|psicolog[ií]a|mental health|salud mental|cortisol|sleep|brain|cerebro|mindfulness|terapia|therapy|ansiedad|stress/i.test(text)) {
    return 'psicologia';
  }
  if (/leader|leadership|liderazgo|workplace|teamwork|management|gesti[oó]n|empresa|equipo|escucha activa/i.test(text)) {
    return 'liderazgo';
  }
  if (/ai|artificial intelligence|robot|tecnolog[ií]a|technology|fusion|solar|bater[ií]a|nasa|espacio|quantum|algoritmo/i.test(text)) {
    return 'ia';
  }
  return 'mundo';
}

// Extraer og:image y metadatos desde el HTML del artículo
async function extractMetadataFromHtml(url: string): Promise<{ imageUrl: string | null; description: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return { imageUrl: null, description: null };
    const html = await res.text();

    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];

    return {
      imageUrl: ogImg || null,
      description: ogDesc ? ogDesc.trim() : null
    };
  } catch (e: any) {
    return { imageUrl: null, description: null };
  }
}

// Verificar que la imagen sea accesible con HTTP 200 y Content-Type de imagen
async function verifyImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    });
    clearTimeout(timeout);
    const ct = res.headers.get('content-type') || '';
    return res.ok && ct.includes('image');
  } catch {
    return false;
  }
}

// Enriquecer o traducir con Gemini si la API key está disponible
async function enrichWithGemini(
  rawTitle: string,
  rawSummary: string,
  category: string,
  sourceName: string
): Promise<{ title: string; summary: string; fullStory: string; whyGoodNews: string; tags: string[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Actúa como editor senior de Good Vibrations (sitio de noticias positivas en español).
Traduce, redacta y cura la siguiente noticia en un tono inspirador, riguroso y periodístico.

Título original: ${rawTitle}
Resumen/Texto: ${rawSummary}
Fuente: ${sourceName}
Categoría tentativa: ${category}

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "title": "Título en español periodístico y positivo (máx 110 caracteres)",
  "summary": "Resumen conciso en español de 1 a 2 oraciones (máx 200 caracteres)",
  "fullStory": "Relato completo en español de 2 a 3 párrafos detallados y fluidos",
  "whyGoodNews": "Explicación de por qué es una excelente noticia para el bienestar o el futuro (1 oración)",
  "tags": ["TAG1", "TAG2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err: any) {
    console.warn(`[GEMINI CRAWLER] Fallback automático a procesamiento local: ${err.message}`);
  }
  return null;
}

export async function runCrawler() {
  console.log('======================================================');
  console.log('🚀 INICIANDO ROBOT DE NOTICIAS EN VIVO - GOOD VIBRATIONS');
  console.log('   - Filtro: Últimos 10 días');
  console.log('   - Validación estricta: Fotografía oficial HTTP 200 requerida');
  console.log('   - Sin duplicados por noticia');
  console.log('======================================================\n');

  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  });

  const now = Date.now();
  const maxAgeMs = 10 * 24 * 60 * 60 * 1000; // 10 días
  const dynamicStories: CuratedStory[] = [];

  for (const feedConfig of FEEDS) {
    console.log(`📡 Consultando feed RSS: ${feedConfig.name} (${feedConfig.url})...`);
    try {
      const feed = await parser.parseURL(feedConfig.url);
      console.log(`   Encontrados ${feed.items?.length || 0} artículos en ${feedConfig.name}.`);

      for (const item of (feed.items || []).slice(0, 10)) {
        if (!item.title || !item.link) continue;

        const pubDateMs = item.pubDate ? new Date(item.pubDate).getTime() : now;
        if (now - pubDateMs > maxAgeMs) {
          // Fuera de los 10 días
          continue;
        }

        console.log(`\n🔎 Evaluando: "${item.title}"`);

        // Extraer imagen oficial del HTML del artículo
        const meta = await extractMetadataFromHtml(item.link);
        if (!meta.imageUrl) {
          console.log(`   ❌ [REGLA 1: OMITIDA] No se encontró imagen oficial en el artículo.`);
          continue;
        }

        // Validar que la imagen responda 200 OK y sea una imagen real
        const isImageValid = await verifyImage(meta.imageUrl);
        if (!isImageValid) {
          console.log(`   ❌ [REGLA 1: OMITIDA] La imagen oficial no responde 200 OK (${meta.imageUrl})`);
          continue;
        }

        const category = detectCategory(item.title, (item.contentSnippet || meta.description || ''));
        const rawSummary = meta.description || item.contentSnippet || item.title;

        // Intentar enriquecer con Gemini si está configurado
        const geminiData = await enrichWithGemini(item.title, rawSummary, category, feedConfig.name);

        const title = geminiData?.title || item.title;
        const summary = geminiData?.summary || (meta.description ? meta.description.slice(0, 220) : item.title);
        const fullStory = geminiData?.fullStory || `${rawSummary}\n\nPublicado originalmente por ${feedConfig.name}, esta historia resalta el impacto positivo del esfuerzo colectivo y el avance constructivo en nuestra sociedad contemporánea.`;
        const whyGoodNews = geminiData?.whyGoodNews || `Aporta una perspectiva inspiradora y constructiva desde ${feedConfig.name}, demostrando que el progreso positivo sigue transformando realidades en todo el mundo.`;
        const tags = geminiData?.tags || [category.toUpperCase(), feedConfig.name.toUpperCase()];

        const storyId = `rss-${category}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

        const story: CuratedStory = {
          id: storyId,
          title,
          summary,
          fullStory,
          whyGoodNews,
          category,
          sourceName: feedConfig.name,
          sourceUrl: item.link,
          imageUrl: meta.imageUrl,
          imageSourceType: 'official',
          publishedAt: new Date(pubDateMs).toISOString(),
          positivityScore: 95,
          readingTimeMinutes: Math.max(2, Math.round(fullStory.split(/\s+/).length / 180)),
          tags,
        };

        console.log(`   ✅ [NOTICIA APROBADA] Con foto oficial verificada: ${meta.imageUrl}`);
        dynamicStories.push(story);
      }
    } catch (e: any) {
      console.warn(`⚠️ Error leyendo feed ${feedConfig.name}: ${e.message}`);
    }
  }

  console.log(`\n🎉 Extracción finalizada. Procesando ${dynamicStories.length} noticias dinámicas con la base curada...`);
  await curateAll(dynamicStories);
}

if (process.argv[1] && (process.argv[1].endsWith('crawler.ts') || process.argv[1].endsWith('crawler.js'))) {
  runCrawler().catch((err) => {
    console.error('Error fatal en el robot crawler:', err);
    process.exit(1);
  });
}
