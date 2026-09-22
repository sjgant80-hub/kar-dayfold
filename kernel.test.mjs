import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('single window folds through unchanged', () => {
  const result = K.foldDay([
    { windowId: 'w1', dream: 2, render: 1, gate: 1, note: 3 },
  ]);
  assert.deepEqual(result, {
    ok: true,
    value: { dream: 2, render: 1, gate: 1, note: 3, windows: 1 },
  });
});

test('rerun of the same windowId never double-counts: last report wins', () => {
  const result = K.foldDay([
    { windowId: 'w1', dream: 2, render: 1, gate: 1, note: 3 },
    { windowId: 'w1', dream: 5, render: 2, gate: 2, note: 4 },
  ]);
  assert.deepEqual(result, {
    ok: true,
    value: { dream: 5, render: 2, gate: 2, note: 4, windows: 1 },
  });
});

test('distinct windows sum into one true daily total', () => {
  const result = K.foldDay([
    { windowId: 'w1', dream: 2, render: 1, gate: 1, note: 3 },
    { windowId: 'w2', dream: 4, render: 0, gate: 2, note: 1 },
  ]);
  assert.deepEqual(result, {
    ok: true,
    value: { dream: 6, render: 1, gate: 3, note: 4, windows: 2 },
  });
});

test('empty day folds to all zeros, not an error', () => {
  const result = K.foldDay([]);
  assert.deepEqual(result, {
    ok: true,
    value: { dream: 0, render: 0, gate: 0, note: 0, windows: 0 },
  });
});

test('non-array input returns ok:false instead of throwing', () => {
  const result = K.foldDay(null);
  assert.equal(result.ok, false);
  assert.equal(typeof result.why, 'string');
});

test('an entry with a negative count returns ok:false, not a silent total', () => {
  const result = K.foldDay([
    { windowId: 'w1', dream: 2, render: 1, gate: 1, note: -1 },
  ]);
  assert.equal(result.ok, false);
  assert.match(result.why, /note/);
});

test('a null entry is rejected as "must be an object" (kills e===null clause)', () => {
  const result = K.foldDay([null]);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'entry at index 0 must be an object');
});

test('a primitive entry (string) is rejected as "must be an object" (kills typeof clause)', () => {
  const result = K.foldDay(['not-an-object']);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'entry at index 0 must be an object');
});

test('an array-as-entry is rejected as "must be an object" (kills Array.isArray clause)', () => {
  const result = K.foldDay([[1, 2, 3]]);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'entry at index 0 must be an object');
});

test('a non-string windowId is rejected with the exact windowId message (kills typeof windowId clause)', () => {
  const result = K.foldDay([
    { windowId: 123, dream: 1, render: 1, gate: 1, note: 1 },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'entry at index 0 must have a non-empty string windowId');
});

test('an empty-string windowId is rejected with the exact windowId message (kills length===0 clause)', () => {
  const result = K.foldDay([
    { windowId: '', dream: 1, render: 1, gate: 1, note: 1 },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'entry at index 0 must have a non-empty string windowId');
});
