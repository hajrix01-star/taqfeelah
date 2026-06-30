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

Production should remain conservative:

- Deploy from `main`.
- Use a CI-built artifact.
- Keep production health and live gate.
- Do not run large load/export benchmarks inside every deploy.

`deploy-production.yml` supports the same `validation_profile` input for manual runs:

- Push-triggered production deploys run full validation.
- Manual `validation_profile=fast` is for retrying deployment after the same commit has already passed full validation.
- Fast production retries still build/package the artifact and still run deploy verification plus production live gate.

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
