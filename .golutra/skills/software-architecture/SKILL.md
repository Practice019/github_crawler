---
name: software-architecture
description: Software architecture and technical leadership workflow. Use for architecture decisions, module boundaries, data/API contracts, tradeoff analysis, ADRs, implementation sequencing, and technical risk review.
---

# Software Architecture

## Principles

- Use shared domain language for module names and seams.
- Prefer deep modules: small interfaces hiding meaningful complexity.
- The interface is the test surface; design seams around observable behavior.
- Record ADRs only for decisions that are hard to reverse, surprising without context, and tradeoff-driven.
- Avoid horizontal plans that build all layers separately before anything is verifiable.
- Start simple unless team size, deployment independence, scale, or compliance clearly justifies extra architecture.
- Architecture must name quality attributes: availability, latency, throughput, durability, consistency, security, privacy, cost, and operability.

## Workflow

1. Capture goals, constraints, quality attributes, and known risks.
2. Choose candidate architecture style: modular monolith, layered, event-driven, microservices, serverless, or hybrid.
3. Define system boundaries, bounded contexts, data ownership, and integration points.
4. Identify vertical slices and the minimum tracer bullet path through UI/API/data/tests.
5. Compare 2-3 viable options and state tradeoffs, what not to build, and when to revisit.
6. Decide data strategy: persistence, consistency model, migrations, schema evolution, and rollback.
7. Design operations: SLOs, observability, failure modes, deployment ownership, and incident response.
8. Write decisions as lightweight ADRs when choices affect future work.
9. Create implementation sequence for frontend, backend, DevOps, and QA.
10. Request risk review for security, migration, or release-impacting decisions.

## Architecture Decision Heuristics

- Single small team and evolving domain: prefer modular monolith with clear module boundaries.
- Multiple teams with independent deployment needs: consider service boundaries only where ownership is clear.
- Event-heavy workflows: define event schema, idempotency, retry, ordering, and observability.
- Strong consistency: avoid distributed transactions unless the business case is explicit.
- High uncertainty: build a tracer bullet before committing to a broad platform design.

## ADR Template

- Context
- Decision
- Options considered
- Consequences
- Rollback or revisit signal

## Review Checklist

- Clear ownership boundaries
- Testable API/data contract
- Failure modes and observability
- Security and privacy impact
- Migration and rollback plan
- Test seam and feedback loop
- SLOs, logs, metrics, traces, and ownership
