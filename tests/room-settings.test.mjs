import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/roomSettings.ts', import.meta.url), 'utf8');
const compiledSource = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const {
  DEFAULT_ROOM_SETTINGS,
  QUESTION_TIME_OPTIONS,
  getQuestionTime,
} = await import(`data:text/javascript;base64,${Buffer.from(compiledSource).toString('base64')}`);

test('new rooms default to a 15 second question timer', () => {
  assert.equal(DEFAULT_ROOM_SETTINGS.questionTime, 15);
  assert.deepEqual(QUESTION_TIME_OPTIONS, [10, 15, 20, 30]);
});

test('the selected room time is used when a question timer resets', () => {
  assert.equal(getQuestionTime({ ...DEFAULT_ROOM_SETTINGS, questionTime: 30 }), 30);
});
