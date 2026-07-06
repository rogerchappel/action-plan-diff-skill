import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

test('prints usage help', () => {
  const output = execFileSync('node', ['src/cli.js', '--help'], { encoding: 'utf8' });
  assert.match(output, /Usage: action-plan-diff-skill/);
  assert.match(output, /--format markdown\|json/);
  assert.match(output, /--output report\.md/);
  assert.match(output, /--version/);
});

test('prints package version', () => {
  const output = execFileSync('node', ['src/cli.js', '--version'], { encoding: 'utf8' });
  assert.equal(output.trim(), pkg.version);
});
