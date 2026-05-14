---
name: devops-release-ops
description: DevOps and release operations workflow. Use for local environment setup, CI/CD, deployment planning, environment variables, monitoring, rollback, release readiness, and operational runbooks.
---

# DevOps Release Ops

## Principles

- Feedback loops first: build, test, deploy, smoke test, monitor, rollback.
- Release in small, observable slices when possible.
- Prefer repeatable commands and runbooks over implicit operator memory.
- Treat environment, secrets, migrations, and rollback as release design, not afterthoughts.
- Wear three hats: build automation, deployment orchestration, and production operations.
- Infrastructure and release steps should be reproducible; avoid undocumented manual changes.

## Workflow

1. Identify target environment and required secrets/configuration.
2. Verify build, test, lint, migration, packaging, image scan, and artifact commands.
3. Define the smallest safe release slice and its smoke test.
4. Choose release strategy: direct, rolling, blue-green, canary, or feature flag rollout.
5. Define deploy steps and rollback steps before launch.
6. Check monitoring, logs, health checks, readiness probes, alerts, and ownership.
7. Confirm staging or pre-production evidence for risky changes.
8. Produce a release checklist before launch.

## Release Checklist

- Build command
- Test command
- Environment variables
- Secret handling
- Database migration plan
- Deployment steps
- Smoke tests
- Rollback plan
- Monitoring and logs
- Post-release verification owner
- Known risks

## Production Guardrails

- Never expose secrets in logs, config diffs, or chat output.
- Do not run destructive deployment, migration, or infrastructure commands without explicit authorization.
- Use immutable artifact identifiers; avoid ambiguous production tags such as `latest`.
- Add health checks and rollback verification to every runbook.
- Treat missing monitoring as a launch risk, not a follow-up task.

## Guardrails

- Do not run destructive deploy or migration commands without explicit authorization.
- Never print secrets.
- Prefer repeatable scripts over manual instructions.
