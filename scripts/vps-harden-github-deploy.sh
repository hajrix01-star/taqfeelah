#!/usr/bin/env bash
# One-time VPS hardening so GitHub Actions can SSH for Production Deploy.
# Run as root on the VPS: bash scripts/vps-harden-github-deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
bash "$SCRIPT_DIR/vps-unban-ci-ssh.sh"

echo "=== fail2ban sshd (tolerate CI retries) ==="
if command -v fail2ban-client >/dev/null 2>&1; then
  jail="/etc/fail2ban/jail.d/taqfeelah-github-deploy.local"
  cat >"$jail" <<'EOF'
[sshd]
enabled = true
maxretry = 20
findtime = 30m
bantime = 5m
EOF
  systemctl restart fail2ban || true
  fail2ban-client status sshd || true
  echo "Wrote $jail"
else
  echo "fail2ban not installed — skip"
fi

echo "=== Done ==="
echo "Re-run Production Deploy on GitHub Actions."
echo "Optional: add VPS_SSH_PRIVATE_KEY secret and disable password auth later."
