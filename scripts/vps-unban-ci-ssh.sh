#!/usr/bin/env bash
# Emergency: restore SSH from GitHub Actions after fail2ban blocks CI runners.
# Run as root on the VPS:
#   bash scripts/vps-unban-ci-ssh.sh
set -euo pipefail

echo "=== SSH service ==="
systemctl restart ssh 2>/dev/null || systemctl restart sshd
systemctl is-active ssh 2>/dev/null || systemctl is-active sshd

unban_jail() {
  local jail="$1"
  if ! fail2ban-client status "$jail" >/dev/null 2>&1; then
    echo "Jail $jail not active — skip."
    return 0
  fi
  mapfile -t banned < <(
    fail2ban-client status "$jail" 2>/dev/null |
      sed -n 's/.*Banned IP list:[[:space:]]*//p' |
      tr ',' '\n' |
      sed 's/^[[:space:]]*//;s/[[:space:]]*$//' |
      grep -v '^$' || true
  )
  if [ "${#banned[@]}" -eq 0 ]; then
    echo "No banned IPs in $jail."
    return 0
  fi
  for ip in "${banned[@]}"; do
    echo "Unbanning $ip from $jail"
    fail2ban-client set "$jail" unbanip "$ip" || true
  done
}

echo "=== fail2ban: unban CI / sshd + recidive bans ==="
if command -v fail2ban-client >/dev/null 2>&1; then
  for jail in sshd recidive; do
    unban_jail "$jail"
  done
else
  echo "fail2ban not installed — skip."
fi

echo "=== UFW ==="
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw status | sed -n '1,20p' || true
fi

echo "=== Done ==="
echo "Re-run Production Deploy on GitHub Actions (preflight_wait_minutes=10 if needed)."
