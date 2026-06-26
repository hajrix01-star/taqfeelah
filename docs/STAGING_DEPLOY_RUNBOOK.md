# Staging Deploy Runbook

This runbook is the required deployment path while GitHub Actions is blocked by billing or spending-limit issues.

## Policy

- GitHub remains the source of truth. Push the exact commit before any deploy.
- Staging deploys to `https://staging.taqfeelah.com` only.
- Production deploys are separate and require explicit approval after staging verification.
- Build artifacts must be created after the final commit. Do not build from a dirty worktree and then commit afterward.
- The packaged `.next` release build must match `git rev-parse HEAD`; stale artifacts are deployment blockers.
- Do not create ad-hoc deploy scripts under `.codex-local`.
- Do not switch process managers during a deploy. Current staging runtime is PM2 process `taqfeelah-staging`.
- Every deploy must have a preflight, backup, release metadata check, health check, and production-unchanged check.

## Root Causes From The Phase 4 Deploy

| Problem | Root cause | Permanent rule |
| --- | --- | --- |
| GitHub Actions did not start | Account billing/spending-limit block | Use direct staging deploy until billing is fixed. Do not rerun Actions expecting code changes to help. |
| Direct deploy attempts were slow | Multiple paths were mixed: Actions, SSH snippets, temporary scripts, PM2, and systemd | Use one versioned deploy path and stop on the first failed gate. |
| Windows packaging failed | `scripts/package-production-artifact.mjs` required `rsync` | Packaging must support both `rsync` and Node copy fallback. |
| Arabic release label broke env sourcing | `.env.production` values with spaces were not quoted | Any value with spaces or non-ASCII must be shell-quoted before sourcing. |
| Runtime version showed fallback | `RELEASE_VERSION` was missing from staging env | Release metadata must set version, label, and build explicitly. |
| Browser kept old client behavior | Artifact was built before the final commit, leaving `.next` and service-worker revision on the previous build | Commit first, rebuild with `RELEASE_BUILD=$(git rev-parse HEAD)`, and package only when `.next` metadata matches HEAD. |
| Staging env accumulated duplicate release keys | Direct deploy appended release metadata to an existing `.env.production` | Rewrite release keys or copy a clean env file; never append duplicate `RELEASE_*` keys. |
| SSH key attempts were noisy | Workspace private-key ACLs conflicted with Windows OpenSSH | Use the approved `%USERPROFILE%\.ssh\taqfeelah_phase4_key` path or the Python deploy client, not copied workspace keys. |
| Verification took too long to diagnose | Preflight checks were not centralized | Run the fail-fast checklist before upload and after restart. |

## Required Preflight

Run these before uploading anything:

```powershell
git status --short
git rev-parse HEAD
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test -- --reporter=dot --maxWorkers=2
$head = git rev-parse HEAD
$env:APP_MODE="production"
$env:NEXT_PUBLIC_APP_MODE="production"
$env:RELEASE_VERSION="2.0.0"
$env:NEXT_PUBLIC_RELEASE_VERSION="2.0.0"
$env:RELEASE_LABEL="نسخة مرحلة 4"
$env:NEXT_PUBLIC_RELEASE_LABEL="نسخة مرحلة 4"
$env:RELEASE_BUILD=$head
$env:NEXT_PUBLIC_RELEASE_BUILD=$head
corepack pnpm build
node scripts/package-production-artifact.mjs taqfeelah-staging-artifact.tar.gz
```

Stop if any command fails.

## Required Remote Checks

Before replacing staging:

```bash
pm2 describe taqfeelah-staging >/dev/null
test ! -d /opt/taqfeelah-staging.release
curl -fsS --max-time 10 http://127.0.0.1:3011/api/v1/meta
curl -fsS --max-time 10 https://taqfeelah.com/api/v1/meta
```

Create a backup:

```bash
mkdir -p /root/taqfeelah-backups
cp -a /opt/taqfeelah-staging "/root/taqfeelah-backups/staging-before-$(date +%Y%m%d-%H%M%S)"
```

## Required Deploy Behavior

- Extract artifact into `/opt/taqfeelah-staging.release`.
- Write `.env.production` with explicit `RELEASE_VERSION`, `RELEASE_LABEL`, and `RELEASE_BUILD`.
- Source `.env.production` before migrations and before starting PM2.
- Run migrations once.
- Replace `/opt/taqfeelah-staging` only after install and migrations succeed.
- Restart by deleting and starting `taqfeelah-staging` with the sourced environment.
- Start PM2 with `node_modules/next/dist/bin/next -- start --hostname 127.0.0.1 --port 3011`; do not use `npx` because it can leave an orphaned `next-server` child on port `3011`.
- Keep production process `taqfeelah-app` untouched.

## Required Verification

The deploy is not complete until all checks pass:

```bash
curl -fsS --max-time 20 http://127.0.0.1:3011/api/v1/meta
curl -fsS --max-time 20 https://staging.taqfeelah.com/api/v1/meta
curl -fsS --max-time 20 https://taqfeelah.com/api/v1/meta
pm2 ls
```

Expected staging metadata for Phase 4:

```json
{"version":"2.0.0","label":"نسخة مرحلة 4","build":"<deployed commit sha>"}
```

Production must keep its own build value unless a production deploy was explicitly approved.

## Rollback

If staging health fails after replacement:

```bash
pm2 delete taqfeelah-staging || true
rm -rf /opt/taqfeelah-staging
mv /opt/taqfeelah-staging.previous /opt/taqfeelah-staging
cd /opt/taqfeelah-staging
set -a
. ./.env.production
set +a
NODE_ENV=production pm2 start node_modules/next/dist/bin/next --name taqfeelah-staging -- start --hostname 127.0.0.1 --port 3011
pm2 save
```
