import { readFile } from 'node:fs/promises';
import path from 'node:path';

const htmlPath = path.resolve('app/index.html');
const html = await readFile(htmlPath, 'utf8');
const match = html.match(/const questions = (\[[\s\S]*?\n\]);\n\n    const SESSION_STORAGE_KEY/);
if (!match) throw new Error('questions配列を抽出できません。');
const questions = JSON.parse(match[1]);
const errors = [];
const add = (condition, message) => { if (!condition) errors.push(message); };

add(questions.length === 100, `問題数: ${questions.length}（期待値100）`);
add(new Set(questions.map(q => q.id)).size === 100, '問題IDが重複しています。');
for (const q of questions) {
  add(q.concealedTiles.length === 13, `${q.id}: 手牌が13枚ではありません。`);
  add(Boolean(q.winningTile), `${q.id}: 和了牌がありません。`);
  add(['ron','tsumo'].includes(q.winType), `${q.id}: 和了方法が不正です。`);
  const yakuHan = q.answer.yaku.reduce((sum, y) => sum + y.han, 0);
  add(yakuHan === q.answer.totalHan, `${q.id}: 役の翻数合計が不一致です。`);
  add(q.management.fu === q.answer.fu, `${q.id}: management.fuが不一致です。`);
  add(q.management.han === q.answer.totalHan, `${q.id}: management.hanが不一致です。`);
  add(q.management.scoreCategory === q.answer.score.category, `${q.id}: 点数区分が不一致です。`);
  add(q.management.kiriageMangan === q.answer.score.kiriageMangan, `${q.id}: 切り上げ満貫フラグが不一致です。`);
}
const fuCounts = Object.fromEntries([20,25,30,40,50,60].map(fu => [fu, questions.filter(q => q.answer.fu === fu).length]));
add(JSON.stringify(fuCounts) === JSON.stringify({20:10,25:10,30:20,40:20,50:15,60:25}), `符別構成が不一致: ${JSON.stringify(fuCounts)}`);
const kiriage = questions.filter(q => q.answer.score.kiriageMangan).map(q => q.id);
const expectedKiriage = ['q026','q030','q081','q085','q086','q090','q091','q095','q096','q100'];
add(JSON.stringify(kiriage) === JSON.stringify(expectedKiriage), `切り上げ満貫対象が不一致: ${kiriage.join(',')}`);

console.log(`問題数: ${questions.length}`);
console.log(`符別構成: ${JSON.stringify(fuCounts)}`);
console.log(`切り上げ満貫: ${kiriage.join(', ')}`);
if (errors.length) {
  console.error(`NG: ${errors.length}件`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('OK: 静的データ検証に合格しました。');
