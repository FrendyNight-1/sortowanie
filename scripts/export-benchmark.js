import { writeFile } from 'node:fs/promises';
import { benchmark } from '../src/algorithms.js';
const path = new URL('../docs/benchmark-results.json', import.meta.url);
await writeFile(path, JSON.stringify(benchmark(), null, 2) + '\n', 'utf8');
console.log('Saved measured operation counts to docs/benchmark-results.json');
