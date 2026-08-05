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

test('requires an explicit boolean dryRun state for structured execution records', () => {
  for (const execution of [
    '{"phase":"execution","action":"inspect","target":"local"}',
    '{"phase":"execution","action":"inspect","target":"local","dryRun":"false"}'
  ]) {
    const records = parseInput(`{"phase":"plan","action":"inspect","target":"local","dryRun":true}\n${execution}`);
    const result = analyze(records);

    assert.equal(result.summary.status, 'blocked');
    assert.ok(result.findings.some((finding) => finding.code === 'invalid-execution-dry-run'));
    assert.ok(!result.findings.some((finding) => finding.code === 'plan-matched'));
  }
});

test('accepts dry-run execution and validates an approved value when supplied', () => {
  const valid = analyze(parseInput(`{"phase":"plan","action":"inspect","dryRun":true}
{"phase":"execution","action":"inspect","dryRun":true,"approved":false}`));
  assert.equal(valid.summary.status, 'ready');
  assert.ok(valid.findings.some((finding) => finding.code === 'plan-matched'));

  const malformed = analyze(parseInput(`{"phase":"plan","action":"inspect","dryRun":true}
{"phase":"execution","action":"inspect","dryRun":true,"approved":"true"}`));
  assert.equal(malformed.summary.status, 'blocked');
  assert.ok(malformed.findings.some((finding) => finding.code === 'invalid-execution-approval'));
});

test('requires a non-empty action identity on structured plan records', () => {
  for (const action of [undefined, '', '   ']) {
    const plan = { phase: 'plan', dryRun: true };
    if (action !== undefined) plan.action = action;
    const records = parseInput(`${JSON.stringify(plan)}\n{"phase":"execution","action":"inspect","dryRun":true}`);
    const result = analyze(records);

    assert.equal(result.summary.status, 'blocked');
    assert.ok(result.findings.some((finding) => finding.code === 'invalid-plan-action'));
    assert.ok(!result.findings.some((finding) => finding.code === 'plan-matched'));
  }
});

test('requires a non-empty action identity on structured execution records', () => {
  for (const action of [undefined, '', '   ']) {
    const execution = { phase: 'execution', dryRun: true };
    if (action !== undefined) execution.action = action;
    const records = parseInput(`{"phase":"plan","action":"inspect","dryRun":true}\n${JSON.stringify(execution)}`);
    const result = analyze(records);

    assert.equal(result.summary.status, 'blocked');
    assert.ok(result.findings.some((finding) => finding.code === 'invalid-execution-action'));
    assert.ok(!result.findings.some((finding) => finding.code === 'plan-matched'));
  }
});

test('normalizes structured action and target identity for matching', () => {
  const result = analyze(parseInput(`{"phase":"plan","action":" Inspect ","target":" Local ","dryRun":true}
{"phase":"execution","action":"inspect","target":"local","dryRun":true}`));

  assert.equal(result.summary.status, 'ready');
  assert.ok(result.findings.some((finding) => finding.code === 'plan-matched'));
});

test('keeps otherwise identical structured actions distinct by target', () => {
  const result = analyze(parseInput(`{"phase":"plan","action":"inspect","target":"staging","dryRun":true}
{"phase":"execution","action":"inspect","target":"production","dryRun":true}`));

  assert.equal(result.summary.status, 'blocked');
  assert.ok(result.findings.some((finding) => finding.code === 'unplanned-action'));
  assert.ok(result.findings.some((finding) => finding.code === 'planned-action-not-executed'));
  assert.ok(!result.findings.some((finding) => finding.code === 'plan-matched'));
});

test('requires approved true for live execution', () => {
  for (const approved of [undefined, false]) {
    const approval = approved === undefined ? '' : `,"approved":${approved}`;
    const result = analyze(parseInput(`{"phase":"plan","action":"deploy","dryRun":true}
{"phase":"execution","action":"deploy","dryRun":false${approval}}`));

    assert.equal(result.summary.status, 'blocked');
    assert.ok(result.findings.some((finding) => finding.code === 'live-action-without-approval'));
    assert.ok(result.findings.some((finding) => finding.code === 'dry-run-drift'));
  }

  const approved = analyze(parseInput(`{"phase":"plan","action":"deploy","dryRun":true}
{"phase":"execution","action":"deploy","dryRun":false,"approved":true}`));
  assert.equal(approved.summary.status, 'blocked');
  assert.ok(!approved.findings.some((finding) => finding.code === 'live-action-without-approval'));
  assert.ok(approved.findings.some((finding) => finding.code === 'dry-run-drift'));
});
