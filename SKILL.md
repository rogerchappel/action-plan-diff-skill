# action-plan-diff-skill

Use this skill when an agent run, connector dry-run, or skill release candidate needs local evidence that the work stayed inside its stated boundaries.

## Inputs
- JSONL transcript where each line is an object with optional `role`, `type`, `tool`, and `content` fields.
- Plain text notes containing plan, action, validation, and result sections.

## Side-effect boundaries
- Read local fixtures only.
- Do not call live external accounts.
- Do not approve, merge, publish, tag, or execute generated action plans.

## Workflow
1. Save the candidate run as a fixture.
2. Run `npx action-plan-diff-skill fixture.jsonl --format markdown`.
3. Treat critical findings as blockers until the transcript or plan is corrected.
4. Include the exact command and result in the release notes.

## Validation
Run `npm test`, `npm run check`, `npm run build`, and `npm run smoke` from the project root.
