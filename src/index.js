import { parseInput } from './parser.js';
import { analyze } from './analyzer.js';
import { renderReport } from './report.js';

export function runAudit(raw, options = {}) {
  const records = parseInput(raw);
  return renderReport(analyze(records), options);
}

export { parseInput, analyze, renderReport };
