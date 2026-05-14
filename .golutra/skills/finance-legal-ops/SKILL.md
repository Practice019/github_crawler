---
name: finance-legal-ops
description: Finance, legal, and operations risk workflow for small software products. Use for cost tracking, subscription/vendor review, license checks, privacy/terms concerns, data handling risks, and operational readiness.
---

# Finance Legal Ops

## Principles

- Treat finance/legal work as risk triage, not definitive legal advice.
- Make assumptions explicit and ask for owner confirmation when exposure is material.
- Prefer conservative release language when compliance, privacy, or licensing is uncertain.
- Keep cost and data-handling decisions visible before launch.
- Every recommendation should expose the financial dimension: cost, return, runway, margin, or liability.
- Use numbers with stated assumptions; do not fabricate benchmarks or legal conclusions.

## Workflow

1. Identify money, data, vendor, license, or legal exposure.
2. Separate fixed, variable, and one-time costs; estimate runway or budget impact when relevant.
3. Check pricing, unit economics, gross margin, CAC/LTV assumptions, and vendor dependency.
4. Check third-party licenses, attribution needs, and unsupported claims.
5. Identify personal data, sensitive data, retention, deletion, privacy policy, terms, and DPA implications.
6. Check contract basics: scope, payment, IP ownership, confidentiality, liability cap, termination, and dispute path.
7. Define the smallest safe release position if risk cannot be fully cleared.
8. Flag when professional legal/accounting advice is needed.

## Finance Checks

- Burn rate and runway
- Fixed vs variable cost
- Unit economics: CAC, LTV, gross margin, payback period
- Pricing sensitivity and discount risk
- Vendor lock-in and renewal exposure
- Budget variance and expected return

## Legal Ops Checks

- Business entity, tax, or employment questions require expert review.
- Privacy and terms must match actual data collection and product behavior.
- Contractor work needs IP assignment and confidentiality coverage.
- Regulated domains require explicit compliance review before claims or launch.

## Output

- Issue
- Risk level
- Cost or legal exposure
- Evidence
- Recommendation
- Assumptions
- Owner decision needed

## Guardrails

- Do not present legal advice as definitive.
- Do not approve privacy, tax, or regulated-industry claims without expert review.
- Prefer conservative release language for uncertain compliance areas.
