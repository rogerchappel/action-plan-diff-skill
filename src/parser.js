export function parseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const jsonRecords = [];
  for (const [index, line] of lines.entries()) {
    try {
      const record = JSON.parse(line);
      if (record === null || typeof record !== 'object' || Array.isArray(record)) {
        const kind = record === null ? 'null' : Array.isArray(record) ? 'array' : typeof record;
        throw new InvalidRecordError(`Input line ${index + 1} must be a JSON object; received ${kind}`);
      }
      jsonRecords.push(record);
    } catch (error) {
      if (error instanceof InvalidRecordError) throw error;
      jsonRecords.push(parsePlainTextLine(line, index));
    }
  }
  return jsonRecords.map(normalizeRecord);
}

class InvalidRecordError extends Error {}

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
