import { curateAll } from './curate-news';

export async function runCrawler() {
  console.log('🚀 Ejecutando robot de noticias Good Vibrations con las 5 reglas de calidad...');
  await curateAll();
}

runCrawler();
