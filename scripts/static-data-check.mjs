import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questionsPath = path.resolve(__dirname, '../app/questions.js');
const questionsSource = fs.readFileSync(questionsPath, 'utf8');

function extractArrayLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Marker not found: ${marker}`);

  const start = source.indexOf('[', markerIndex);
  if (start < 0) throw new Error('questions array start not found');

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error('questions array end not found');
}

const literal = extractArrayLiteral(
  questionsSource,
  'window.MAHJONG_QUESTIONS ='
);
const questions = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(Array.isArray(questions), 'questions must be an array');
assert(questions.length === 100, `question count must be 100 (actual: ${questions.length})`);

const ids = questions.map(q => q.id);
assert(new Set(ids).size === ids.length, 'question IDs must be unique');

const expectedFuCounts = new Map([[20, 10], [25, 10], [30, 20], [40, 20], [50, 15], [60, 25]]);
const actualFuCounts = new Map();
let kiriageCount = 0;

for (const [index, q] of questions.entries()) {
  const label = q?.id ?? `index ${index}`;
  assert(typeof q.id === 'string' && /^q\d{3}$/.test(q.id), `${label}: invalid ID`);
  assert(Array.isArray(q.concealedTiles) && q.concealedTiles.length === 13, `${label}: concealedTiles must contain 13 tiles`);
  assert(typeof q.winningTile === 'string', `${label}: winningTile is required`);
  assert(['ron', 'tsumo'].includes(q.winType), `${label}: invalid winType`);
  assert(q.answer && Number.isInteger(q.answer.totalHan) && q.answer.totalHan >= 1, `${label}: invalid totalHan`);
  assert(q.answer && [20, 25, 30, 40, 50, 60].includes(q.answer.fu), `${label}: invalid fu`);
  assert(q.management?.fu === q.answer?.fu, `${label}: management.fu mismatch`);
  assert(q.management?.han === q.answer?.totalHan, `${label}: management.han mismatch`);
  assert(q.management?.kiriageMangan === q.answer?.score?.kiriageMangan, `${label}: kiriage flag mismatch`);

  const yakuHan = Array.isArray(q.answer?.yaku)
    ? q.answer.yaku.reduce((sum, yaku) => sum + Number(yaku.han || 0), 0)
    : 0;
  assert(yakuHan === q.answer?.totalHan, `${label}: yaku han total mismatch (${yakuHan} != ${q.answer?.totalHan})`);

  actualFuCounts.set(q.answer.fu, (actualFuCounts.get(q.answer.fu) ?? 0) + 1);
  if (q.answer.score.kiriageMangan) kiriageCount += 1;
}

for (const [fu, expected] of expectedFuCounts) {
  assert(actualFuCounts.get(fu) === expected, `${fu} fu count must be ${expected} (actual: ${actualFuCounts.get(fu) ?? 0})`);
}
assert(kiriageCount === 10, `kiriage mangan count must be 10 (actual: ${kiriageCount})`);

if (errors.length > 0) {
  console.error(`Static data check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Static data check passed.');
console.log(`- Questions: ${questions.length}`);
console.log(`- Unique IDs: ${new Set(ids).size}`);
console.log(`- Kiriage mangan: ${kiriageCount}`);
console.log(`- Fu distribution: ${[...actualFuCounts.entries()].sort((a, b) => a[0] - b[0]).map(([fu, count]) => `${fu}符=${count}問`).join(', ')}`);
