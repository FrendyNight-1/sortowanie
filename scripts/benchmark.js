import { benchmark, ALGORITHMS } from '../src/algorithms.js';
const rows = benchmark();
console.log('n | Dane | Algorytm | Porównania | Zapisy');
console.log('--|------|----------|------------|-------');
for (const row of rows) console.log(row.size + ' | ' + row.pattern + ' | ' + ALGORITHMS[row.algorithm].name + ' | ' + row.comparisons + ' | ' + row.writes);
