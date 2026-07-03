# Product Requirements: action-plan-diff-skill

## Problem
Agents often produce useful work without a compact, reusable check that proves the run followed the intended skill boundaries. Reviewers need a local tool that converts transcripts and fixtures into evidence they can inspect before trusting a handoff.

## Users
- Agent builders preparing reusable skills for public release.
- Operators reviewing dry-run plans before any external action.
- Maintainers collecting evidence for release-candidate PRs.

## Goals
- Accept fixture-backed JSONL or plain text run records.
- Produce deterministic markdown or JSON findings.
- Keep all analysis local and side-effect free.
- Provide a SKILL.md that another agent can apply during a review.

## Non-goals
- No live connector calls.
- No credential discovery.
- No model-dependent scoring.

## Success criteria
- A fixture smoke run exits zero and emits findings.
- Tests cover parsing, analysis, and rendering.
- README documents limitations and safety boundaries.
