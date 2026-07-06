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
npm run release:check
```

Use `npm run package:smoke` or `npm pack --dry-run` when package contents
change. The package allowlist includes the CLI source, fixtures, docs, skill
instructions, README, license, security policy, changelog, and contribution
guide.

## What it checks

- Missing plans or action evidence.
- Validation gaps before handoff.
- Approval and dry-run boundary drift.
- Fixture shape problems that make a review hard to trust.

## CLI

```sh
action-plan-diff-skill <fixture.jsonl|notes.txt> [--format markdown|json] [--output report.md] [--version]
```

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
