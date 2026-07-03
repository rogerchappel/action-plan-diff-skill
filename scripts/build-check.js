import { readFileSync } from 'node:fs';
import { runAudit } from '../src/index.js';

const sample = readFileSync(new URL('../fixtures/sample.jsonl', import.meta.url), 'utf8');
const report = runAudit(sample, { format: 'json' });
const parsed = JSON.parse(report);
if (!parsed.summary || !Array.isArray(parsed.findings)) {
  throw new Error('build check failed: invalid report shape');
}
console.log(`build check ok: ${parsed.findings.length} findings`);
