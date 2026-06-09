#!/usr/bin/env bash
# One-time VPS hardening so GitHub Actions can SSH for Production Deploy.
# Run as root on the VPS: bash scripts/vps-harden-github-deploy.sh
set -euo pipefail

echo "=== SSH service ==="
systemctl enable ssh 2>/dev/null || systemctl enable sshd 2>/dev/null || true
systemctl restart ssh 2>/dev/null || systemctl restart sshd
systemctl status ssh 2>/dev/null || systemctl status sshd --no-pager || true

echo "=== UFW (allow OpenSSH) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw status || true
else
  echo "ufw not installed — skip"
fi

echo "=== fail2ban sshd (reduce false bans from CI retries) ==="
if command -v fail2ban-client >/dev/null 2>&1; then
  jail="/etc/fail2ban/jail.d/taqfeelah-github-deploy.local"
  cat >"$jail" <<'EOF'
[sshd]
enabled = true
maxretry = 12
findtime = 15m
bantime = 10m
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
