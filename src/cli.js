#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { runAudit } from './index.js';

function parseArgs(argv) {
  const args = { format: 'markdown', output: null, file: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--format') args.format = argv[++i] ?? 'markdown';
    else if (token === '--json') args.format = 'json';
    else if (token === '--output') args.output = argv[++i] ?? null;
    else if (!args.file) args.file = token;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || args.file === '--help') {
  console.log('Usage: action-plan-diff-skill <fixture.jsonl|notes.txt> [--format markdown|json] [--output report.md]');
  process.exit(args.file === '--help' ? 0 : 1);
}
const report = runAudit(readFileSync(args.file, 'utf8'), { format: args.format });
if (args.output) writeFileSync(args.output, report);
else process.stdout.write(report);
