export function parseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const jsonRecords = [];
  for (const [index, line] of lines.entries()) {
    try {
      jsonRecords.push(JSON.parse(line));
    } catch {
      jsonRecords.push(parsePlainTextLine(line, index));
    }
  }
  return jsonRecords.map(normalizeRecord);
}

function parsePlainTextLine(line, index) {
  const section = line.match(/^\s*(plan|action|execution|validation|result)\s*:\s*(.*)$/i);
  if (!section) return { role: 'note', content: line, index };

  const name = section[1].toLowerCase();
  const phase = name === 'plan' ? 'plan' : name === 'validation' ? 'validation' : 'execution';
  return { role: 'note', phase, content: section[2].trim(), index };
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
