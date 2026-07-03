import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput } from '../src/parser.js';

test('parses jsonl records', () => {
  const records = parseInput('{"role":"user","content":"Plan"}\n{"type":"tool","tool":"exec"}');
  assert.equal(records.length, 2);
  assert.match(records[0].text, /plan/);
});

test('parses plain text lines', () => {
  const records = parseInput('Plan: inspect\nValidation: npm test');
  assert.equal(records.length, 2);
  assert.equal(records[0].role, 'note');
});
