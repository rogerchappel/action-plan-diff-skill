import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../src/report.js';

test('renders markdown report', () => {
  const report = renderReport({ summary: { status: 'ready', blockers: 0 }, findings: [{ severity: 'info', code: 'ok', message: 'fine' }], stats: { records: 1 } });
  assert.match(report, /Skill Run Report/);
  assert.match(report, /records: 1/);
});

test('renders json report', () => {
  const report = renderReport({ summary: { status: 'ready', blockers: 0 }, findings: [], stats: {} }, { format: 'json' });
  assert.equal(JSON.parse(report).summary.status, 'ready');
});

test('renders execution contract findings in markdown', () => {
  const report = renderReport({
    summary: { status: 'blocked', blockers: 1 },
    findings: [{ severity: 'critical', code: 'invalid-execution-dry-run', message: 'Structured execution dryRun must be boolean: inspect@local' }],
    stats: { planned: 1, executed: 1 }
  });
  assert.match(report, /Status: blocked/);
  assert.match(report, /invalid-execution-dry-run/);
  assert.match(report, /dryRun must be boolean/);
});


test('renders SARIF 2.1.0 rules and findings', () => {
  const report = JSON.parse(renderReport({
    summary: { status: 'blocked', blockers: 1 },
    findings: [{ severity: 'critical', code: 'missing-plan', message: 'No plan.' }],
    stats: {}
  }, { format: 'sarif' }));
  assert.equal(report.version, '2.1.0');
  assert.equal(report.runs[0].tool.driver.name, 'action-plan-diff-skill');
  assert.equal(report.runs[0].tool.driver.rules[0].id, 'missing-plan');
  assert.deepEqual(report.runs[0].results[0], { ruleId: 'missing-plan', level: 'error', message: { text: 'No plan.' } });
});
