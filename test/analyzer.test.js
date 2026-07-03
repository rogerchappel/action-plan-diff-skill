import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput } from '../src/parser.js';
import { analyze } from '../src/analyzer.js';

test('produces findings for sample fixture', () => {
  const records = parseInput(`{"phase":"plan","action":"create ticket","target":"crm","approval":"required","dryRun":true}
{"phase":"plan","action":"send summary","target":"slack","approval":"required","dryRun":true}
{"phase":"execution","action":"create ticket","target":"crm","approved":false,"dryRun":true}
{"phase":"execution","action":"send summary","target":"slack","approved":true,"dryRun":false}`);
  const result = analyze(records);
  assert.ok(result.findings.length >= 1);
  assert.ok(['ready', 'blocked'].includes(result.summary.status));
});

test('flags empty input as missing evidence', () => {
  const result = analyze([]);
  assert.ok(result.findings.some((finding) => finding.severity === 'critical' || finding.severity === 'high'));
});
