# Release checklist

Use this checklist before cutting a public release for action-plan-diff-skill.

## Required checks

- Run `npm run release:check` from a clean checkout.
- Confirm the CI release-readiness job passes on the release PR.
- Review the npm pack dry-run output for unexpected files or missing runtime assets.
- Confirm the package smoke test installs the packed artifact, imports
  `runAudit` by package name, audits its fixture, and exercises the installed CLI.

## Review notes

- Keep fixture updates in the same PR as behavior changes.
- Call out limitations, required inputs, and operator follow-up in the PR body.
- Do not publish until the pack contents and smoke output match the README.
