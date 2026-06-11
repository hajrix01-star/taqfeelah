#!/usr/bin/env bash
# Diagnose why GitHub Actions cannot reach this VPS (SSH / HTTPS).
# Run as root on the VPS: bash scripts/vps-diagnose-ci-access.sh
set -euo pipefail

echo "========== Host =========="
hostname -f 2>/dev/null || hostname
echo "Public IP: $(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || echo 'unknown')"

echo ""
echo "========== SSH service =========="
systemctl is-active ssh 2>/dev/null || systemctl is-active sshd 2>/dev/null || echo "ssh not active"
ss -tlnp | grep -E ':22\b' || echo "Nothing listening on port 22"
grep -E '^(Port|ListenAddress|PasswordAuthentication)' /etc/ssh/sshd_config 2>/dev/null | grep -v '^#' || true

echo ""
echo "========== Firewall (local) =========="
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose || true
else
  echo "ufw: not installed"
fi
echo "--- iptables INPUT (first 30 lines) ---"
iptables -L INPUT -n --line-numbers 2>/dev/null | sed -n '1,30p' || echo "iptables: unavailable"

echo ""
echo "========== fail2ban =========="
if command -v fail2ban-client >/dev/null 2>&1; then
  fail2ban-client status sshd 2>/dev/null || echo "sshd jail: not active"
else
  echo "fail2ban-client: NOT INSTALLED (CI block is not from fail2ban on this host)"
fi

echo ""
echo "========== Local app / nginx =========="
systemctl is-active nginx 2>/dev/null || echo "nginx: not active"
curl -sS -o /dev/null -w "localhost HTTP %{http_code}\n" --max-time 5 http://127.0.0.1/ 2>/dev/null || echo "localhost HTTP: failed"

echo ""
echo "========== Likely causes if GitHub Actions times out =========="
echo "1. Hostinger hPanel → VPS Firewall: allow TCP 22 and 443 from anywhere (or disable test firewall)"
echo "2. SSH not listening on 0.0.0.0:22 — check ListenAddress in /etc/ssh/sshd_config"
echo "3. GitHub secret VPS_HOST must match public IP above (not 127.0.0.1 / internal hostname)"
echo "4. Provider-level anti-abuse blocking GitHub runner IP ranges — open ticket with Hostinger"
