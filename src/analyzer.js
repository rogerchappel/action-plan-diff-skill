export function analyze(records) {
  const planned = records.filter((record) => matchesPhase(record, 'plan', /\bplan\b/));
  const executed = records.filter((record) => matchesPhase(record, 'execution', /execution|executed|result/));
  const findings = [];
  const plannedKeys = new Set(planned.map(actionKey).filter(Boolean));
  const executedKeys = new Set(executed.map(actionKey).filter(Boolean));

  for (const record of planned) {
    if (record.structured && !actionKey(record)) {
      findings.push(finding('critical', 'invalid-plan-action', 'Structured plan action must be a non-empty string.'));
    }
  }

  for (const record of executed) {
    const key = actionKey(record);
    if (record.structured && !key) {
      findings.push(finding('critical', 'invalid-execution-action', 'Structured execution action must be a non-empty string.'));
    } else if (!plannedKeys.has(key)) {
      findings.push(finding('critical', 'unplanned-action', `Executed action was not in the plan: ${key}`));
    }
    const label = key ?? 'invalid structured action';
    if (record.structured && typeof record.dryRun !== 'boolean') {
      findings.push(finding('critical', 'invalid-execution-dry-run', `Structured execution dryRun must be boolean: ${label}`));
    }
    if (record.structured && record.approved !== undefined && typeof record.approved !== 'boolean') {
      findings.push(finding('critical', 'invalid-execution-approval', `Structured execution approved must be boolean when provided: ${label}`));
    }
    if (record.dryRun === false && record.approved !== true) findings.push(finding('critical', 'live-action-without-approval', `Live action lacks approval: ${label}`));
    if (record.dryRun === false) findings.push(finding('high', 'dry-run-drift', `Action left dry-run mode: ${label}`));
  }
  for (const key of plannedKeys) {
    if (!executedKeys.has(key)) findings.push(finding('medium', 'planned-action-not-executed', `Planned action has no execution evidence: ${key}`));
  }
  if (!planned.length) findings.push(finding('critical', 'missing-plan', 'No planned actions were found.'));
  if (!executed.length) findings.push(finding('high', 'missing-execution-evidence', 'No execution evidence was found.'));
  if (!findings.length) findings.push(finding('info', 'plan-matched', 'Execution matched the dry-run plan.'));
  return { summary: summarize(findings), findings, stats: { planned: planned.length, executed: executed.length } };
}

function matchesPhase(record, phase, fallbackPattern) {
  return typeof record.phase === 'string' ? record.phase === phase : fallbackPattern.test(record.text);
}

function actionKey(record) {
  if (record.structured && (typeof record.action !== 'string' || !record.action.trim())) return null;
  const action = String(record.action ?? record.content ?? 'unknown').trim().toLowerCase();
  const target = String(record.target ?? 'local').trim().toLowerCase() || 'local';
  return `${action}@${target}`;
}

function finding(severity, code, message) {
  return { severity, code, message };
}

function summarize(findings) {
  const blockers = findings.filter((item) => ['critical', 'high'].includes(item.severity)).length;
  return { blockers, status: blockers ? 'blocked' : 'ready' };
}
