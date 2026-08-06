# action-plan-diff-skill

Compare dry-run action plans with execution traces and report approval drift.

## Quickstart

```sh
npm test
npm run smoke
node src/cli.js --help
node src/cli.js --version
node src/cli.js fixtures/sample.jsonl --format json
```

Run the full local release gate before opening a release PR:

```sh
npm run release:readiness
npm run release:check
```

`release:readiness` validates package metadata, npm allowlist coverage,
required support docs, CLI bin metadata, and CI presence before the heavier
runtime smoke and pack checks run.

Use `npm run package:smoke` or `npm pack --dry-run` when package contents
change. The package allowlist includes the CLI source, fixtures, docs, skill
instructions, README, license, security policy, changelog, and contribution
guide.

## What it checks

- Missing plans or action evidence.
- Validation gaps before handoff.
- Approval and dry-run boundary drift.
- Fixture shape problems that make a review hard to trust.

Structured records with a string `phase` use that phase as authoritative.
Keyword inference is reserved for unstructured notes, so text such as
`"completed according to plan"` cannot turn execution evidence into a plan.

Structured JSONL execution records (`"phase":"execution"`) must include
`dryRun` as a boolean. When `approved` is present it must also be a boolean,
and live execution (`"dryRun":false`) requires `"approved":true`. A live
execution remains approval drift even when approved, because it left dry-run
mode. Missing or string values such as `"dryRun":"false"` produce blocking
contract findings instead of a `plan-matched` result.

Every structured plan and execution record must also include `action` as a
non-empty string. Matching trims surrounding whitespace and ignores case for
both `action` and `target`; an omitted or blank target means `local`, while
different non-empty targets remain distinct identities. Missing, empty, or
whitespace-only actions produce the blocking `invalid-plan-action` or
`invalid-execution-action` finding and can never produce `plan-matched`.

## Verification

Run the same checks used for release-readiness before publishing or opening a release PR:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run release:check
npm pack --dry-run
```

## CLI

```sh
action-plan-diff-skill <fixture.jsonl|notes.txt> [--format <markdown|json>] [--json] [--output report.md] [--help] [--version]
```

`--json` is shorthand for `--format json`. Each JSONL line must contain an
object; primitives and arrays are rejected with the input line number. A line
whose first non-whitespace character is `{` or `[` is treated as JSON-looking
input and rejected if it is malformed rather than interpreted as plain text.
Unknown options, extra positional arguments, missing option values, and
unsupported formats print a concise error to stderr and exit nonzero.

Plain-text sections are supported for lightweight comparisons, but plain text
cannot encode or prove typed `dryRun` and `approved` state. Use structured
JSONL whenever the report is intended as execution-boundary evidence.

## Library

```js
import { runAudit } from 'action-plan-diff-skill';

const report = runAudit(rawTranscript, { format: 'markdown' });
```

## Safety notes

This package is local-first. It reads fixtures, prints reports, and does not call live connector APIs. Treat critical findings as blockers before approving external actions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, local-first, and
covered by the release gate above.

## Security

See [SECURITY.md](SECURITY.md). Do not include secrets, private logs, or
customer data in public issues or fixtures.

## Limitations

The analyzer is intentionally deterministic and rule-based. It cannot prove intent, authenticate account state, or replace human review for sensitive operations.

## Release notes

Before tagging a release, confirm the smoke fixture still represents the intended workflow and summarize any changed output, limitations, or operator steps in the PR.
