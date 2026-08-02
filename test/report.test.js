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
