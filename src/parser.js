export function parseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const jsonRecords = [];
  let jsonCount = 0;
  for (const line of lines) {
    try {
      jsonRecords.push(JSON.parse(line));
      jsonCount += 1;
    } catch {
      jsonRecords.push({ role: 'note', content: line });
    }
  }
  if (jsonCount === lines.length) return jsonRecords.map(normalizeRecord);
  return lines.map((line, index) => normalizeRecord({ role: 'note', content: line, index }));
}

export function normalizeRecord(record) {
  const content = String(record.content ?? record.message ?? record.action ?? '').trim();
  return {
    ...record,
    role: record.role ?? record.phase ?? record.type ?? 'event',
    content,
    text: [record.role, record.phase, record.type, record.tool, record.action, record.target, content]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}
