#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { analyze, parseInput, renderReport } from './index.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

function parseArgs(argv) {
  const args = { format: 'markdown', output: null, file: null, help: false, version: false };
  const requestedFormats = new Set();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--format' || token === '--output') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) throw new Error(`${token} requires a value`);
      i += 1;
      if (token === '--format') {
        args.format = value;
        requestedFormats.add(value);
      }
      else args.output = value;
    } else if (token === '--json') {
      args.format = 'json';
      requestedFormats.add('json');
    }
    else if (token === '--help') args.help = true;
    else if (token === '--version') args.version = true;
    else if (token.startsWith('-')) throw new Error(`Unknown option "${token}"`);
    else if (!args.file) args.file = token;
    else throw new Error(`Unexpected argument "${token}"`);
  }
  const unsupportedFormat = [...requestedFormats].find((format) => !['markdown', 'json'].includes(format));
  if (unsupportedFormat) throw new Error(`Unsupported format "${unsupportedFormat}" (expected markdown or json)`);
  if (requestedFormats.has('markdown') && requestedFormats.has('json')) {
    throw new Error('Conflicting output formats: markdown and json');
  }
  if ((args.help || args.version) && argv.length !== 1) {
    throw new Error(`${args.help ? '--help' : '--version'} must be used alone`);
  }
  return args;
}

const usage = `Usage:
  action-plan-diff-skill <fixture.jsonl|notes.txt> [--format <markdown|json> | --json] [--output report.md]
  action-plan-diff-skill --help
  action-plan-diff-skill --version`;

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.version) {
    console.log(version);
  } else if (args.help) {
    console.log(usage);
  } else if (!args.file) {
    console.error(usage);
    process.exitCode = 1;
  } else {
    const result = analyze(parseInput(readFileSync(args.file, 'utf8')));
    const report = renderReport(result, { format: args.format });
    if (args.output) writeFileSync(args.output, report);
    else process.stdout.write(report);
    if (result.summary.status === 'blocked') process.exitCode = 1;
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
