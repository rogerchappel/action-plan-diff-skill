import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('prints usage help', () => {
  const output = execFileSync('node', ['src/cli.js', '--help'], { encoding: 'utf8' });
  assert.match(output, /Usage: action-plan-diff-skill/);
  assert.match(output, /--format markdown\|json/);
  assert.match(output, /--output report\.md/);
});
