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
