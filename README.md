# 🌞 Good Vibrations

> **El antídoto diario al ruido y la negatividad mediática.**  
> Un portal de noticias curado automáticamente, enfocado exclusivamente en contenidos constructivos, optimismo, música legendaria (**Los Tres, Pink Floyd, Queen**), **Inteligencia Artificial con impacto positivo**, e hitos destacados de **Chile** y el **Mundo**.

---

## 🚀 Arquitectura del Proyecto

1. **Frontend:** [Next.js](https://nextjs.org/) (App Router, React 19) con diseño editorial de vanguardia en Vanilla CSS (Dark/Light mode, Glassmorphism y microinteracciones).
2. **Robot / Crawler:** Script en TypeScript (`scripts/crawler.ts`) que consulta fuentes RSS estructuradas y Google News cada 12 horas.
3. **Filtro y Curaduría IA:** Integración con **Gemini 2.0 Flash** para clasificar el sentimiento positivo, resumir en español y descartar cualquier contenido alarmista o sensacionalista.
4. **Automatización:** **GitHub Actions** (`.github/workflows/fetch-news.yml`) programado dos veces al día (`08:00` y `20:00` hora de Chile).
5. **Hosting:** Diseñado para despliegue instantáneo en **Vercel**.

---

## 🛠️ Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar tu clave de Gemini en un archivo .env
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env

# 3. Ejecutar el robot recolector de noticias
npm run crawl

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Despliegue en Vercel

1. Sube este repositorio a tu cuenta de GitHub (`jluismujica/good-vibrations`).
2. Entra a [Vercel](https://vercel.com/) y haz clic en **"Add New Project"** $\rightarrow$ Importa `good-vibrations`.
3. Vercel detectará automáticamente Next.js. Haz clic en **Deploy**.
4. En GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:
   - Agrega el secret `GEMINI_API_KEY` (si deseas usar el modelo de IA para reescribir y clasificar resúmenes automáticamente).
   - En **Settings** $\rightarrow$ **Actions** $\rightarrow$ **General** $\rightarrow$ **Workflow permissions**, asegúrate de marcar *"Read and write permissions"*.
5. ¡Listo! El robot actualizará `src/data/news.json` 2 veces al día y Vercel republicará el sitio en automático sin costo de mantenimiento.
