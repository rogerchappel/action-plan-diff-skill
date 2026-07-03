export function renderReport(result, options = {}) {
  if (options.format === 'json') return `${JSON.stringify(result, null, 2)}\n`;
  const lines = ['# Skill Run Report', '', `Status: ${result.summary.status}`, `Blockers: ${result.summary.blockers}`, ''];
  lines.push('## Findings', '');
  for (const finding of result.findings) lines.push(`- ${finding.severity}: ${finding.code} - ${finding.message}`);
  lines.push('', '## Stats', '');
  for (const [key, value] of Object.entries(result.stats)) lines.push(`- ${key}: ${value}`);
  return `${lines.join('\n')}\n`;
}
