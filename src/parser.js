export function parseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const jsonRecords = [];
  for (const [index, line] of lines.entries()) {
    try {
      jsonRecords.push(JSON.parse(line));
    } catch {
      jsonRecords.push({ role: 'note', content: line, index });
    }
  }
  return jsonRecords.map(normalizeRecord);
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
