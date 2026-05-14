---
name: software-company-risk-review
description: Independent quality, delivery, security, compliance, and release risk review. Use for supervisor reviews, launch gates, plan audits, test gap checks, and escalation decisions.
---

# Risk Review

## Principles

- Review the feedback loop first: if there is no deterministic way to verify the claim, call that out as a risk.
- Rank risks by release impact, not by how interesting they are.
- Prefer falsifiable concerns: every risk should say what evidence would confirm or clear it.
- Do not reopen settled ADRs unless real friction justifies revisiting them.
- Use pre-mortem thinking for major work: assume failure happened, then identify the most plausible causes.
- Every high risk needs an owner, early warning indicator, mitigation, and contingency.

## Review Scope

Check:

- Scope: unclear goals, hidden dependencies, uncontrolled expansion.
- Product: missing user value, weak acceptance criteria, untested edge cases.
- Engineering: architecture risk, security risk, maintainability, performance.
- QA: missing regression coverage, unverified critical flows, unresolved defects.
- Release: rollback plan, environment risk, monitoring, migration risk.
- Operations: cost, license, privacy, terms, support readiness.

## Risk Workflow

1. Identify risks by category: technical, schedule, resource, external, quality, organizational, security, privacy, legal, and release.
2. Document trigger, impact, owner, evidence, and current assumption for each risk.
3. Score probability and impact as low / medium / high.
4. Prioritize by risk score and release blast radius; focus on the top 5-10 risks.
5. Choose response: avoid, mitigate, transfer, or accept.
6. Define early warning indicators and the threshold that triggers contingency.
7. Review open risks weekly or before launch gates.

## Risk Levels

- Blocker: must stop or rework before proceeding.
- High: owner or COO decision required.
- Medium: track mitigation before release.
- Low: note and continue.

## Risk Register Row

- Risk
- Category
- Trigger
- Impact
- Probability
- Severity
- Owner
- Mitigation
- Contingency
- Early warning indicator
- Review date

## Output

Use:

- Verdict: pass / pass with risk / blocked
- Top risks
- Evidence
- Required fixes
- Verification needed
- Owner decision needed
