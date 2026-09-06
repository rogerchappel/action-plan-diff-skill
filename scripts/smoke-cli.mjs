import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

function run(args) {
  return spawnSync(process.execPath, ['src/cli.js', ...args], { encoding: 'utf8' });
}

const help = run(['--help']);
assert.equal(help.status, 0, help.stderr);
assert.match(help.stdout, /^Usage:/);

const versionResult = run(['--version']);
assert.equal(versionResult.status, 0, versionResult.stderr);
assert.equal(versionResult.stdout.trim(), version);

const blocked = run(['fixtures/sample.jsonl', '--format', 'markdown']);
assert.notEqual(blocked.status, 0);
assert.equal(blocked.stderr, '');
assert.match(blocked.stdout, /Status: blocked/);

const ready = run(['fixtures/ready.jsonl', '--json']);
assert.equal(ready.status, 0, ready.stderr);
assert.equal(JSON.parse(ready.stdout).summary.status, 'ready');

console.log('CLI smoke passed: terminal modes and ready/blocked exit codes verified.');
