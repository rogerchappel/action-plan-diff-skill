export function parseInput(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.trim() !== '');
  const jsonRecords = [];
  for (const [index, { line, lineNumber }] of lines.entries()) {
    try {
      const record = JSON.parse(line);
      if (record === null || typeof record !== 'object' || Array.isArray(record)) {
        const kind = record === null ? 'null' : Array.isArray(record) ? 'array' : typeof record;
        throw new InvalidRecordError(`Input line ${lineNumber} must be a JSON object; received ${kind}`);
      }
      jsonRecords.push({ ...record, structured: true });
    } catch (error) {
      if (error instanceof InvalidRecordError) throw error;
      if (/^[{[]/.test(line.trimStart())) {
        throw new InvalidRecordError(`Input line ${lineNumber} contains malformed JSON`);
      }
      jsonRecords.push(parsePlainTextLine(line, index));
    }
  }
  return jsonRecords.map(normalizeRecord);
}

class InvalidRecordError extends Error {}

function parsePlainTextLine(line, index) {
  const section = line.match(/^\s*(plan|action|execution|validation|result)\s*:\s*(.*)$/i);
  if (!section) return { role: 'note', content: line, index, structured: false };

  const name = section[1].toLowerCase();
  const phase = name === 'plan' ? 'plan' : name === 'validation' ? 'validation' : 'execution';
  return { role: 'note', phase, content: section[2].trim(), index, structured: false };
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
