import { ALGORITHMS, benchmark, buildTrace, parseValues } from './algorithms.js';

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
