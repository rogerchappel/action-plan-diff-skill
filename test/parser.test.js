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
  assert.equal(records[0].phase, 'plan');
  assert.equal(records[0].content, 'inspect');
  assert.equal(records[1].phase, 'validation');
  assert.equal(records[1].content, 'npm test');
});

test('preserves structured records in mixed jsonl and plain text input', () => {
  const records = parseInput('{"type":"tool","tool":"exec","action":"deploy"}\nOperator note');

  assert.equal(records[0].role, 'tool');
  assert.equal(records[0].tool, 'exec');
  assert.match(records[0].text, /deploy/);
  assert.equal(records[1].role, 'note');
  assert.equal(records[1].content, 'Operator note');
});
