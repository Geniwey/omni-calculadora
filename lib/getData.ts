import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const cache = new Map<string, any>();

async function readJson<T>(filePath: string): Promise<T | null> {
  if (cache.has(filePath)) return cache.get(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    cache.set(filePath, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function getIndex() {
  return readJson<{ pairs: Array<{ categoria: string; nicho: string }> }>(
    path.join(DATA_DIR, 'index.json')
  );
}

export async function getCategoriaData(slug: string) {
  return readJson<any>(path.join(DATA_DIR, 'categorias', `${slug}.json`));
}

export async function getNichoData(slug: string) {
  return readJson<any>(path.join(DATA_DIR, 'nichos', `${slug}.json`));
}
