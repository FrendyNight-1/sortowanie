import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmark, buildTrace, makeItems, parseValues, validateValues } from '../src/algorithms.js';

const methods = ['selection', 'insertion', 'merge', 'quick'];
const valuesOf = (items) => items.map((item) => item.value);

for (const method of methods) {
  test(method + ': sorts mixed values, negatives, and duplicates', () => {
    const run = buildTrace([5, 2, 5, -3, 1, 0], method);
    assert.deepEqual(valuesOf(run.result), [-3, 0, 1, 2, 5, 5]);
    assert.equal(new Set(run.result.map((item) => item.id)).size, 6);
  });
}
test('empty and single-item arrays terminate with no key comparisons', () => {
  for (const method of methods) {
    assert.deepEqual(buildTrace([], method).result, []);
    const single = buildTrace([-8], method);
    assert.deepEqual(valuesOf(single.result), [-8]);
    assert.equal(single.metrics.comparisons, 0);
  }
});
test('merge sort is stable and preserves duplicate labels', () => {
  const items = makeItems([5, 2, 5, 1]);
  const run = buildTrace([5, 2, 5, 1], 'merge');
  assert.deepEqual(valuesOf(run.result), [1, 2, 5, 5]);
  assert.deepEqual(run.result.filter((item) => item.value === 5).map((item) => item.id), [items[0].id, items[2].id]);
  assert.deepEqual(run.result.filter((item) => item.value === 5).map((item) => item.label), ['5A', '5B']);
});
test('insertion sort is stable on equal values', () => {
  assert.deepEqual(buildTrace([5, 5, 5], 'insertion').result.map((item) => item.id), [0, 1, 2]);
});
test('intermediate Selection Sort frame exposes the current minimum', () => {
  const found = buildTrace([4, 1, 3], 'selection').frames.find((frame) => frame.action === 'new-minimum');
  assert.ok(found);
  assert.equal(found.minIndex, 1);
  assert.equal(found.array[found.minIndex].value, 1);
});
test('intermediate Lomuto frame identifies last-element pivot and boundary', () => {
  const pivot = buildTrace([3, 1, 2], 'quick').frames.find((frame) => frame.action === 'pivot');
  assert.ok(pivot);
  assert.equal(pivot.pivotIndex, 2);
  assert.equal(pivot.array[pivot.pivotIndex].value, 2);
  assert.equal(pivot.boundary, -1);
});
test('Selection Sort performs no writes for an already ascending list', () => {
  const run = buildTrace([1, 2, 3, 4], 'selection');
  assert.equal(run.frames.some((frame) => frame.action === 'swap'), false);
  assert.equal(run.metrics.writes, 0);
});
test('Merge Sort counts buffer writes and copy-back writes', () => {
  const run = buildTrace([2, 1], 'merge');
  assert.equal(run.metrics.comparisons, 1);
  assert.equal(run.metrics.writes, 4);
});
test('validation enforces length, integer, and allowed range', () => {
  assert.equal(validateValues(Array(41).fill(0)).ok, false);
  assert.equal(validateValues([1.5]).ok, false);
  assert.equal(validateValues([-100]).ok, false);
  assert.equal(validateValues([-99, 0, 99]).ok, true);
});
test('parser accepts comma, semicolon, and whitespace separators', () => {
  assert.deepEqual(parseValues('5, -2; 7 0'), [5, -2, 7, 0]);
  assert.throws(() => parseValues('1, x'), /liczb całkowitych/);
});
test('comparison creates 36 rows for all sizes, patterns, and methods', () => {
  const rows = benchmark();
  assert.equal(rows.length, 36);
  for (const row of rows) {
    assert.ok(row.comparisons >= 0 && row.writes >= 0);
    const data = row.pattern === 'Rosnące'
      ? Array.from({ length: row.size }, (_, i) => i - Math.floor(row.size / 2))
      : row.pattern === 'Malejące'
        ? Array.from({ length: row.size }, (_, i) => Math.floor(row.size / 2) - i)
        : Array.from({ length: row.size }, (_, i) => (i % 5) - 2);
    assert.deepEqual(valuesOf(buildTrace(data, row.algorithm).result), [...data].sort((a, b) => a - b));
  }
});
