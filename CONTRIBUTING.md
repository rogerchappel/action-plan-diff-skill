# Contributing

Thanks for helping improve `action-plan-diff-skill`.

Keep contributions small, deterministic, and focused on local-first approval
drift analysis.

## Pull Requests

- Use a branch and one reviewable intent per PR.
- Include fixture-backed tests when behavior changes.
- Update README or docs when commands, output, or safety posture changes.
- Avoid secrets, private logs, customer data, or live connector payloads in
  fixtures and examples.

## Verification

Run the release gate before opening or updating a PR:

```sh
npm run release:check
```

For package metadata or allowlist changes, also inspect:

```sh
npm run package:smoke
```
