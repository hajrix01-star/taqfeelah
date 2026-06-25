# Direct Production Deploy Log

## 2026-06-25

GitHub Actions was unavailable because GitHub reported an account billing/spending-limit block before jobs started. Production was deployed directly from the local machine to the VPS while keeping GitHub as the source of truth.

### Source

- Branch: `main`
- Commit: `80b8728266bbda3f5fd1525aed95064e3b13c1e1`
- Commit was already pushed to GitHub before deployment.

### Local Gate

- `corepack pnpm lint`: passed
- `corepack pnpm typecheck`: passed
- `corepack pnpm test`: passed, 326 test files / 1204 tests
- `corepack pnpm build`: passed

### Deployment

- Artifact: `taqfeelah-production-artifact.tar.gz`
- VPS app path: `/opt/taqfeelah`
- Backup path pattern: `/root/taqfeelah-backups/direct-YYYYMMDD-HHMMSS`
- PM2 process: `taqfeelah-app`
- Deployment mode: local prebuilt artifact, no remote Next build

### Verification

- `https://taqfeelah.com/api/v1/meta`: build `80b8728266bbda3f5fd1525aed95064e3b13c1e1`
- `https://taqfeelah.com/`: HTTP `200`
- `https://www.taqfeelah.com/`: HTTP `200`
- `https://taqfeelah.com/api/v1/auth/session`: `{"authenticated":false}`
- Unauthenticated `GET /api/v1/stores?status=active`: HTTP `400`, expected in production because a session cookie is required.

### Notes

- GitHub remains the code source of truth. Direct deploy is only the execution path while GitHub Actions is blocked.
- The deployment preserved the existing production `.env.production` and only rewrote launch flags and release build values.
- Attachment diagnostics reported two historical missing local files; this predates the direct deploy and should be reviewed separately if those records matter.
