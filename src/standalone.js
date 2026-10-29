const ALGORITHMS = {
  selection: { name: 'Selection Sort', pseudocode: ['dla i = 0 … n−2', '  min = i', '  dla j = i+1 … n−1', '    jeśli A[j] < A[min]: min = j', '  zamień A[i] i A[min], gdy i ≠ min'] },
  insertion: { name: 'Insertion Sort', pseudocode: ['dla i = 1 … n−1', '  key = A[i]; j = i−1', '  dopóki j ≥ 0 i A[j] > key', '    A[j+1] = A[j]; j = j−1', '  wstaw key w wolne miejsce'] },
  merge: { name: 'Merge Sort', pseudocode: ['mergeSort(lewy, prawy)', '  podziel fragment na połowy', '  sortuj rekurencyjnie obie połowy', '  porównuj pierwsze elementy połówek', '  przy równości wybierz element z lewej', '  zapisz wynik do bufora i skopiuj z powrotem'] },
  quick: { name: 'Quick Sort · Lomuto', pseudocode: ['quickSort(lewy, prawy)', '  pivot = A[prawy]', '  granica = lewy − 1', '  dla j = lewy … prawy−1', '    jeśli A[j] ≤ pivot: zamień po granicy', '  ustaw pivot za granicą', '  sortuj obie części rekurencyjnie'] }
};

function validateValues(values) {
  if (!Array.isArray(values)) return { ok: false, error: 'Dane muszą być listą liczb.' };
  if (values.length > 40) return { ok: false, error: 'Maksymalny rozmiar tablicy to 40.' };
  for (const value of values) {
    if (!Number.isInteger(value)) return { ok: false, error: 'Każdy element musi być liczbą całkowitą.' };
    if (value < -99 || value > 99) return { ok: false, error: 'Dozwolony zakres to od −99 do 99.' };
  }
  return { ok: true, error: '' };
}

function parseValues(text) {
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

function makeItems(values) {
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

function buildTrace(inputValues, algorithm) {
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

function benchmark() {
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

const $ = (selector) => document.querySelector(selector);
const valuesInput = $('#values-input');
const algorithmSelect = $('#algorithm-select');
const arrayView = $('#array-view');
const errorBox = $('#input-error');
let values = [5, 2, 5, 1, -3, 8];
let algorithm = 'selection';
let trace = buildTrace(values, algorithm);
let cursor = 0;
let timer = null;

const presets = {
  random: () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 41) - 20),
  ascending: () => [-8, -5, -2, 0, 3, 7, 11, 15],
  descending: () => [15, 11, 7, 3, 0, -2, -5, -8],
  nearly: () => [1, 2, 4, 3, 5, 6, 8, 7, 9],
  duplicates: () => [5, 2, 5, 1, 2, 5, -1, -1, 0]
};

function currentFrame() { return trace.frames[Math.min(cursor, trace.frames.length - 1)]; }
function stopPlayback() {
  if (timer) window.clearInterval(timer);
  timer = null;
  $('#play-button').textContent = 'Start';
}
function resetRun() {
  stopPlayback();
  cursor = 0;
  trace = buildTrace(values, algorithm);
  render();
}
function applyUserData() {
  try {
    values = parseValues(valuesInput.value);
    algorithm = algorithmSelect.value;
    errorBox.textContent = '';
    errorBox.hidden = true;
    resetRun();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
}
function appendStateAnswer(parent, label, explanation, isCorrect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'answer-button';
  button.textContent = label;
  button.addEventListener('click', () => {
    const feedback = $('#state-feedback');
    feedback.textContent = explanation;
    feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
  }, { once: true });
  parent.append(button);
}
function renderArray(frame) {
  arrayView.replaceChildren();
  const maxValue = Math.max(1, ...frame.array.map((item) => Math.abs(item.value)));
  frame.array.forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'array-item';
    wrapper.setAttribute('role', 'listitem');
    wrapper.setAttribute('aria-label', 'Pozycja ' + index + ': ' + item.label);
    if (frame.active.includes(index)) wrapper.classList.add('is-active');
    if (frame.minIndex === index || frame.keyId === item.id) wrapper.classList.add('is-min');
    if (frame.pivotIndex === index) wrapper.classList.add('is-pivot');
    if (frame.sortedThrough >= index) wrapper.classList.add('is-sorted');
    const height = 28 + Math.round((Math.abs(item.value) / maxValue) * 95);
    const bar = document.createElement('div');
    bar.className = 'array-bar';
    bar.style.height = height + 'px';
    bar.textContent = String(item.value);
    const tag = document.createElement('span');
    tag.className = 'item-tag';
    tag.textContent = frame.pivotIndex === index ? 'PIVOT' : frame.minIndex === index ? 'MINIMUM' : frame.keyId === item.id ? 'KLUCZ' : '';
    const position = document.createElement('span');
    position.className = 'item-index';
    position.textContent = String(index);
    wrapper.append(tag, bar, position);
    arrayView.append(wrapper);
  });
}
function renderState(frame) {
  const range = frame.range;
  $('#range-state').textContent = range ? range[0] + '…' + range[1] : '—';
  const key = frame.keyId !== null ? frame.array.find((item) => item.id === frame.keyId) : null;
  $('#min-state').textContent = frame.minIndex !== null
    ? (frame.array[frame.minIndex]?.label || '—') + ' · indeks ' + frame.minIndex
    : key ? key.label : '—';
  $('#pivot-state').textContent = frame.pivotIndex !== null
    ? (frame.array[frame.pivotIndex]?.label || '—') + ' · pivot; granica ' + (frame.boundary ?? '—')
    : '—';
  $('#buffer-state').textContent = frame.buffer.length ? '[' + frame.buffer.map((item) => item.label).join(', ') + ']' : '—';
  $('#step-text').textContent = frame.description;
  $('#step-badge').textContent = frame.action.replaceAll('-', ' ').toUpperCase();
  $('#step-count').textContent = 'Krok ' + cursor + ' / ' + (trace.frames.length - 1);
  $('#comparison-count').textContent = frame.comparisons;
  $('#write-count').textContent = frame.writes;
  $('#item-count').textContent = frame.array.length;
  $('#line-name').textContent = ALGORITHMS[algorithm].name;
  const code = $('#pseudocode');
  code.replaceChildren();
  ALGORITHMS[algorithm].pseudocode.forEach((line, index) => {
    const span = document.createElement('span');
    span.className = 'code-line' + (frame.line === index ? ' current-line' : '');
    span.textContent = String(index + 1).padStart(2, '0') + '  ' + line;
    code.append(span);
  });
  $('#sorted-note').textContent = frame.action === 'done' ? 'Gotowe · kolejność rosnąca' : 'Podkreślenie: ustalony prefiks';
}
function renderCurrentQuestion(frame) {
  const question = $('#state-question');
  const answers = $('#state-answers');
  const feedback = $('#state-feedback');
  answers.replaceChildren();
  feedback.textContent = '';
  if (frame.pivotIndex !== null) {
    const pivot = frame.array[frame.pivotIndex];
    const other = frame.array[frame.range?.[0] ?? 0];
    question.textContent = 'Która wartość jest pivotem w bieżącym stanie?';
    appendStateAnswer(answers, pivot?.label ?? '—', 'Tak. Ostatni element aktywnego fragmentu to pivot: ' + (pivot?.label ?? '—') + '.', true);
    appendStateAnswer(answers, other?.label ?? '—', 'Nie. W schemacie Lomuto pivotem jest ostatni element fragmentu: ' + (pivot?.label ?? '—') + '.', false);
  } else if (frame.minIndex !== null) {
    const min = frame.array[frame.minIndex];
    const candidateIndex = frame.active.find((index) => index !== frame.minIndex)
      ?? frame.array.findIndex((_, index) => index !== frame.minIndex);
    const candidate = frame.array[candidateIndex >= 0 ? candidateIndex : 0];
    question.textContent = 'Który element jest aktualnym minimum?';
    appendStateAnswer(answers, min?.label ?? '—', 'Tak. Aktualne minimum to ' + (min?.label ?? '—') + ' na indeksie ' + frame.minIndex + '.', true);
    appendStateAnswer(answers, candidate?.label ?? '—', 'Sprawdź oznaczenie MINIMUM. Aktualny element porównania nie musi być minimum.', false);
  } else if (frame.keyId !== null) {
    const key = frame.array.find((item) => item.id === frame.keyId);
    const other = frame.array[0];
    question.textContent = 'Który element jest teraz wstawiany?';
    appendStateAnswer(answers, key?.label ?? '—', 'Tak. Klucz to ' + (key?.label ?? '—') + '; większe elementy są przesuwane w prawo.', true);
    appendStateAnswer(answers, other?.label ?? '—', 'Nie. Śledź etykietę KLUCZ w bieżącym stanie.', false);
  } else if (frame.action === 'done') {
    question.textContent = 'Czy wszystkie elementy są już w kolejności rosnącej?';
    appendStateAnswer(answers, 'Tak', 'Tak. Ostatni stan pokazuje wynik rosnący.', true);
    appendStateAnswer(answers, 'Nie', 'Wynik jest gotowy — porównaj sąsiednie klucze.', false);
  } else {
    question.textContent = 'Wykonaj co najmniej jeden krok, aby zobaczyć pytanie o stan.';
  }
}
function render() {
  const frame = currentFrame();
  renderArray(frame);
  renderState(frame);
  renderCurrentQuestion(frame);
  $('#step-button').disabled = cursor >= trace.frames.length - 1;
}
function advance() {
  if (cursor < trace.frames.length - 1) {
    cursor += 1;
    render();
  } else stopPlayback();
}
function loadPreset() {
  const makePreset = presets[$('#preset-select').value];
  if (!makePreset) return;
  values = makePreset();
  valuesInput.value = values.join(', ');
  applyUserData();
}
function runBenchmark() {
  const rows = benchmark();
  const body = $('#benchmark-table tbody');
  body.replaceChildren();
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [row.size, row.pattern, ALGORITHMS[row.algorithm].name, row.comparisons, row.writes].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = String(value);
      tr.append(td);
    });
    body.append(tr);
  });
  $('#benchmark-status').textContent = 'Wykonano ' + rows.length + ' przebiegów. To liczniki operacji, nie pomiar czasu zegarowego.';
  return rows;
}

$('#apply-data').addEventListener('click', applyUserData);
$('#load-preset').addEventListener('click', loadPreset);
algorithmSelect.addEventListener('change', applyUserData);
$('#step-button').addEventListener('click', () => { stopPlayback(); advance(); });
$('#reset-button').addEventListener('click', resetRun);
$('#play-button').addEventListener('click', () => {
  if (timer) { stopPlayback(); return; }
  if (cursor >= trace.frames.length - 1) resetRun();
  $('#play-button').textContent = 'Pauza';
  timer = window.setInterval(advance, Number($('#speed-input').value));
});
$('#speed-input').addEventListener('input', (event) => {
  $('#speed-value').textContent = event.target.value + ' ms';
  if (timer) {
    stopPlayback();
    $('#play-button').click();
  }
});
$('#run-benchmark').addEventListener('click', runBenchmark);
document.querySelectorAll('.answer-button[data-quiz]').forEach((button) => {
  button.addEventListener('click', () => {
    const quiz = button.dataset.quiz;
    const correct = (quiz === 'stability' && button.dataset.value === 'im') || (quiz === 'pivot' && button.dataset.value === 'last');
    document.querySelectorAll('[data-feedback="' + quiz + '"]').forEach((el) => {
      el.textContent = correct
        ? (quiz === 'stability' ? 'Dobrze. Insertion przesuwa tylko większe klucze, a Merge przy równości bierze element z lewej połowy.' : 'Dobrze. W każdej partycji pivotem jest ostatni element aktywnego fragmentu.')
        : (quiz === 'stability' ? 'Nie. W tej implementacji kolejność równych kluczy zachowują Insertion Sort i Merge Sort.' : 'Nie. W wariancie Lomuto pivotem jest ostatni element aktywnego fragmentu.');
      el.className = 'feedback ' + (correct ? 'correct' : 'incorrect');
    });
  });
});
render();

