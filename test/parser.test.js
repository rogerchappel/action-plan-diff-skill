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
  assert.equal(records[0].structured, false);
});

test('marks JSONL objects as structured records', () => {
  const [record] = parseInput('{"phase":"execution","action":"inspect","dryRun":true}');
  assert.equal(record.structured, true);
});

test('preserves structured records in mixed jsonl and plain text input', () => {
  const records = parseInput('{"type":"tool","tool":"exec","action":"deploy"}\nOperator note');

  assert.equal(records[0].role, 'tool');
  assert.equal(records[0].tool, 'exec');
  assert.match(records[0].text, /deploy/);
  assert.equal(records[1].role, 'note');
  assert.equal(records[1].content, 'Operator note');
});

test('rejects JSONL primitives with an actionable input error', () => {
  assert.throws(
    () => parseInput('null'),
    /Input line 1 must be a JSON object; received null/
  );
});

test('rejects malformed JSON-looking object lines with the input line number', () => {
  assert.throws(
    () => parseInput('Plan: inspect\n  {"phase":"execution","action":"inspect"'),
    /Input line 2 contains malformed JSON/
  );
});

test('reports the physical line after leading and interior blank records', () => {
  assert.throws(
    () => parseInput('\n  \nPlan: inspect\n\t\n  {"phase":"execution"'),
    /Input line 5 contains malformed JSON/
  );
});

test('reports physical CRLF line numbers for non-object JSON', () => {
  assert.throws(
    () => parseInput('\r\nPlan: inspect\r\n\t\r\nnull\r\n'),
    /Input line 4 must be a JSON object; received null/
  );
});

test('ignores whitespace-only records without changing parsed record behavior', () => {
  const records = parseInput('\nPlan: inspect\n  \n{"type":"tool","tool":"exec"}\n\t');

  assert.equal(records.length, 2);
  assert.equal(records[0].content, 'inspect');
  assert.equal(records[0].index, 0);
  assert.equal(records[1].structured, true);
});

test('preserves the existing array diagnostic for valid JSON arrays', () => {
  assert.throws(
    () => parseInput('[{"phase":"plan"}]'),
    /Input line 1 must be a JSON object; received array/
  );
});

test('rejects truncated JSON-looking array lines', () => {
  assert.throws(
    () => parseInput('[{"phase":"plan"}'),
    /Input line 1 contains malformed JSON/
  );
});
