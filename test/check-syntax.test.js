import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKER = fileURLToPath(new URL('../scripts/check-syntax.mjs', import.meta.url));

function runChecker(args, cwd) {
  return spawnSync(process.execPath, [CHECKER, ...args], { encoding: 'utf8', cwd });
}

function makeFixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'check-syntax-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
  return root;
}

function writeJs(dir, name, contents) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), contents);
}

const VALID = 'export const ok = 1;\n';
const BROKEN = 'const broken = ;\n';

test('syntax gate flags a broken file in src, test, and scripts directories', () => {
  for (const dir of ['src', 'test', 'scripts']) {
    const root = makeFixtureRoot();
    writeJs(join(root, dir), 'good.js', VALID);
    writeJs(join(root, dir), 'bad.js', BROKEN);
    const result = runChecker([dir], root);
    assert.notEqual(result.status, 0, `expected nonzero exit for broken file under ${dir}/`);
    assert.match(result.stdout + result.stderr, /bad\.js/, `expected ${dir}/bad.js to be named`);
  }
});

test('syntax gate checks every matched file instead of only the first argument', () => {
  const root = makeFixtureRoot();
  writeJs(join(root, 'src'), 'a.js', BROKEN);
  writeJs(join(root, 'src'), 'b.js', BROKEN);
  writeJs(join(root, 'src'), 'c.js', VALID);
  const result = runChecker(['src'], root);
  assert.notEqual(result.status, 0);
  const output = result.stdout + result.stderr;
  assert.match(output, /a\.js/);
  assert.match(output, /b\.js/);
});

test('syntax gate accepts valid trees and reports the checked file count', () => {
  const root = makeFixtureRoot();
  writeJs(join(root, 'src'), 'a.js', VALID);
  writeJs(join(root, 'src'), 'b.mjs', VALID);
  writeJs(join(root, 'src', 'nested'), 'c.js', VALID);
  const result = runChecker(['src'], root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /syntax check ok: 3 files/);
});

test('syntax gate fails loudly on missing directories or empty matches', () => {
  const root = makeFixtureRoot();
  const missing = runChecker(['nope'], root);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stdout + missing.stderr, /nope/);

  const emptyRoot = makeFixtureRoot();
  mkdirSync(join(emptyRoot, 'src'));
  const empty = runChecker(['src'], emptyRoot);
  assert.notEqual(empty.status, 0);
  assert.match(empty.stdout + empty.stderr, /no JavaScript files/);
});

test('repository default gate covers src, test, and scripts with zero failures', () => {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const result = runChecker([], repoRoot);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const count = Number((result.stdout.match(/syntax check ok: (\d+) files/) ?? [])[1]);
  assert.ok(count >= 13, `expected src+test+scripts coverage, saw ${result.stdout}`);
});
