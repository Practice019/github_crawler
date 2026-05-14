---
name: software-product-management
description: Product management for software work. Use when writing PRDs, user stories, acceptance criteria, MVP scope, prioritization, requirements clarification, and product handoff to design or engineering.
---

# Software Product Management

## Principles

- Start with alignment, not a feature list.
- Use shared domain terms consistently; if a term is fuzzy, propose one canonical meaning.
- PRDs describe user-facing behavior and decisions, not brittle file paths or implementation trivia.
- Prefer thin vertical slices that can be independently demoed and tested.
- Outcomes beat output: each roadmap item is a bet with a measurable result and guardrails.
- Evidence quality matters: label signals as strong, medium, or weak and state what would change the decision.
- Every initiative needs kill criteria before delivery starts.

## Workflow

1. Identify user, problem, context, and measurable outcome.
2. Define MVP scope and explicitly list non-goals.
3. Ask clarifying questions one at a time when requirements, vocabulary, or scope are ambiguous.
4. Write user stories with acceptance criteria.
5. Define success metric with formula, timeframe, data source, and guardrail metric.
6. Separate functional, non-functional, analytics, privacy, accessibility, and operational requirements.
7. Mark unknowns and decisions needed from owner or COO.
8. Break the PRD into vertical slices: each slice should deliver a narrow end-to-end behavior.
9. Add kill criteria: usage threshold, time ceiling, cost ceiling, or metric guardrail.
10. Hand off to UX and architecture with stable acceptance criteria.

## Product Decision Flow

- Discovery: user problem, segment, current workaround, evidence quality.
- Strategy: desired outcome, non-goals, positioning, competing alternatives.
- Prioritization: RICE / ICE / cost-of-delay; use one scoring method consistently.
- Roadmap: now / next / later by outcome, not by feature inventory.
- Measurement: activation, retention, revenue, support load, and guardrails.
- Stop rule: conditions for pausing, killing, or descope.

## PRD Shape

- Problem
- Target users
- Goals and non-goals
- User stories
- Functional requirements
- Non-functional requirements
- Edge cases
- Acceptance criteria
- Vertical slices
- Metrics: formula, timeframe, data source, baseline, target
- Kill criteria
- Open questions

## Quality Bar

- Every requirement must be testable.
- Every slice must be demoable or independently verifiable.
- Avoid feature lists without user value.
- Do not assume technical feasibility; request architecture review for risky items.
