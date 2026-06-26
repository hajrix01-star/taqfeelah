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
| Owner settings showed zero stores | The manual artifact was built without required `NEXT_PUBLIC_*` staging flags, so the browser bundle did not enable org-config hydration | Staging builds must set the complete public feature-flag set before `pnpm build`, and the deployed UI must prove `محلات 2` after owner login. |
| Staging served stale static chunks | A `next-server` orphan kept port `3011` from `/opt/taqfeelah-staging.previous` after PM2 went `errored` | Kill any process holding `3011`, start PM2 only from `/opt/taqfeelah-staging`, and verify process cwd before accepting a deploy. |
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
$env:NEXT_PUBLIC_CLOSEOUTS_API_ENABLED="true"
$env:NEXT_PUBLIC_ENTRIES_API_ENABLED="true"
$env:NEXT_PUBLIC_ORG_CONFIG_API_ENABLED="true"
$env:NEXT_PUBLIC_PHASE9_API_ENABLED="true"
$env:NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED="true"
$env:NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE="true"
$env:NEXT_PUBLIC_AUTH_API_ENABLED="true"
$env:NEXT_PUBLIC_SAAS_ADMIN_ENABLED="false"
$env:NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED="false"
$env:NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID="8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1"
$env:NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID="e8f3e35b-6051-4da3-8b10-979700c2f00f"
$env:NEXT_PUBLIC_SUPPORT_WHATSAPP="966533507223"
$env:RELEASE_VERSION="2.0.0"
$env:NEXT_PUBLIC_RELEASE_VERSION="2.0.0"
$env:RELEASE_LABEL="نسخة مرحلة 4"
$env:NEXT_PUBLIC_RELEASE_LABEL="نسخة مرحلة 4"
$env:RELEASE_BUILD=$head
$env:NEXT_PUBLIC_RELEASE_BUILD=$head
corepack pnpm build
rg -n "NEXT_PUBLIC_ORG_CONFIG_API_ENABLED" .next/static .next/server
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
ss -ltnp 'sport = :3011'
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
- Restart by deleting `taqfeelah-staging`, killing any remaining process holding port `3011`, and starting `taqfeelah-staging` with the sourced environment.
- Start PM2 with `NODE_ENV=production pm2 start npm --name taqfeelah-staging -- start -- --hostname 127.0.0.1 --port 3011`; do not use `npx`, and do not accept a PM2 `errored` process with an orphaned `next-server` still serving the port.
- Keep production process `taqfeelah-app` untouched.

## Required Verification

The deploy is not complete until all checks pass:

```bash
curl -fsS --max-time 20 http://127.0.0.1:3011/api/v1/meta
curl -fsS --max-time 20 https://staging.taqfeelah.com/api/v1/meta
curl -fsS --max-time 20 https://taqfeelah.com/api/v1/meta
pm2 describe taqfeelah-staging --no-color | grep -E 'status|restarts|uptime|script path|script args|exec cwd|unstable restarts'
ss -ltnp 'sport = :3011'
curl -fsS -I --max-time 20 https://staging.taqfeelah.com/_next/static/chunks/app/page-*.js
```

Expected staging metadata for Phase 4:

```json
{"version":"2.0.0","label":"نسخة مرحلة 4","build":"<deployed commit sha>"}
```

Production must keep its own build value unless a production deploy was explicitly approved.

## Required UI Gate

The deploy is not complete until a clean browser session proves the owner UI hydrates from the server:

- Log in to staging as owner phone `500000001`.
- Confirm `/api/v1/auth/session` returns `authenticated: true`.
- Confirm `/api/v1/org-config/stores-channels-bundle?storeStatus=all&channelStatus=all` returns `35` stores and `2` active stores.
- Open owner settings and confirm the UI shows `محلات 2`.
- Confirm the active stores include `س` and `مشويات المعلم الشامي`.
- Confirm there are no static chunk MIME errors, no `_next/static` 404s, and no PM2 `errored` process.

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
NODE_ENV=production pm2 start npm --name taqfeelah-staging -- start -- --hostname 127.0.0.1 --port 3011
pm2 save
```
