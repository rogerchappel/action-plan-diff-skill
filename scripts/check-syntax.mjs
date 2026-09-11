#!/usr/bin/env node
// Syntax gate: run `node --check` once per JavaScript file.
//
// `node --check` validates only its first positional file and silently
// ignores the rest, so the previous `node --check src/*.js test/*.js`
// script parsed exactly one file. This runner checks every .js/.mjs/.cjs
// file under each target directory and reports every failure.
//
// Usage: node scripts/check-syntax.mjs [dir ...]   (default: src test scripts)
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const CHECK_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const DEFAULT_DIRECTORIES = ['src', 'test', 'scripts'];

function collectFiles(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      entries.push(...collectFiles(path));
    } else if (entry.isFile() && hasCheckableExtension(path)) {
      entries.push(path);
    }
  }
  return entries.sort();
}

function hasCheckableExtension(path) {
  const dot = path.lastIndexOf('.');
  return dot > 0 && CHECK_EXTENSIONS.has(path.slice(dot));
}

function checkFile(path) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  if (result.status === 0) {
    return null;
  }
  const detail = (result.stderr || result.stdout || '').trim().split('\n')[0];
  return `${path}: ${detail || `node --check exited ${result.status}`}`;
}

const directories = process.argv.slice(2);
const targets = directories.length > 0 ? directories : DEFAULT_DIRECTORIES;

const failures = [];
const checked = [];
for (const directory of targets) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    failures.push(`${directory}: directory not found`);
    continue;
  }
  const files = collectFiles(directory);
  if (files.length === 0) {
    failures.push(`${directory}: no JavaScript files found to check`);
    continue;
  }
  for (const file of files) {
    checked.push(file);
    const failure = checkFile(file);
    if (failure) {
      failures.push(failure);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`syntax check ok: ${checked.length} files`);
