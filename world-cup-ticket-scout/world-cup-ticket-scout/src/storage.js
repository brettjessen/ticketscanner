import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

const files = {
  watchlists: path.join(dataDir, 'watchlists.json'),
  snapshots: path.join(dataDir, 'snapshots.json'),
  alerts: path.join(dataDir, 'alerts.json')
};

async function ensureFile(filePath, fallback) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
  }
}

export async function readJson(type, fallback = []) {
  const filePath = files[type];
  if (!filePath) throw new Error(`Unknown storage type: ${type}`);
  await ensureFile(filePath, fallback);
  const raw = await fs.readFile(filePath, 'utf8');
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

export async function writeJson(type, value) {
  const filePath = files[type];
  if (!filePath) throw new Error(`Unknown storage type: ${type}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

export async function appendJson(type, item, maxItems = 1000) {
  const current = await readJson(type, []);
  current.unshift(item);
  await writeJson(type, current.slice(0, maxItems));
  return item;
}

export function publicPath() {
  return path.join(rootDir, 'public');
}
