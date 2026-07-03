export function analyze(records) {
  const planned = records.filter((record) => record.phase === 'plan' || /\bplan\b/.test(record.text));
  const executed = records.filter((record) => record.phase === 'execution' || /execution|executed|result/.test(record.text));
  const findings = [];
  const plannedKeys = new Set(planned.map(actionKey));
  const executedKeys = new Set(executed.map(actionKey));

  for (const record of executed) {
    const key = actionKey(record);
    if (!plannedKeys.has(key)) findings.push(finding('critical', 'unplanned-action', `Executed action was not in the plan: ${key}`));
    if (record.dryRun === false && record.approved !== true) findings.push(finding('critical', 'live-action-without-approval', `Live action lacks approval: ${key}`));
    if (record.dryRun === false) findings.push(finding('high', 'dry-run-drift', `Action left dry-run mode: ${key}`));
  }
  for (const key of plannedKeys) {
    if (!executedKeys.has(key)) findings.push(finding('medium', 'planned-action-not-executed', `Planned action has no execution evidence: ${key}`));
  }
  if (!planned.length) findings.push(finding('critical', 'missing-plan', 'No planned actions were found.'));
  if (!executed.length) findings.push(finding('high', 'missing-execution-evidence', 'No execution evidence was found.'));
  if (!findings.length) findings.push(finding('info', 'plan-matched', 'Execution matched the dry-run plan.'));
  return { summary: summarize(findings), findings, stats: { planned: planned.length, executed: executed.length } };
}

function actionKey(record) {
  return [record.action ?? record.content ?? 'unknown', record.target ?? 'local'].join('@').toLowerCase();
}

function finding(severity, code, message) {
  return { severity, code, message };
}

function summarize(findings) {
  const blockers = findings.filter((item) => ['critical', 'high'].includes(item.severity)).length;
  return { blockers, status: blockers ? 'blocked' : 'ready' };
}
