import { execFileSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const consumerDir = await mkdtemp(join(tmpdir(), 'action-plan-diff-package-smoke-'));

try {
  const packOutput = execFileSync('npm', ['pack', '--json', '--pack-destination', consumerDir], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  const [packedArtifact] = JSON.parse(packOutput);
  const tarball = join(consumerDir, packedArtifact.filename);

  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], {
    cwd: consumerDir,
    stdio: 'inherit'
  });

  const fixture = [
    JSON.stringify({ phase: 'plan', action: 'send summary', target: 'slack', approval: 'required', dryRun: true }),
    JSON.stringify({ phase: 'execution', action: 'send summary', target: 'slack', approved: true, dryRun: false })
  ].join('\n');
  const librarySmoke = [
    "import { runAudit } from 'action-plan-diff-skill';",
    `const report = runAudit(${JSON.stringify(fixture)}, { format: 'markdown' });`,
    "if (typeof report !== 'string' || !report.includes('send summary')) throw new Error('runAudit returned an invalid report');"
  ].join('\n');

  execFileSync('node', ['--input-type=module', '--eval', librarySmoke], {
    cwd: consumerDir,
    stdio: 'inherit'
  });

  const installedBin = join(consumerDir, 'node_modules', '.bin', 'action-plan-diff-skill');
  const installedVersion = execFileSync(installedBin, ['--version'], {
    cwd: consumerDir,
    encoding: 'utf8'
  }).trim();
  if (installedVersion !== pkg.version) {
    throw new Error(`installed CLI --version returned ${JSON.stringify(installedVersion)}, expected ${pkg.version}`);
  }

  const invalidIdentityFixture = join(consumerDir, 'missing-action.jsonl');
  await writeFile(invalidIdentityFixture, [
    JSON.stringify({ phase: 'plan', dryRun: true }),
    JSON.stringify({ phase: 'execution', dryRun: true })
  ].join('\n'));
  const invalidIdentityReport = JSON.parse(execFileSync(installedBin, [invalidIdentityFixture, '--json'], {
    cwd: consumerDir,
    encoding: 'utf8'
  }));
  const invalidIdentityCodes = new Set(invalidIdentityReport.findings.map((finding) => finding.code));
  if (invalidIdentityReport.summary.status !== 'blocked'
    || !invalidIdentityCodes.has('invalid-plan-action')
    || !invalidIdentityCodes.has('invalid-execution-action')
    || invalidIdentityCodes.has('plan-matched')) {
    throw new Error('installed CLI did not block missing structured action identities');
  }

  console.log('Verified installed tarball library import, audit output, CLI, and identity diagnostics.');
} finally {
  await rm(consumerDir, { recursive: true, force: true });
}
