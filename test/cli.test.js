import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

test('prints usage help', () => {
  const output = execFileSync('node', ['src/cli.js', '--help'], { encoding: 'utf8' });
  assert.match(output, /Usage: action-plan-diff-skill/);
  assert.match(output, /--format <markdown\|json>/);
  assert.match(output, /--json/);
  assert.match(output, /--output report\.md/);
  assert.match(output, /--version/);
});

test('prints package version', () => {
  const output = execFileSync('node', ['src/cli.js', '--version'], { encoding: 'utf8' });
  assert.equal(output.trim(), pkg.version);
});

function runCli(args) {
  return spawnSync('node', ['src/cli.js', ...args], { encoding: 'utf8' });
}

test('supports documented output formats and the json alias', () => {
  for (const args of [
    ['fixtures/sample.jsonl', '--format', 'markdown'],
    ['fixtures/sample.jsonl', '--format', 'json'],
    ['fixtures/sample.jsonl', '--json']
  ]) {
    const result = runCli(args);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
  }
});

test('rejects options with missing values', () => {
  for (const args of [
    ['fixtures/sample.jsonl', '--format'],
    ['fixtures/sample.jsonl', '--output']
  ]) {
    const result = runCli(args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /requires a value/);
    assert.equal(result.stdout, '');
  }
});

test('rejects unsupported formats, unknown flags, and extra positional arguments', () => {
  const cases = [
    { args: ['fixtures/sample.jsonl', '--format', 'yaml'], error: /Unsupported format "yaml"/ },
    { args: ['fixtures/sample.jsonl', '--bogus', 'value'], error: /Unknown option "--bogus"/ },
    { args: ['fixtures/sample.jsonl', 'extra.txt'], error: /Unexpected argument "extra.txt"/ }
  ];

  for (const { args, error } of cases) {
    const result = runCli(args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, error);
    assert.equal(result.stdout, '');
  }
});

test('writes a report to the requested output file', () => {
  const output = `.tmp-cli-output-${process.pid}.md`;
  try {
    const result = runCli(['fixtures/sample.jsonl', '--output', output]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.match(execFileSync('node', ['-e', `process.stdout.write(require('fs').readFileSync('${output}', 'utf8'))`], { encoding: 'utf8' }), /Skill Run Report/);
  } finally {
    execFileSync('node', ['-e', `require('fs').rmSync('${output}', { force: true })`]);
  }
});

test('reports malformed structured execution state as blocking JSON', () => {
  const input = `.tmp-cli-input-${process.pid}.jsonl`;
  try {
    execFileSync('node', ['-e', `require('fs').writeFileSync('${input}', '{"phase":"plan","action":"inspect","dryRun":true}\\n{"phase":"execution","action":"inspect","dryRun":"true"}\\n')`]);
    const result = runCli([input, '--json']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).summary.status, 'blocked');
    assert.match(result.stdout, /invalid-execution-dry-run/);
  } finally {
    execFileSync('node', ['-e', `require('fs').rmSync('${input}', { force: true })`]);
  }
});
