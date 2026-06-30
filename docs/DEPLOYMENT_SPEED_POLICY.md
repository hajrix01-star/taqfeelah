# Deployment Speed Policy

This policy keeps deploys fast without weakening the production gate.

## Strategy

Use **direct production deploy by default**:

- Production deploys are fast by default.
- Staging is disabled as a routine automatic gate.
- Deep validation runs only when explicitly requested by the owner/project lead.
- Production deploy workflows must keep runtime checks: migration, service startup, health check, and external live gate.

## Staging

`deploy-staging.yml` is manual-only. It is not triggered by push and is not required for routine production deploys.

Use staging only when explicitly requested for a comprehensive audit or risky release. It supports `validation_profile`:

| Profile | Use case | Runs before build |
| --- | --- | --- |
| `fast` | Manual staging smoke when needed | dependency install + production build + package |
| `full` | Owner-requested comprehensive audit, risky release, or pre-launch deep check | clean-surface + typecheck + unit tests + production build + package |

The fast profile does **not** skip:

- artifact packaging
- server upload
- database migration
- auth/data seed safety checks
- PM2 startup
- `/api/v1/meta` health check
- public staging route check
- HTTPS check
- production endpoint sanity check
- P0 live gate on staging

The staging live gate is repeatable. If the staging tenant has reached its store limit, the gate may reuse or archive a non-primary staging store for the archived-store write-guard check. This is enabled only by the staging workflow through `CHECK_ARCHIVE_EXISTING_STORE_ON_LIMIT=true`.

## Production Rule

Production deploys use a Noorix-style fast path by default:

- Deploy from `main`.
- Build and package the production artifact.
- Deploy to VPS.
- Keep deploy verification and production live gate.
- Do not run large load/export benchmarks inside every deploy.

`deploy-production.yml` validation policy:

- Push-triggered production deploys are fast by default.
- Add `[full-validate]` to the push commit message to run lint, typecheck, unit tests, and browser smoke inside the production deploy workflow.
- Manual `validation_profile=fast` runs the same fast path.
- Manual `validation_profile=full` runs lint, typecheck, unit tests, browser smoke, build, package, deploy, and live gate.
- Fast production deploys still build/package the artifact and still run deploy verification plus production live gate.
- Production live gate runs as an external HTTPS smoke because production DB/session secrets are intentionally not required in GitHub Actions. Deep DB-source checks remain in staging full and the VPS deploy verifier.

## Load And Export Gate

Large checks are release gates, not routine deploy checks:

- 19k operations export.
- 5-year filtered reports.
- API benchmark.
- Large Excel/PDF smoke.

Run them before major launches or schema/report/export changes.

## Decision

Routine deploys go directly to production using the fast path.
Run staging `validation_profile=full` only when the owner/project lead explicitly asks for a comprehensive deep check.
