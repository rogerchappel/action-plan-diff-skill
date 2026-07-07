import { execFileSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const bins = Object.entries(pkg.bin ?? {});

if (bins.length === 0) {
  throw new Error('package.json does not declare any CLI bin entries');
}

const missing = [];
for (const [name, target] of bins) {
  try {
    const binUrl = new URL(`../${target}`, import.meta.url);
    await access(binUrl);
    const { stdout } = await execFileAsync('node', [fileURLToPath(binUrl), '--version']);
    if (stdout.trim() !== pkg.version) {
      throw new Error(`${name} --version returned ${JSON.stringify(stdout.trim())}, expected ${pkg.version}`);
    }
  } catch {
    missing.push(`${name} -> ${target}`);
  }
}

if (missing.length > 0) {
  throw new Error(`package bin target(s) missing: ${missing.join(', ')}`);
}

console.log(`Verified ${bins.length} package bin target(s) and version command(s).`);

for (const entry of ['README.md', 'LICENSE', 'SECURITY.md', 'CHANGELOG.md', 'CONTRIBUTING.md']) {
  if (!pkg.files?.includes(entry)) {
    throw new Error(`package files allowlist is missing ${entry}`);
  }

  await access(new URL(`../${entry}`, import.meta.url));
}

console.log('Verified package support documents.');

const expectedPackedFiles = [
  'src/cli.js',
  'src/index.js',
  'src/analyzer.js',
  'fixtures/sample.jsonl',
  'scripts/verify-package-bin.mjs',
  'docs/RELEASE_CANDIDATE.md',
  'SKILL.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
];

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit']
});

const [pack] = JSON.parse(output);
const publishedFiles = new Set(pack.files.map((file) => file.path));
const missingPackedFiles = expectedPackedFiles.filter((file) => !publishedFiles.has(file));

if (missingPackedFiles.length > 0) {
  throw new Error(`package dry-run missing expected file(s): ${missingPackedFiles.join(', ')}`);
}

console.log(`Verified package dry-run contents (${pack.files.length} file(s)).`);
