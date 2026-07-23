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

test('matches equivalent actions in plain text plan and execution sections', () => {
  const records = parseInput('Plan: send summary to Slack\nExecution: send summary to Slack');
  const result = analyze(records);

  assert.equal(result.summary.status, 'ready');
  assert.deepEqual(result.stats, { planned: 1, executed: 1 });
  assert.ok(result.findings.some((finding) => finding.code === 'plan-matched'));
});

test('flags a mismatching action in plain text sections', () => {
  const records = parseInput('Plan: send summary to Slack\nAction: delete Slack channel');
  const result = analyze(records);

  assert.equal(result.summary.status, 'blocked');
  assert.ok(result.findings.some((finding) => finding.code === 'unplanned-action'));
  assert.ok(result.findings.some((finding) => finding.code === 'planned-action-not-executed'));
});

test('does not treat explicit execution evidence mentioning a plan as planned', () => {
  const records = parseInput('{"phase":"execution","action":"delete channel","target":"slack","dryRun":true,"content":"completed according to plan"}');
  const result = analyze(records);

  assert.equal(result.summary.status, 'blocked');
  assert.deepEqual(result.stats, { planned: 0, executed: 1 });
  assert.ok(result.findings.some((finding) => finding.code === 'missing-plan'));
  assert.ok(result.findings.some((finding) => finding.code === 'unplanned-action'));
});

test('does not treat an explicit plan mentioning a result as executed', () => {
  const records = parseInput('{"phase":"plan","action":"send summary","target":"slack","content":"review the execution result"}');
  const result = analyze(records);

  assert.equal(result.summary.status, 'blocked');
  assert.deepEqual(result.stats, { planned: 1, executed: 0 });
  assert.ok(result.findings.some((finding) => finding.code === 'missing-execution-evidence'));
  assert.ok(result.findings.some((finding) => finding.code === 'planned-action-not-executed'));
});
