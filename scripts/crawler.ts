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

// Limpiar entidades HTML y caracteres especiales
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '—')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Traductor robusto al español
async function translateToSpanish(text: string): Promise<string> {
  const clean = cleanText(text);
  if (!clean) return '';

  // Si ya contiene caracteres claramente en español (tildes, eñes) y no palabras comunes en inglés
  if (/[áéíóúÁÉÍÓÚñÑ¿¡]/.test(clean) && !/\b(the|and|with|from|this|that|has|have|are|for|who)\b/i.test(clean)) {
    return clean;
  }

  // Dividir en oraciones si excede los 350 caracteres
  const sentences = clean.match(/[^.!?]+[.!?]+|\S+/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).length > 350) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current = (current + ' ' + s).trim();
    }
  }
  if (current) chunks.push(current.trim());

  const results: string[] = [];
  for (const chunk of chunks) {
    let translatedChunk = '';

    // 1) Motor primario: Google Translate API (dict-chrome-ex, sin cuota ni 429)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=es&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          translatedChunk = data[0].map((item: any) => item[0]).join('');
        }
      }
    } catch {
      // Ignorar e ir al fallback
    }

    // 2) Fallback secundario
    if (!translatedChunk || translatedChunk.trim() === '') {
      try {
        const q = encodeURIComponent(chunk);
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=en|es`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const data = await res.json();
        const textRes = data?.responseData?.translatedText;
        if (textRes && !textRes.includes('MYMEMORY WARNING')) {
          translatedChunk = textRes;
        }
      } catch {
        // Ignorar
      }
    }

    results.push(cleanText(translatedChunk || chunk));
    await new Promise(r => setTimeout(r, 40));
  }

  return results.join(' ');
}

// Detectar categoría en base al contenido
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
  if (/\b(ai|ia)\b|artificial intelligence|inteligencia artificial|robot|tecnolog[ií]a|technology|fusion|solar energy|bater[ií]a|nasa|espacio|quantum|algoritmo/i.test(text)) {
    return 'ia';
  }
  return 'mundo';
}

// Generar reflexión de por qué es buena noticia en español
function generateWhyGoodNews(category: string): string {
  switch (category) {
    case 'psicologia':
      return 'Aporta evidencia valiosa para cuidar el bienestar emocional, reducir el estrés cotidiano y construir hábitos de vida más saludables.';
    case 'liderazgo':
      return 'Demuestra que la confianza, la empatía y la comunicación abierta son las herramientas más eficaces para inspirar y liderar equipos humanos.';
    case 'ia':
      return 'Muestra cómo la innovación científica y el ingenio humano colaboran para resolver desafíos ambientales y sociales concretos.';
    case 'musica':
      return 'Celebra el poder unificador de la música y el arte para conectar personas, sanar heridas y despertar emociones profundas.';
    case 'chile':
      return 'Destaca iniciativas y avances que fortalecen la convivencia, el patrimonio y la calidad de vida en nuestras comunidades.';
    default:
      return 'Nos recuerda que las acciones comunitarias de bondad, conservación y perseverancia generan un impacto positivo real en el mundo.';
  }
}

// Extraer og:image y párrafos del artículo
async function extractArticleDetails(url: string): Promise<{ imageUrl: string | null; description: string | null; paragraphs: string[] }> {
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

    if (!res.ok) return { imageUrl: null, description: null, paragraphs: [] };
    const html = await res.text();

    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];

    const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => cleanText(m[1]))
      .filter(p => p.length > 70 && !/cookie|subscribe|newsletter|sign up|advertisement|copyright/i.test(p));

    return {
      imageUrl: ogImg || null,
      description: ogDesc ? cleanText(ogDesc) : null,
      paragraphs: pMatches.slice(0, 3)
    };
  } catch {
    return { imageUrl: null, description: null, paragraphs: [] };
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

// Enriquecer con Gemini si la API key está disponible
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
Traduce, redacta y cura la siguiente noticia en un tono inspirador, riguroso y periodístico en ESPAÑOL.

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
    console.warn(`[GEMINI] Fallback a traducción automática en español: ${err.message}`);
  }
  return null;
}

export async function runCrawler() {
  console.log('======================================================');
  console.log('🚀 INICIANDO ROBOT DE NOTICIAS EN VIVO - GOOD VIBRATIONS');
  console.log('   - Idioma: 100% ESPAÑOL');
  console.log('   - Filtro: Últimos 10 días');
  console.log('   - Validación estricta: Fotografía oficial HTTP 200');
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
    console.log(`📡 Consultando feed RSS: ${feedConfig.name}...`);
    try {
      const feed = await parser.parseURL(feedConfig.url);
      console.log(`   Encontrados ${feed.items?.length || 0} artículos.`);

      for (const item of (feed.items || []).slice(0, 8)) {
        if (!item.title || !item.link) continue;

        const pubDateMs = item.pubDate ? new Date(item.pubDate).getTime() : now;
        if (now - pubDateMs > maxAgeMs) {
          continue;
        }

        console.log(`\n🔎 Procesando: "${item.title}"`);

        // Extraer imagen oficial y párrafos
        const details = await extractArticleDetails(item.link);
        if (!details.imageUrl) {
          console.log(`   ❌ [OMITIDA] Sin imagen oficial.`);
          continue;
        }

        const isImageValid = await verifyImage(details.imageUrl);
        if (!isImageValid) {
          console.log(`   ❌ [OMITIDA] Imagen fallida HTTP 200.`);
          continue;
        }

        const category = detectCategory(item.title, (item.contentSnippet || details.description || ''));
        const rawSummary = details.description || item.contentSnippet || item.title;

        // Intentar Gemini si está configurado
        const geminiData = await enrichWithGemini(item.title, rawSummary, category, feedConfig.name);

        let title = '';
        let summary = '';
        let fullStory = '';
        let whyGoodNews = '';
        let tags: string[] = [];

        if (geminiData) {
          title = geminiData.title;
          summary = geminiData.summary;
          fullStory = geminiData.fullStory;
          whyGoodNews = geminiData.whyGoodNews;
          tags = geminiData.tags;
        } else {
          // Traducir y redactar en español
          console.log(`   🌐 Traduciendo y adaptando al español...`);
          title = await translateToSpanish(item.title);
          summary = await translateToSpanish(rawSummary);

          // Si hay párrafos del artículo, traducirlos para el relato completo
          let translatedParagraphs: string[] = [];
          if (details.paragraphs.length > 0) {
            for (const p of details.paragraphs) {
              const tp = await translateToSpanish(p);
              if (tp) translatedParagraphs.push(tp);
            }
          }

          if (translatedParagraphs.length >= 2) {
            fullStory = translatedParagraphs.join('\n\n');
          } else {
            fullStory = `${summary}\n\nEsta inspiradora historia, reportada originalmente por ${feedConfig.name}, demuestra el impacto positivo de la acción colectiva y el compromiso humano por un mundo más solidario y consciente.`;
          }

          whyGoodNews = generateWhyGoodNews(category);

          const catTagMap: Record<string, string[]> = {
            musica: ['MÚSICA', 'CULTURA'],
            ia: ['INNOVACIÓN', 'CIENCIA'],
            psicologia: ['PSICOLOGÍA', 'SALUD MENTAL'],
            liderazgo: ['LIDERAZGO', 'EQUIPOS'],
            chile: ['CHILE', 'COMUNIDAD'],
            mundo: ['PLANETA', 'SOLIDARIDAD']
          };
          tags = catTagMap[category] || ['PLANETA', 'BUENAS NOTICIAS'];
        }

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
          imageUrl: details.imageUrl,
          imageSourceType: 'official',
          publishedAt: new Date(pubDateMs).toISOString(),
          positivityScore: 96,
          readingTimeMinutes: Math.max(2, Math.round(fullStory.split(/\s+/).length / 180)),
          tags,
        };

        console.log(`   ✅ [APROBADA EN ESPAÑOL] "${title}"`);
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
