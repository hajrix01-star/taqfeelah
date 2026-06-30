# Deployment Speed Policy

This policy keeps deploys fast without weakening the production gate.

## Strategy

Use **build once, validate once, deploy fast**:

- Full validation belongs in PR/main CI.
- Staging and production deploys should use a tested artifact where possible.
- Deploy workflows must keep runtime checks: migration, service startup, health check, and live gate.

## Staging Profiles

`deploy-staging.yml` supports `validation_profile`:

| Profile | Use case | Runs before build |
| --- | --- | --- |
| `fast` | Normal staging deploy after local/CI validation on the same SHA | dependency install + production build + package |
| `full` | Release candidate, suspicious changes, dependency updates, or first launch gate | clean-surface + typecheck + unit tests + production build + package |

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

## Load And Export Gate

Large checks are release gates, not routine deploy checks:

- 19k operations export.
- 5-year filtered reports.
- API benchmark.
- Large Excel/PDF smoke.

Run them before major launches or schema/report/export changes.

## Decision

Routine staging deploys can use `validation_profile=fast`.
Before production launch, at least one staging run must pass with `validation_profile=full` on the exact production candidate SHA.
