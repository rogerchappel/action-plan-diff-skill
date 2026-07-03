# Orchestration

1. Collect an exported transcript or action fixture.
2. Run `npm run smoke` or invoke `action-plan-diff-skill <file>` directly.
3. Review findings before making external changes.
4. Attach the report to a release-candidate PR or handoff note.

The tool never writes outside stdout unless `--output` is provided. It does not call browsers, APIs, connector tools, or package registries.
