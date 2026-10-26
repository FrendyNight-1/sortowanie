export const ALGORITHMS = {
  selection: { name: 'Selection Sort', pseudocode: ['dla i = 0 … n−2', '  min = i', '  dla j = i+1 … n−1', '    jeśli A[j] < A[min]: min = j', '  zamień A[i] i A[min], gdy i ≠ min'] },
  insertion: { name: 'Insertion Sort', pseudocode: ['dla i = 1 … n−1', '  key = A[i]; j = i−1', '  dopóki j ≥ 0 i A[j] > key', '    A[j+1] = A[j]; j = j−1', '  wstaw key w wolne miejsce'] },
  merge: { name: 'Merge Sort', pseudocode: ['mergeSort(lewy, prawy)', '  podziel fragment na połowy', '  sortuj rekurencyjnie obie połowy', '  porównuj pierwsze elementy połówek', '  przy równości wybierz element z lewej', '  zapisz wynik do bufora i skopiuj z powrotem'] },
  quick: { name: 'Quick Sort · Lomuto', pseudocode: ['quickSort(lewy, prawy)', '  pivot = A[prawy]', '  granica = lewy − 1', '  dla j = lewy … prawy−1', '    jeśli A[j] ≤ pivot: zamień po granicy', '  ustaw pivot za granicą', '  sortuj obie części rekurencyjnie'] }
};

export function validateValues(values) {
  if (!Array.isArray(values)) return { ok: false, error: 'Dane muszą być listą liczb.' };
  if (values.length > 40) return { ok: false, error: 'Maksymalny rozmiar tablicy to 40.' };
  for (const value of values) {
    if (!Number.isInteger(value)) return { ok: false, error: 'Każdy element musi być liczbą całkowitą.' };
    if (value < -99 || value > 99) return { ok: false, error: 'Dozwolony zakres to od −99 do 99.' };
  }
  return { ok: true, error: '' };
}

export function parseValues(text) {
  const trimmed = String(text).trim();
  if (!trimmed) return [];
  const pieces = trimmed.split(/[\s,;]+/).filter(Boolean);
  const values = pieces.map((piece) => {
    if (!/^[+-]?\d+$/.test(piece)) throw new Error('Użyj liczb całkowitych oddzielonych przecinkiem lub spacją.');
    return Number(piece);
  });
  const result = validateValues(values);
  if (!result.ok) throw new Error(result.error);
  return values;
}

function alphaLabel(index) {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + value % 26) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export function makeItems(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const seen = new Map();
  return values.map((value, id) => {
    const occurrence = seen.get(value) || 0;
    seen.set(value, occurrence + 1);
    return { value, id, label: counts.get(value) > 1 ? String(value) + alphaLabel(occurrence) : String(value) };
  });
}

function copyItems(items) {
  return items.map((item) => ({ ...item }));
}

export function buildTrace(inputValues, algorithm) {
  if (!Object.hasOwn(ALGORITHMS, algorithm)) throw new Error('Nieznany algorytm.');
  const checked = validateValues(inputValues);
  if (!checked.ok) throw new Error(checked.error);
  const array = makeItems(inputValues);
  const frames = [];
  const metrics = { comparisons: 0, writes: 0 };
  const capture = (meta = {}) => frames.push({
    array: copyItems(array), comparisons: metrics.comparisons, writes: metrics.writes,
    line: null, description: '', range: null, active: [], minIndex: null, keyId: null,
    pivotIndex: null, boundary: null, buffer: [], sortedThrough: -1, action: 'start', ...meta
  });
  const compare = () => { metrics.comparisons += 1; };
  const write = () => { metrics.writes += 1; };
  capture({ line: 0, description: inputValues.length ? 'Dane wejściowe są gotowe. Wybierz Krok lub Start.' : 'Tablica jest pusta. Sortowanie kończy się bez porównań.', action: 'start' });

  if (algorithm === 'selection') {
    for (let i = 0; i < array.length - 1; i += 1) {
      let min = i;
      capture({ line: 0, range: [i, array.length - 1], active: [i], minIndex: min, sortedThrough: i - 1, action: 'selection-start', description: 'Początek przebiegu ' + (i + 1) + '. Szukam minimum w zakresie ' + i + '…' + (array.length - 1) + '.' });
      for (let j = i + 1; j < array.length; j += 1) {
        compare();
        const smaller = array[j].value < array[min].value;
        capture({ line: 2, range: [i, array.length - 1], active: [j], minIndex: min, sortedThrough: i - 1, action: 'compare', description: 'Porównuję ' + array[j].label + ' z aktualnym minimum ' + array[min].label + '. ' + (smaller ? 'Znaleziono mniejszy element.' : 'Minimum pozostaje bez zmian.') });
        if (smaller) {
          min = j;
          capture({ line: 3, range: [i, array.length - 1], active: [j], minIndex: min, sortedThrough: i - 1, action: 'new-minimum', description: array[min].label + ' staje się nowym minimum.' });
        }
      }
      if (min !== i) {
        const left = array[i].label;
        const right = array[min].label;
        [array[i], array[min]] = [array[min], array[i]];
        write(); write();
        capture({ line: 4, range: [i, array.length - 1], active: [i, min], minIndex: i, sortedThrough: i, action: 'swap', description: 'Zamieniam ' + left + ' z ' + right + ': minimum trafia na pozycję ' + i + '.' });
      } else {
        capture({ line: 4, range: [i, array.length - 1], active: [i], minIndex: min, sortedThrough: i, action: 'fixed', description: array[i].label + ' już jest minimum. Nie wykonuję zbędnej zamiany.' });
      }
    }
    if (array.length) capture({ line: 4, range: [0, array.length - 1], sortedThrough: array.length - 1, action: 'done', description: 'Cała tablica jest uporządkowana rosnąco.' });
  } else if (algorithm === 'insertion') {
    for (let i = 1; i < array.length; i += 1) {
      const key = array[i];
      let j = i - 1;
      capture({ line: 0, range: [0, i], active: [i], keyId: key.id, sortedThrough: i - 1, action: 'key', description: 'Biorę ' + key.label + ' jako klucz. Lewy fragment jest już uporządkowany.' });
      while (j >= 0) {
        compare();
        const shifts = array[j].value > key.value;
        capture({ line: 2, range: [0, i], active: [j, j + 1], keyId: key.id, sortedThrough: i - 1, action: 'compare', description: 'Czy ' + array[j].label + ' > ' + key.label + '? ' + (shifts ? 'Tak — przesuwam większy element w prawo.' : 'Nie — znalazłem miejsce dla klucza.') });
        if (!shifts) break;
        array[j + 1] = array[j];
        write();
        capture({ line: 3, range: [0, i], active: [j, j + 1], keyId: key.id, sortedThrough: i - 1, action: 'shift', description: 'Przesuwam ' + array[j + 1].label + ' na pozycję ' + (j + 1) + '.' });
        j -= 1;
      }
      if (j + 1 !== i) {
        array[j + 1] = key;
        write();
        capture({ line: 4, range: [0, i], active: [j + 1], keyId: key.id, sortedThrough: i, action: 'insert', description: 'Wstawiam ' + key.label + ' na pozycję ' + (j + 1) + '. Równe klucze nie są przesuwane.' });
      } else {
        capture({ line: 4, range: [0, i], active: [i], keyId: key.id, sortedThrough: i, action: 'insert', description: key.label + ' już jest na swoim miejscu; nie wykonuję zapisu.' });
      }
    }
    if (array.length) capture({ line: 4, range: [0, array.length - 1], sortedThrough: array.length - 1, action: 'done', description: 'Cała tablica jest uporządkowana rosnąco.' });
  } else if (algorithm === 'merge') {
    const bufferView = [];
    function mergeSort(left, right) {
      if (left >= right) {
        capture({ line: 0, range: [left, right], active: [left], action: 'base-case', description: 'Fragment ' + left + '…' + right + ' ma najwyżej jeden element, więc jest uporządkowany.' });
        return;
      }
      const middle = Math.floor((left + right) / 2);
      capture({ line: 1, range: [left, right], active: [middle], action: 'split', description: 'Dzielę fragment ' + left + '…' + right + ' na ' + left + '…' + middle + ' i ' + (middle + 1) + '…' + right + '.' });
      mergeSort(left, middle);
      mergeSort(middle + 1, right);
      let i = left; let j = middle + 1; let k = left;
      capture({ line: 2, range: [left, right], active: [i, j], action: 'merge-start', description: 'Scalam uporządkowane fragmenty ' + left + '…' + middle + ' oraz ' + (middle + 1) + '…' + right + '.' });
      while (i <= middle && j <= right) {
        compare();
        const chooseLeft = array[i].value <= array[j].value;
        const item = chooseLeft ? array[i++] : array[j++];
        bufferView[k] = item;
        write();
        capture({ line: chooseLeft ? 4 : 3, range: [left, right], active: [i > left ? i - 1 : left, j <= right ? j : right], buffer: bufferView.slice(left, k + 1), action: 'buffer-write', description: 'Do bufora trafia ' + item.label + (chooseLeft ? ' z lewej połowy.' : ' z prawej połowy. Przy równych kluczach wybierana jest lewa połowa.') });
        k += 1;
      }
      while (i <= middle) {
        const item = array[i++]; bufferView[k] = item; write();
        capture({ line: 5, range: [left, right], active: [i - 1], buffer: bufferView.slice(left, k + 1), action: 'buffer-write', description: 'Dopisuję pozostały element ' + item.label + ' do bufora.' }); k += 1;
      }
      while (j <= right) {
        const item = array[j++]; bufferView[k] = item; write();
        capture({ line: 5, range: [left, right], active: [j - 1], buffer: bufferView.slice(left, k + 1), action: 'buffer-write', description: 'Dopisuję pozostały element ' + item.label + ' do bufora.' }); k += 1;
      }
      for (let position = left; position <= right; position += 1) {
        array[position] = bufferView[position]; write();
        capture({ line: 5, range: [left, right], active: [position], buffer: bufferView.slice(left, right + 1), action: 'copy-back', description: 'Kopiuję ' + array[position].label + ' z bufora na pozycję ' + position + '.' });
      }
    }
    if (array.length) mergeSort(0, array.length - 1);
    if (array.length) capture({ line: 5, range: [0, array.length - 1], sortedThrough: array.length - 1, action: 'done', description: 'Scalanie zakończone. Tablica jest uporządkowana rosnąco.' });
  } else {
    function quickSort(left, right) {
      if (left >= right) {
        if (left === right) capture({ line: 0, range: [left, right], active: [left], sortedThrough: left, action: 'base-case', description: 'Element ' + array[left].label + ' tworzy jednoelementowy, uporządkowany fragment.' });
        return;
      }
      const pivotIndex = right;
      const pivotValue = array[pivotIndex].value;
      let boundary = left - 1;
      capture({ line: 1, range: [left, right], active: [pivotIndex], pivotIndex, boundary, action: 'pivot', description: 'Pivotem jest ostatni element fragmentu: ' + array[pivotIndex].label + '.' });
      for (let j = left; j < right; j += 1) {
        compare();
        const qualifies = array[j].value <= pivotValue;
        capture({ line: 3, range: [left, right], active: [j], pivotIndex, boundary, action: 'compare', description: 'Porównuję ' + array[j].label + ' z pivotem ' + array[pivotIndex].label + '. ' + (qualifies ? 'Element należy do lewej części.' : 'Element pozostaje po prawej stronie.') });
        if (qualifies) {
          boundary += 1;
          if (boundary !== j) {
            const first = array[boundary].label; const second = array[j].label;
            [array[boundary], array[j]] = [array[j], array[boundary]];
            write(); write();
            capture({ line: 4, range: [left, right], active: [boundary, j], pivotIndex, boundary, action: 'swap', description: 'Przenoszę ' + second + ' przed granicę, zamieniając ją z ' + first + '.' });
          } else {
            capture({ line: 4, range: [left, right], active: [j], pivotIndex, boundary, action: 'boundary-advance', description: 'Granica przesuwa się na pozycję ' + boundary + '; element już jest po właściwej stronie.' });
          }
        }
      }
      const finalPivot = boundary + 1;
      if (finalPivot !== right) {
        const first = array[finalPivot].label; const second = array[right].label;
        [array[finalPivot], array[right]] = [array[right], array[finalPivot]];
        write(); write();
        capture({ line: 5, range: [left, right], active: [finalPivot, right], pivotIndex: finalPivot, boundary, action: 'pivot-place', description: 'Umieszczam pivot między częściami na pozycji ' + finalPivot + '; zamiana ' + second + ' z ' + first + '.' });
      } else {
        capture({ line: 5, range: [left, right], active: [right], pivotIndex: right, boundary, action: 'pivot-place', description: 'Pivot pozostaje na pozycji ' + right + ', za granicą lewej części.' });
      }
      capture({ line: 6, range: [left, right], active: [finalPivot], pivotIndex: finalPivot, boundary, action: 'recurse', description: 'Rekurencyjnie sortuję fragmenty ' + left + '…' + (finalPivot - 1) + ' i ' + (finalPivot + 1) + '…' + right + '.' });
      quickSort(left, finalPivot - 1);
      quickSort(finalPivot + 1, right);
    }
    if (array.length) quickSort(0, array.length - 1);
    if (array.length) capture({ line: 6, range: [0, array.length - 1], sortedThrough: array.length - 1, action: 'done', description: 'Wszystkie części Quick Sort zostały uporządkowane.' });
  }
  return { frames, result: copyItems(array), metrics: { ...metrics } };
}

export function benchmark() {
  const rows = [];
  const patterns = [
    ['Rosnące', (n) => Array.from({ length: n }, (_, i) => i - Math.floor(n / 2))],
    ['Malejące', (n) => Array.from({ length: n }, (_, i) => Math.floor(n / 2) - i)],
    ['Powtórzenia', (n) => Array.from({ length: n }, (_, i) => (i % 5) - 2)]
  ];
  for (const size of [10, 20, 40]) {
    for (const [pattern, makeValues] of patterns) {
      const values = makeValues(size);
      for (const algorithm of Object.keys(ALGORITHMS)) {
        const run = buildTrace(values, algorithm);
        if (run.result.some((item, index) => index > 0 && run.result[index - 1].value > item.value)) throw new Error(algorithm + ' nie posortował zestawu ' + pattern + '.');
        rows.push({ size, pattern, algorithm, ...run.metrics });
      }
    }
  }
  return rows;
}
