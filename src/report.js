export function renderReport(result, options = {}) {
  if (options.format === 'json') return `${JSON.stringify(result, null, 2)}\n`;
  if (options.format === 'sarif') return `${JSON.stringify(toSarif(result), null, 2)}\n`;
  const lines = ['# Skill Run Report', '', `Status: ${result.summary.status}`, `Blockers: ${result.summary.blockers}`, ''];
  lines.push('## Findings', '');
  for (const finding of result.findings) lines.push(`- ${finding.severity}: ${finding.code} - ${finding.message}`);
  lines.push('', '## Stats', '');
  for (const [key, value] of Object.entries(result.stats)) lines.push(`- ${key}: ${value}`);
  return `${lines.join('\n')}\n`;
}

function toSarif(result) {
  const rules = [...new Set(result.findings.map((item) => item.code))].map((id) => ({
    id,
    shortDescription: { text: id.replaceAll('-', ' ') }
  }));
  const levels = { critical: 'error', high: 'error', medium: 'warning', low: 'note', info: 'note' };
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: { driver: { name: 'action-plan-diff-skill', rules } },
      results: result.findings.map((item) => ({
        ruleId: item.code,
        level: levels[item.severity] ?? 'warning',
        message: { text: item.message }
      }))
    }]
  };
}
