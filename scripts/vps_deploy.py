#!/usr/bin/env python3
"""
Safe deployment helper for Taqfeelah on Hostinger VPS.

Usage examples:
  python scripts/vps_deploy.py audit
  python scripts/vps_deploy.py deploy --domain taqfeelah.com --www-domain www.taqfeelah.com
  python scripts/vps_deploy.py verify --domain taqfeelah.com --www-domain www.taqfeelah.com
  python scripts/vps_deploy.py preflight --domain taqfeelah.com --www-domain www.taqfeelah.com

Environment variables:
  VPS_HOST, VPS_USER, VPS_PASS (or VPS_SSH_PRIVATE_KEY)
  VPS_PORT (optional, default: 22)
  VPS_CONNECT_TIMEOUT (optional seconds, default: 20)
  VPS_TCP_PROBE_TIMEOUT (optional seconds, default: 10)
  VPS_CONNECT_RETRIES (optional, default: 2)
  VPS_RETRY_DELAY_SECONDS (optional seconds, default: 8)
  VPS_PROBE_RETRIES (optional, default: 2)
  VPS_PROBE_RETRY_DELAY_SECONDS (optional seconds, default: 12)
  VPS_PREFLIGHT_WAIT_SECONDS (optional seconds, default: 0)
  VPS_SSH_COMMAND_TIMEOUT (optional seconds, default: 0 = no limit)
  VPS_SKIP_REMOTE_BUILD (optional, default: false — skip pnpm build when CI artifact includes .next)
  VPS_RUN_REMOTE_REPAIR_SCRIPTS (optional, default: false — skip legacy seed/repair on routine deploy)
  POST_DEPLOY_BASELINE_VERIFY (optional, default: true on verify)
"""

from __future__ import annotations

import argparse
import base64
import errno
import io
import json
import os
import shlex
import socket
import sys
import tarfile
import tempfile
import textwrap
import time
from pathlib import Path
from typing import Iterable

import paramiko

PRODUCTION_ENV_KEYS = [
    "DEPLOYMENT_WAVE",
    "APP_MODE",
    "NEXT_PUBLIC_APP_MODE",
    "NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE",
    "ALLOW_HEADER_AUTH_CONTEXT",
    "RELEASE_VERSION",
    "RELEASE_LABEL",
    "RELEASE_BUILD",
    "NEXT_PUBLIC_RELEASE_VERSION",
    "NEXT_PUBLIC_RELEASE_LABEL",
    "NEXT_PUBLIC_RELEASE_BUILD",
    "DATABASE_URL",
    "AUTH_SESSION_SECRET",
    "AUTH_SESSION_COOKIE_NAME",
    "AUTH_ORGANIZATION_ID",
    "AUTH_OWNER_USER_ID",
    "AUTH_OWNER_USERNAME",
    "AUTH_OWNER_PASSWORD",
    "AUTH_EMPLOYEE_PIN_MAP",
    "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED",
    "NEXT_PUBLIC_ENTRIES_API_ENABLED",
    "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID",
    "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID",
    "NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP",
    "NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP",
    "NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP",
    "NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED",
    "NEXT_PUBLIC_ORG_CONFIG_API_ENABLED",
    "NEXT_PUBLIC_PHASE9_API_ENABLED",
    "NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE",
    "AUTH_DB_CREDENTIALS_ENABLED",
    "NEXT_PUBLIC_AUTH_API_ENABLED",
    "SAAS_ADMIN_API_ENABLED",
    "NEXT_PUBLIC_SAAS_ADMIN_ENABLED",
    "USAGE_TRACKING_ENABLED",
    "SAAS_PLATFORM_ADMIN_USER_IDS",
    "APP_PUBLIC_ORIGIN",
    "ATTACHMENT_STORAGE_MODE",
    "ATTACHMENT_STORAGE_ROOT",
    "NEXT_PUBLIC_SUPPORT_WHATSAPP",
]

# Written to .env.production when present on VPS (or via CI secrets). Not in wave defaults.
PRESERVED_REMOTE_ENV_KEYS = (
    "AUTH_PASSWORD_RESET_ENABLED",
    "AUTH_EMAIL_FROM",
    "RESEND_API_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
)

# Opt-in flags: wave defaults must not overwrite explicit CI or VPS values once enabled.
SAAS_OPT_IN_ENV_KEYS = (
    "SAAS_ADMIN_API_ENABLED",
    "NEXT_PUBLIC_SAAS_ADMIN_ENABLED",
    "USAGE_TRACKING_ENABLED",
    "SAAS_PLATFORM_ADMIN_USER_IDS",
)

VERIFY_COOKIE_JAR = "/tmp/taqfeelah-deploy-verify-cookies.txt"

# Bootstrap defaults align with scripts/seed-closeouts-foundation.mjs so deploy can
# proceed without GitHub app-env secrets. DATABASE_URL must still come from secrets
# or an existing VPS .env.production file.
WAVE_1_ENV_OVERRIDES: dict[str, str] = {
    "DEPLOYMENT_WAVE": "1",
    "APP_MODE": "production",
    "NEXT_PUBLIC_APP_MODE": "production",
    "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED": "true",
    "NEXT_PUBLIC_ENTRIES_API_ENABLED": "true",
    "ALLOW_HEADER_AUTH_CONTEXT": "true",
    "NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE": "true",
}

# Wave 2 enables SQL-backed home + reports (phases 4–6). Same API flags as wave 1;
# DEPLOYMENT_WAVE bumps verify coverage for summary/reports endpoints.
WAVE_2_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_1_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "2",
}

# Wave 3 enables explicit cursor pagination for the owner register (phase 7).
WAVE_3_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_2_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "3",
    "NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED": "true",
}

# Wave 4 enables explicit org-config APIs for stores, team, and sales channels (phase 8).
WAVE_4_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_3_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "4",
    "NEXT_PUBLIC_ORG_CONFIG_API_ENABLED": "true",
}

# Wave 5 enables Phase 9 APIs (notebook export, inline attachments, duplicate summary).
WAVE_5_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_4_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "5",
    "NEXT_PUBLIC_PHASE9_API_ENABLED": "true",
    "NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE": "true",
    "ATTACHMENT_STORAGE_MODE": "local",
    "ATTACHMENT_STORAGE_ROOT": "/var/lib/taqfeelah/attachments",
}

# Wave 6 enables real auth (Phase 10). Requires auth_identities seed before deploy.
WAVE_6_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_5_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "6",
    "NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE": "false",
    "ALLOW_HEADER_AUTH_CONTEXT": "false",
    "AUTH_DB_CREDENTIALS_ENABLED": "true",
    "NEXT_PUBLIC_AUTH_API_ENABLED": "true",
}

# Wave 7 scaffolds SaaS admin (Phase 11). SaaS flags are opt-in via CI secrets or VPS env.
WAVE_7_ENV_OVERRIDES: dict[str, str] = {
    **WAVE_6_ENV_OVERRIDES,
    "DEPLOYMENT_WAVE": "7",
}

WAVE_ENV_OVERRIDES: dict[str, dict[str, str]] = {
    "1": WAVE_1_ENV_OVERRIDES,
    "2": WAVE_2_ENV_OVERRIDES,
    "3": WAVE_3_ENV_OVERRIDES,
    "4": WAVE_4_ENV_OVERRIDES,
    "5": WAVE_5_ENV_OVERRIDES,
    "6": WAVE_6_ENV_OVERRIDES,
    "7": WAVE_7_ENV_OVERRIDES,
}

PRODUCTION_ENV_BOOTSTRAP_DEFAULTS: dict[str, str] = {
    "DEPLOYMENT_WAVE": "7",
    "APP_MODE": "production",
    "APP_PUBLIC_ORIGIN": "https://taqfeelah.com",
    "NEXT_PUBLIC_APP_MODE": "production",
    "NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE": "false",
    "ALLOW_HEADER_AUTH_CONTEXT": "false",
    "AUTH_SESSION_COOKIE_NAME": "taqfeelah_session",
    "AUTH_ORGANIZATION_ID": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
    "AUTH_OWNER_USER_ID": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED": "true",
    "NEXT_PUBLIC_ENTRIES_API_ENABLED": "true",
    "NEXT_PUBLIC_ORG_CONFIG_API_ENABLED": "true",
    "NEXT_PUBLIC_PHASE9_API_ENABLED": "true",
    "NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED": "true",
    "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
    "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    "AUTH_DB_CREDENTIALS_ENABLED": "true",
    "NEXT_PUBLIC_AUTH_API_ENABLED": "true",
    "NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE": "true",
    "SAAS_ADMIN_API_ENABLED": "false",
    "NEXT_PUBLIC_SAAS_ADMIN_ENABLED": "false",
    "USAGE_TRACKING_ENABLED": "false",
}

VPS_POSTGRES_CONTAINER = "taqfeelah-postgres"
VPS_POSTGRES_USER = "taqfeelah"
VPS_POSTGRES_PASSWORD = "taqfeelah_prod_local_v1"
VPS_POSTGRES_DB = "taqfeelah"
VPS_POSTGRES_PORT = 5433
TAQFEELAH_APP_DIR = "/opt/taqfeelah"
TAQFEELAH_APP_PORT = 3010
BOOTSTRAP_SESSION_SECRET = "taqfeelah-prod-bootstrap-session-secret-v1"


def validate_production_auth_secrets(
    merged_env: dict[str, str],
    existing_remote_env: dict[str, str] | None = None,
) -> None:
    if not deployment_wave_requires_auth_verify():
        return
    secret = merged_env.get("AUTH_SESSION_SECRET", "").strip()
    if len(secret) < 16:
        source = (
            "GitHub Actions secret AUTH_SESSION_SECRET"
            if os.environ.get("AUTH_SESSION_SECRET")
            else "VPS .env.production or GitHub Actions secret AUTH_SESSION_SECRET"
        )
        raise RuntimeError(
            "AUTH_SESSION_SECRET must be at least 16 characters for production deploy. "
            f"Set a strong value in {source}."
        )
    if secret == BOOTSTRAP_SESSION_SECRET:
        existing_secret = (existing_remote_env or {}).get("AUTH_SESSION_SECRET", "").strip()
        if existing_secret == BOOTSTRAP_SESSION_SECRET:
            safe_print(
                "WARNING: AUTH_SESSION_SECRET still uses the legacy bootstrap value already on VPS. "
                "Deploy continues for production continuity. Rotate to a strong unique secret in "
                "GitHub Actions when ready (existing sessions will require re-login after rotation)."
            )
            return
        if os.environ.get("AUTH_SESSION_SECRET"):
            source = "GitHub Actions secret AUTH_SESSION_SECRET"
        elif existing_remote_env and existing_remote_env.get("AUTH_SESSION_SECRET"):
            source = "VPS .env.production"
        else:
            source = "deploy bootstrap defaults"
        raise RuntimeError(
            "AUTH_SESSION_SECRET must not use the bootstrap default "
            f"({BOOTSTRAP_SESSION_SECRET!r}). "
            f"Detected source: {source}. "
            "Set a strong unique secret in GitHub Actions secrets."
        )


def safe_print(value: str) -> None:
    # Keep script resilient on Windows shells with legacy codepages.
    try:
        print(value)
    except UnicodeEncodeError:
        sys.stdout.buffer.write((value + "\n").encode("utf-8", errors="replace"))
        sys.stdout.flush()


FAIL_FAST_CONNECT_REASONS = frozenset({"permission denied"})


def classify_connect_error(exc: BaseException) -> str:
    """Map socket/paramiko errors to a short failure reason for logs."""
    if isinstance(exc, paramiko.AuthenticationException):
        return "permission denied"
    if isinstance(exc, (socket.timeout, TimeoutError)):
        return "timeout"
    if isinstance(exc, OSError):
        os_errno = getattr(exc, "errno", None)
        if os_errno in {errno.ETIMEDOUT}:
            return "timeout"
        if os_errno in {errno.ECONNREFUSED}:
            return "connection refused"
        if os_errno in {errno.EHOSTUNREACH, errno.ENETUNREACH}:
            return "host unreachable"
    message = str(exc).lower()
    if "timed out" in message or "timeout" in message:
        return "timeout"
    if "connection refused" in message:
        return "connection refused"
    if "permission denied" in message or "authentication failed" in message:
        return "permission denied"
    if (
        "no route to host" in message
        or "host unreachable" in message
        or "network is unreachable" in message
    ):
        return "host unreachable"
    return "unknown"


def resolve_tcp_endpoints(host: str, port: int) -> list[tuple[socket.AddressFamily, tuple, str]]:
    endpoints: list[tuple[socket.AddressFamily, tuple, str]] = []
    seen: set[tuple[socket.AddressFamily, str, int]] = set()
    for family, _, _, _, sockaddr in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM):
        ip = sockaddr[0]
        key = (family, ip, port)
        if key in seen:
            continue
        seen.add(key)
        endpoints.append((family, sockaddr, ip))
    if not endpoints:
        raise RuntimeError(f"No SSH endpoints resolved for {host}:{port}")
    return endpoints


def pick_primary_endpoint(
    endpoints: list[tuple[socket.AddressFamily, tuple, str]],
) -> tuple[socket.AddressFamily, tuple, str]:
    for endpoint in endpoints:
        if endpoint[0] == socket.AF_INET:
            return endpoint
    return endpoints[0]


class VPS:
    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        *,
        port: int = 22,
        pkey: paramiko.PKey | None = None,
        connect_timeout: float = 20,
        connect_retries: int = 2,
        retry_delay_seconds: float = 8,
        command_timeout: float = 0,
    ) -> None:
        self.host = host
        self.user = user
        self.password = password
        self.pkey = pkey
        self.port = port
        self.connect_timeout = connect_timeout
        self.connect_retries = max(1, connect_retries)
        self.retry_delay_seconds = max(0.0, retry_delay_seconds)
        self.command_timeout = max(0.0, command_timeout)
        self.client: paramiko.SSHClient | None = None

    def _new_client(self) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        return client

    def _resolved_endpoints(self) -> list[tuple[socket.AddressFamily, tuple, str]]:
        return resolve_tcp_endpoints(self.host, self.port)

    def _connect_ssh_once(
        self,
        family: socket.AddressFamily,
        sockaddr: tuple,
        ip: str,
        *,
        attempt: int,
    ) -> tuple[paramiko.SSHClient | None, str]:
        sock: socket.socket | None = None
        client = self._new_client()
        safe_print(
            f"SSH connect attempt {attempt}/{self.connect_retries} "
            f"→ {ip}:{self.port} (timeout {self.connect_timeout:.0f}s)"
        )
        try:
            sock = socket.socket(family, socket.SOCK_STREAM)
            sock.settimeout(self.connect_timeout)
            sock.connect(sockaddr)
            connect_kwargs: dict = {
                "hostname": self.host,
                "port": self.port,
                "username": self.user,
                "sock": sock,
                "timeout": self.connect_timeout,
                "banner_timeout": self.connect_timeout,
                "auth_timeout": self.connect_timeout,
                "look_for_keys": False,
                "allow_agent": False,
            }
            if self.pkey is not None:
                connect_kwargs["pkey"] = self.pkey
                if self.password:
                    connect_kwargs["password"] = self.password
            else:
                connect_kwargs["password"] = self.password
            client.connect(**connect_kwargs)
            return client, "connected"
        except Exception as exc:
            reason = classify_connect_error(exc)
            safe_print(f"SSH {ip}:{self.port} — {reason}")
            try:
                client.close()
            except Exception:
                pass
            try:
                if sock is not None:
                    sock.close()
            except Exception:
                pass
            return None, reason

    def __enter__(self) -> "VPS":
        endpoints = self._resolved_endpoints()
        family, sockaddr, ip = pick_primary_endpoint(endpoints)
        unique_ips = ", ".join(endpoint_ip for _, _, endpoint_ip in endpoints)
        errors: list[str] = []
        for attempt in range(1, self.connect_retries + 1):
            client, reason = self._connect_ssh_once(
                family,
                sockaddr,
                ip,
                attempt=attempt,
            )
            if client is not None:
                self.client = client
                return self
            errors.append(f"attempt {attempt}/{self.connect_retries}, {ip}:{self.port}: {reason}")
            if reason in FAIL_FAST_CONNECT_REASONS:
                safe_print(f"SSH probe stopping early: {reason} (retries will not help)")
                break
            if attempt < self.connect_retries and self.retry_delay_seconds > 0:
                safe_print(
                    f"SSH retry backoff {self.retry_delay_seconds:.0f}s before next attempt…"
                )
                time.sleep(self.retry_delay_seconds)

        details = "\n".join(errors)
        raise RuntimeError(
            "Unable to establish SSH connection to "
            f"{self.host}:{self.port} after {len(errors)} SSH attempt(s).\n"
            f"Resolved endpoints: {unique_ips}\n"
            "Common causes: fail2ban ban, blocked port 22, incorrect VPS_HOST, or firewall rules.\n"
            f"Failures:\n{details}"
        )

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None

    def run(self, command: str, check: bool = True) -> tuple[int, str, str]:
        if self.client is None:
            raise RuntimeError("VPS SSH client is not connected")
        stdin, stdout, stderr = self.client.exec_command(command, get_pty=True)
        channel = stdout.channel
        out_chunks: list[str] = []
        err_chunks: list[str] = []
        deadline = (
            time.monotonic() + self.command_timeout if self.command_timeout > 0 else None
        )

        while True:
            if channel.recv_ready():
                out_chunks.append(channel.recv(65535).decode("utf-8", errors="ignore"))
            if channel.recv_stderr_ready():
                err_chunks.append(channel.recv_stderr(65535).decode("utf-8", errors="ignore"))
            if channel.exit_status_ready():
                while channel.recv_ready():
                    out_chunks.append(channel.recv(65535).decode("utf-8", errors="ignore"))
                while channel.recv_stderr_ready():
                    err_chunks.append(channel.recv_stderr(65535).decode("utf-8", errors="ignore"))
                break
            if deadline is not None and time.monotonic() > deadline:
                channel.close()
                preview = command.replace("\n", " ")[:240]
                raise RuntimeError(
                    "Remote command timed out after "
                    f"{self.command_timeout:.0f}s: {preview}"
                )
            time.sleep(0.1)

        out = "".join(out_chunks)
        err = "".join(err_chunks)
        code = channel.recv_exit_status()
        if check and code != 0:
            raise RuntimeError(
                f"Remote command failed ({code}): {command}\nSTDOUT:\n{out}\nSTDERR:\n{err}"
            )
        return code, out, err

    def upload(self, local_path: str, remote_path: str) -> None:
        if self.client is None:
            raise RuntimeError("VPS SSH client is not connected")
        sftp = self.client.open_sftp()
        try:
            sftp.put(local_path, remote_path)
        finally:
            sftp.close()


def parse_env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "")
    if raw is None or not str(raw).strip():
        return default
    return int(str(raw).strip())


def parse_env_float(name: str, default: float) -> float:
    raw = os.environ.get(name, "")
    if raw is None or not str(raw).strip():
        return default
    return float(str(raw).strip())


def get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def load_ssh_private_key_from_env() -> paramiko.PKey | None:
    raw = os.environ.get("VPS_SSH_PRIVATE_KEY", "")
    if not isinstance(raw, str) or not raw.strip():
        return None
    stream = io.StringIO(raw.strip())
    for key_class in (paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey):
        try:
            stream.seek(0)
            return key_class.from_private_key(stream)
        except Exception:
            continue
    raise RuntimeError("VPS_SSH_PRIVATE_KEY is set but could not be parsed as a private key")


def open_vps_client(
    *,
    port: int | None = None,
    connect_timeout: float | None = None,
    connect_retries: int | None = None,
    retry_delay_seconds: float | None = None,
    command_timeout: float | None = None,
) -> VPS:
    host = get_required_env("VPS_HOST")
    user = get_required_env("VPS_USER")
    password = os.environ.get("VPS_PASS", "").strip()
    pkey = load_ssh_private_key_from_env()
    if not password and pkey is None:
        raise RuntimeError("Missing VPS auth: set VPS_PASS or VPS_SSH_PRIVATE_KEY")
    return VPS(
        host,
        user,
        password,
        port=port if port is not None else parse_env_int("VPS_PORT", 22),
        pkey=pkey,
        connect_timeout=float(connect_timeout or os.environ.get("VPS_CONNECT_TIMEOUT", "20")),
        connect_retries=connect_retries
        if connect_retries is not None
        else parse_env_int("VPS_CONNECT_RETRIES", 2),
        retry_delay_seconds=retry_delay_seconds
        if retry_delay_seconds is not None
        else float(os.environ.get("VPS_RETRY_DELAY_SECONDS", "8")),
        command_timeout=command_timeout
        if command_timeout is not None
        else parse_env_float("VPS_SSH_COMMAND_TIMEOUT", 0),
    )


def env_value_or_default(name: str, fallback: str) -> str:
    value = os.environ.get(name, "")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def print_section(title: str) -> None:
    safe_print(f"\n{'=' * 18} {title} {'=' * 18}")


def build_local_vps_database_url() -> str:
    return (
        f"postgresql://{VPS_POSTGRES_USER}:{VPS_POSTGRES_PASSWORD}"
        f"@127.0.0.1:{VPS_POSTGRES_PORT}/{VPS_POSTGRES_DB}"
    )


def ensure_vps_postgres(vps: VPS) -> str:
    ensure_cmd = textwrap.dedent(
        f"""
        set -euo pipefail
        export DEBIAN_FRONTEND=noninteractive
        if ! command -v docker >/dev/null 2>&1; then
          apt-get update -y
          apt-get install -y docker.io
          systemctl enable docker
          systemctl restart docker
        fi
        if docker ps -a --format '{{{{.Names}}}}' | grep -qx '{VPS_POSTGRES_CONTAINER}'; then
          docker start {VPS_POSTGRES_CONTAINER} >/dev/null
        else
          docker run -d \\
            --name {VPS_POSTGRES_CONTAINER} \\
            --restart unless-stopped \\
            -e POSTGRES_USER={VPS_POSTGRES_USER} \\
            -e POSTGRES_PASSWORD={VPS_POSTGRES_PASSWORD} \\
            -e POSTGRES_DB={VPS_POSTGRES_DB} \\
            -p 127.0.0.1:{VPS_POSTGRES_PORT}:5432 \\
            postgres:16-alpine
        fi
        ready=0
        for attempt in $(seq 1 45); do
          if docker exec {VPS_POSTGRES_CONTAINER} pg_isready -U {VPS_POSTGRES_USER} -d {VPS_POSTGRES_DB} >/dev/null 2>&1; then
            ready=1
            break
          fi
          sleep 1
        done
        if [ "$ready" -ne 1 ]; then
          echo "PostgreSQL container failed readiness check" >&2
          exit 1
        fi
        """
    ).strip()
    print_section("Ensure local PostgreSQL on VPS")
    vps.run(ensure_cmd)
    safe_print(
        f"Auto-provisioned local PostgreSQL on 127.0.0.1:{VPS_POSTGRES_PORT} "
        f"(container: {VPS_POSTGRES_CONTAINER})"
    )
    return build_local_vps_database_url()


def parse_env_file(content: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if not key:
            continue
        parsed[key] = value.replace("\\n", "\n")
    return parsed


def read_remote_production_env(vps: VPS, app_dir: str) -> dict[str, str]:
    env_path = f"{app_dir}/.env.production"
    _, out, _ = vps.run(f"cat {shlex.quote(env_path)} 2>/dev/null || true", check=False)
    if not out.strip():
        return {}
    return parse_env_file(out)


def apply_deployment_wave_overrides(
    merged_env: dict[str, str],
    existing_remote_env: dict[str, str] | None = None,
) -> dict[str, str]:
    wave = os.environ.get("DEPLOYMENT_WAVE", merged_env.get("DEPLOYMENT_WAVE", "1")).strip()
    overrides = WAVE_ENV_OVERRIDES.get(wave)
    if not overrides:
        return merged_env
    result = dict(merged_env)
    result.update(overrides)
    remote_env = existing_remote_env or {}
    for key in SAAS_OPT_IN_ENV_KEYS:
        ci_value = os.environ.get(key)
        if ci_value:
            result[key] = ci_value
        elif remote_env.get(key):
            result[key] = remote_env[key]
    return result


def resolve_saas_platform_admin_ids(merged_env: dict[str, str]) -> dict[str, str]:
    result = dict(merged_env)
    if result.get("SAAS_PLATFORM_ADMIN_USER_IDS"):
        return result
    owner_id = result.get("AUTH_OWNER_USER_ID") or result.get(
        "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID"
    )
    saas_enabled = (
        result.get("SAAS_ADMIN_API_ENABLED") == "true"
        or result.get("NEXT_PUBLIC_SAAS_ADMIN_ENABLED") == "true"
    )
    if saas_enabled and owner_id:
        result["SAAS_PLATFORM_ADMIN_USER_IDS"] = owner_id
    return result


def deployment_wave_requires_analytics_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 2


def deployment_wave_requires_pagination_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 3


def deployment_wave_requires_org_config_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 4


def deployment_wave_requires_phase9_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 5


def deployment_wave_requires_auth_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 6


def deployment_wave_requires_saas_verify() -> bool:
    wave = os.environ.get("DEPLOYMENT_WAVE", "1").strip()
    if not wave.isdigit():
        return False
    return int(wave) >= 7


def verify_request_auth_flags(
    auth_verify: bool,
    wave_org_id: str,
    wave_owner_id: str,
) -> str:
    if auth_verify:
        return f"-b {shlex.quote(VERIFY_COOKIE_JAR)}"
    return (
        f"-H 'x-organization-id: {wave_org_id}' "
        f"-H 'x-user-id: {wave_owner_id}' "
        f"-H 'x-member-role: owner'"
    )


def resolve_production_env(existing_remote_env: dict[str, str] | None = None) -> dict[str, str]:
    merged = dict(PRODUCTION_ENV_BOOTSTRAP_DEFAULTS)
    if existing_remote_env:
        for key, value in existing_remote_env.items():
            if value:
                merged[key] = value
    for key in PRODUCTION_ENV_KEYS:
        value = os.environ.get(key)
        if value:
            merged[key] = value

    merged = apply_deployment_wave_overrides(merged, existing_remote_env)
    merged = resolve_saas_platform_admin_ids(merged)

    if deployment_wave_requires_auth_verify():
        if not merged.get("AUTH_OWNER_USERNAME", "").strip():
            merged["AUTH_OWNER_USERNAME"] = "hajri"
        db_credentials_enabled = merged.get("AUTH_DB_CREDENTIALS_ENABLED", "").strip().lower() == "true"
        if not db_credentials_enabled and not merged.get("AUTH_OWNER_PASSWORD"):
            merged["AUTH_OWNER_PASSWORD"] = "123"

    if not merged.get("DATABASE_URL"):
        raise RuntimeError(
            "DATABASE_URL is required for production deploy. "
            "Set the GitHub secret DATABASE_URL or ensure /opt/taqfeelah/.env.production "
            "already exists on the VPS with a valid DATABASE_URL."
        )
    validate_production_auth_secrets(merged, existing_remote_env)
    return merged


def log_production_env_sources(
    merged_env: dict[str, str],
    existing_remote_env: dict[str, str],
) -> None:
    from_bootstrap: list[str] = []
    from_remote: list[str] = []
    from_ci: list[str] = []
    for key in PRODUCTION_ENV_KEYS:
        value = merged_env.get(key)
        if not value:
            continue
        if os.environ.get(key):
            from_ci.append(key)
        elif existing_remote_env.get(key):
            from_remote.append(key)
        elif PRODUCTION_ENV_BOOTSTRAP_DEFAULTS.get(key) == value:
            from_bootstrap.append(key)
    if from_bootstrap:
        safe_print(f"Bootstrap defaults applied: {', '.join(from_bootstrap)}")
    if from_remote:
        safe_print(f"Preserved from VPS .env.production: {', '.join(from_remote)}")
    if from_ci:
        safe_print(f"Applied from GitHub secrets: {', '.join(from_ci)}")


def build_production_env_payload(merged_env: dict[str, str]) -> str:
    lines: list[str] = []
    keys_to_write = list(PRODUCTION_ENV_KEYS)
    for key in PRESERVED_REMOTE_ENV_KEYS:
        if merged_env.get(key) and key not in keys_to_write:
            keys_to_write.append(key)
    for key in keys_to_write:
        value = merged_env.get(key)
        if not value:
            continue
        normalized = value.replace("\r\n", "\n").replace("\n", "\\n")
        lines.append(f"{key}={normalized}")
    payload = ("\n".join(lines) + "\n").encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


def env_flag_enabled(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() == "true"


def remote_repair_scripts_enabled() -> bool:
    return env_flag_enabled("VPS_RUN_REMOTE_REPAIR_SCRIPTS")


def skip_remote_build_enabled() -> bool:
    return env_flag_enabled("VPS_SKIP_REMOTE_BUILD")


def resolve_deploy_archive(
    local_path: str,
    artifact_path: str | None = None,
) -> tuple[str, bool]:
    """Return (archive_path, delete_after_upload)."""
    if artifact_path:
        resolved = Path(artifact_path).resolve()
        if not resolved.is_file():
            raise RuntimeError(f"Deploy artifact not found: {resolved}")
        safe_print(f"Using CI production artifact: {resolved}")
        return str(resolved), False
    return build_source_archive(local_path), True


def cmd_audit(vps: VPS) -> None:
    checks: Iterable[str] = [
        "hostname && whoami && uptime",
        "systemctl is-active nginx || true",
        "docker --version || true",
        "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}' || true",
        "pm2 ls || true",
        "ls -la /etc/nginx/sites-enabled || true",
        "ls -la /etc/nginx/sites-available || true",
        "ss -tulpn | sed -n '1,120p'",
        "certbot certificates || true",
    ]
    for c in checks:
        print_section(c)
        _, out, err = vps.run(c, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())


def build_source_archive(local_path: str) -> str:
    root = Path(local_path).resolve()
    if not root.exists():
        raise RuntimeError(f"Local path does not exist: {root}")

    ignored_dirs = {".git", ".next", "node_modules", ".idea", ".vscode"}
    ignored_files = {"tsconfig.tsbuildinfo"}

    fd, archive_path = tempfile.mkstemp(prefix="taqfeelah-src-", suffix=".tar.gz")
    os.close(fd)

    with tarfile.open(archive_path, "w:gz") as tar:
        for path in root.rglob("*"):
            rel = path.relative_to(root)
            rel_parts = set(rel.parts)
            if rel_parts & ignored_dirs:
                continue
            if path.name in ignored_files:
                continue
            if path.is_file():
                tar.add(path, arcname=str(rel).replace("\\", "/"))

    return archive_path


def cmd_deploy(vps: VPS, domain: str, www_domain: str, local_path: str) -> None:
    app_dir = "/opt/taqfeelah"
    compose_file = f"{app_dir}/docker-compose.yml"
    nginx_conf = f"/etc/nginx/sites-available/{domain}.conf"
    nginx_enabled = f"/etc/nginx/sites-enabled/{domain}.conf"
    backup_dir = f"/root/nginx-backups/{domain}"
    remote_archive = "/tmp/taqfeelah-src.tar.gz"

    bootstrap = textwrap.dedent(
        f"""
        set -euo pipefail
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y
        apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
        install -m 0755 -d /etc/apt/keyrings
        if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
          curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
          chmod a+r /etc/apt/keyrings/docker.gpg
        fi
        arch="$(dpkg --print-architecture)"
        codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
        echo "deb [arch=$arch signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $codename stable" > /etc/apt/sources.list.d/docker.list
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl enable docker
        systemctl restart docker
        """
    ).strip()

    print_section("Installing system prerequisites")
    vps.run(bootstrap)

    print_section("Backing up current Nginx config")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            mkdir -p {shlex.quote(backup_dir)}
            ts="$(date +%Y%m%d-%H%M%S)"
            cp -a /etc/nginx "{backup_dir}/nginx-$ts"
            """
        ).strip()
    )

    print_section("Preparing app directory and source")
    archive_path = build_source_archive(local_path)
    try:
        vps.upload(archive_path, remote_archive)
    finally:
        try:
            os.remove(archive_path)
        except OSError:
            pass

    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            mkdir -p {shlex.quote(app_dir)}
            rm -rf {shlex.quote(app_dir)}/*
            tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(app_dir)}
            rm -f {shlex.quote(remote_archive)}
            """
        ).strip()
    )

    print_section("Writing Docker Compose config")
    compose_content = textwrap.dedent(
        f"""
        services:
          taqfeelah:
            image: node:22-alpine
            container_name: taqfeelah-app
            restart: unless-stopped
            working_dir: /app
            command: sh -lc "npm ci && npm run build && npm run start"
            environment:
              - NODE_ENV=production
              - PORT=3000
            ports:
              - "127.0.0.1:3010:3000"
            volumes:
              - {app_dir}:/app
        """
    ).strip()
    escaped_compose = compose_content.replace("'", "'\"'\"'")
    vps.run(f"bash -lc 'cat > {shlex.quote(compose_file)} <<\"EOF\"\n{escaped_compose}\nEOF'")

    print_section("Starting isolated container")
    vps.run(f"cd {shlex.quote(app_dir)} && docker compose up -d --force-recreate")
    vps.run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")

    print_section("Writing dedicated Nginx vhost")
    vhost_content = textwrap.dedent(
        f"""
        server {{
            listen 80;
            listen [::]:80;
            server_name {domain} {www_domain};

            location / {{
                proxy_pass http://127.0.0.1:3010;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
            }}
        }}
        """
    ).strip()
    escaped_vhost = vhost_content.replace("'", "'\"'\"'")
    vps.run(f"bash -lc 'cat > {shlex.quote(nginx_conf)} <<\"EOF\"\n{escaped_vhost}\nEOF'")
    vps.run(f"ln -sfn {shlex.quote(nginx_conf)} {shlex.quote(nginx_enabled)}")
    vps.run("nginx -t")
    vps.run("systemctl reload nginx")

    print_section("Issuing SSL certificate")
    certbot_cmd = (
        f"certbot --nginx -d {shlex.quote(domain)} -d {shlex.quote(www_domain)} "
        "--agree-tos --register-unsafely-without-email --redirect --non-interactive"
    )
    vps.run(certbot_cmd)


def tcp_probe_endpoint(
    family: socket.AddressFamily,
    sockaddr: tuple,
    ip: str,
    port: int,
    *,
    attempt: int,
    max_attempts: int,
    timeout: float,
) -> tuple[bool, str]:
    """TCP reachability check on a single endpoint (no SSH auth)."""
    safe_print(
        f"TCP probe attempt {attempt}/{max_attempts} "
        f"→ {ip}:{port} (timeout {timeout:.0f}s)"
    )
    sock: socket.socket | None = None
    try:
        sock = socket.socket(family, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(sockaddr)
        safe_print(f"TCP {ip}:{port} — reachable")
        return True, "reachable"
    except Exception as exc:
        reason = classify_connect_error(exc)
        safe_print(f"TCP {ip}:{port} — {reason}")
        return False, reason
    finally:
        if sock is not None:
            sock.close()


def probe_vps_connectivity(
    host: str,
    port: int,
    timeout: float,
    *,
    attempt: int,
    max_attempts: int,
) -> tuple[bool, str, str]:
    """Probe DNS + TCP on the primary endpoint before SSH auth."""
    endpoints = resolve_tcp_endpoints(host, port)
    family, sockaddr, ip = pick_primary_endpoint(endpoints)
    safe_print(
        f"Resolved {len(endpoints)} endpoint(s) for {host}:{port}; "
        f"probing primary {ip}:{port}"
    )
    ok, reason = tcp_probe_endpoint(
        family,
        sockaddr,
        ip,
        port,
        attempt=attempt,
        max_attempts=max_attempts,
        timeout=timeout,
    )
    return ok, reason, ip


def run_tcp_connectivity_preflight(host: str, port: int, tcp_probe_timeout: float) -> None:
    """TCP-only reachability check from the runner before opening SSH."""
    print_section("Runner → VPS connectivity probe")
    preflight_wait = max(0.0, float(os.environ.get("VPS_PREFLIGHT_WAIT_SECONDS", "0")))
    if preflight_wait > 0:
        safe_print(
            f"Preflight wait {preflight_wait:.0f}s "
            "(VPS_PREFLIGHT_WAIT_SECONDS / workflow cooldown)…"
        )
        time.sleep(preflight_wait)
    else:
        safe_print("No extra preflight wait (VPS_PREFLIGHT_WAIT_SECONDS=0).")

    probe_retries = max(1, int(os.environ.get("VPS_PROBE_RETRIES", "2")))
    probe_delay = max(0.0, float(os.environ.get("VPS_PROBE_RETRY_DELAY_SECONDS", "12")))
    probe_ok = False
    last_reason = "unknown"
    last_ip = host
    for attempt in range(1, probe_retries + 1):
        if attempt > 1 and probe_delay > 0:
            safe_print(
                f"TCP probe backoff {probe_delay:.0f}s before attempt "
                f"{attempt}/{probe_retries}…"
            )
            time.sleep(probe_delay)
        probe_ok, last_reason, last_ip = probe_vps_connectivity(
            host,
            port,
            tcp_probe_timeout,
            attempt=attempt,
            max_attempts=probe_retries,
        )
        if probe_ok:
            break
        if last_reason in FAIL_FAST_CONNECT_REASONS:
            safe_print(f"TCP probe stopping early: {last_reason}")
            break

    if not probe_ok:
        raise RuntimeError(
            "VPS port is not reachable from GitHub Actions.\n"
            f"Last TCP probe: {last_ip}:{port} — {last_reason}\n"
            "Intermittent timeouts often mean the GitHub runner IP is temporarily blocked.\n"
            "Re-run the workflow (a new runner may succeed) or set VPS_HOST to the VPS public IP.\n"
            "The site may still be online while SSH from CI is blocked.\n"
            "On VPS (root): bash scripts/vps-diagnose-ci-access.sh\n"
            "See docs/DEPLOYMENT_WAVES.md (troubleshooting section)."
        )


def cmd_deploy_production(
    vps: VPS,
    domain: str,
    www_domain: str,
    local_path: str,
    *,
    artifact_path: str | None = None,
) -> None:
    """Preflight + deploy + verify in one SSH session (fewer connection storms)."""
    cmd_preflight(vps, domain, www_domain)
    cmd_deploy_pm2(vps, domain, www_domain, local_path, artifact_path=artifact_path)
    cmd_verify(vps, domain, www_domain)


def cmd_preflight(vps: VPS, domain: str, www_domain: str) -> None:
    print_section("SSH session")
    _, out, _ = vps.run("hostname && whoami && uptime", check=True)
    safe_print(out.strip())

    print_section("Core services")
    for label, command in (
        ("nginx", "systemctl is-active nginx"),
        ("pm2", "pm2 ls || true"),
        ("app dir", "ls -ld /opt/taqfeelah || true"),
    ):
        safe_print(f"[{label}]")
        _, out, err = vps.run(command, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print(err.strip())

    print_section("HTTPS smoke check from VPS")
    for url in (f"https://{domain}", f"https://{www_domain}"):
        safe_print(url)
        _, out, err = vps.run(f"curl -I --max-time 12 {shlex.quote(url)} || true", check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print(err.strip())

    safe_print("\nPreflight passed — safe to deploy.")


def post_deploy_baseline_enabled() -> bool:
    raw = os.environ.get("POST_DEPLOY_BASELINE_VERIFY", "true").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def run_post_deploy_baseline(vps: VPS) -> None:
    print_section("Post-deploy baseline: DB schema + closeout API checklist")
    baseline_cmd = textwrap.dedent(
        f"""
        set -euo pipefail
        cd {shlex.quote(TAQFEELAH_APP_DIR)}
        set -a
        . ./.env.production
        set +a
        node scripts/baseline-drizzle-migrations.mjs
        node scripts/verify-plan-table-db.mjs
        CHECK_BASE_URL="http://127.0.0.1:{TAQFEELAH_APP_PORT}" node scripts/db-source-unification-check.mjs
        """
    ).strip()
    _, out, err = vps.run(baseline_cmd, check=True)
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())
    safe_print("Post-deploy baseline verify passed.")


def cmd_baseline_verify(vps: VPS) -> None:
    run_post_deploy_baseline(vps)


def cmd_verify(vps: VPS, domain: str, www_domain: str) -> None:
    wave_org_id = PRODUCTION_ENV_BOOTSTRAP_DEFAULTS["NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID"]
    wave_owner_id = PRODUCTION_ENV_BOOTSTRAP_DEFAULTS["NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID"]
    wave_store_id = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"
    analytics_verify = deployment_wave_requires_analytics_verify()
    pagination_verify = deployment_wave_requires_pagination_verify()
    org_config_verify = deployment_wave_requires_org_config_verify()
    phase9_verify = deployment_wave_requires_phase9_verify()
    auth_verify = deployment_wave_requires_auth_verify()
    saas_verify = deployment_wave_requires_saas_verify()
    # GitHub Actions injects empty strings when secrets are unset — treat as missing.
    auth_owner_username = os.environ.get("AUTH_OWNER_USERNAME", "").strip() or "hajri"
    auth_owner_password = os.environ.get("AUTH_OWNER_PASSWORD", "") or "123"
    auth_employee_user_id = "4cf1450d-08d8-4ca1-b180-1c2642174a79"
    auth_employee_pin = "1234"
    auth_flags = verify_request_auth_flags(auth_verify, wave_org_id, wave_owner_id)
    auth_owner_payload = json.dumps(
        {
            "mode": "owner_password",
            "username": auth_owner_username,
            "password": auth_owner_password,
        },
        separators=(",", ":"),
    )
    auth_bad_payload = json.dumps(
        {
            "mode": "owner_password",
            "username": auth_owner_username,
            "password": "wrong-password-deploy-verify",
        },
        separators=(",", ":"),
    )
    auth_employee_payload = json.dumps(
        {
            "mode": "employee_pin",
            "employeeId": "ahmed",
            "pin": auth_employee_pin,
        },
        separators=(",", ":"),
    )
    verify_cmds = [
        "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
        "nginx -t",
        f"curl -I --max-time 15 http://{shlex.quote(domain)} || true",
        f"curl -I --max-time 15 https://{shlex.quote(domain)} || true",
        (
            f"curl -sS --max-time 20 -o /tmp/taqfeelah-auth-session.json "
            f"-w '%{{http_code}}' https://{shlex.quote(domain)}/api/v1/auth/session"
        ),
        *([
            f"rm -f {shlex.quote(VERIFY_COOKIE_JAR)}",
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave6-auth-owner.json "
                f"-w '%{{http_code}}' -c {shlex.quote(VERIFY_COOKIE_JAR)} "
                f"-b {shlex.quote(VERIFY_COOKIE_JAR)} "
                f"-X POST https://{shlex.quote(domain)}/api/v1/auth/session "
                f"-H 'content-type: application/json' "
                f"-d {shlex.quote(auth_owner_payload)}"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave6-auth-bad.json "
                f"-w '%{{http_code}}' -X POST https://{shlex.quote(domain)}/api/v1/auth/session "
                f"-H 'content-type: application/json' "
                f"-d {shlex.quote(auth_bad_payload)}"
            ),
        ] if auth_verify else []),
        (
            f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave1-entries.json "
            f"-w '%{{http_code}}' https://{shlex.quote(domain)}/api/v1/stores/{wave_store_id}/entries "
            f"{auth_flags}"
        ),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave2-summary-day.json "
                f"-w '%{{http_code}}' "
                f"https://{shlex.quote(domain)}/api/v1/stores/{wave_store_id}/summary/day"
                f"?date=$(date -u +%Y-%m-%d) "
                f"{auth_flags}"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave2-reports-days.json "
                f"-w '%{{http_code}}' "
                f"'https://{shlex.quote(domain)}/api/v1/reports/days?"
                f"storeId={wave_store_id}&from=2026-01-01&to=2026-12-31' "
                f"{auth_flags}"
            ),
        ] if analytics_verify else []),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave3-entries-paginated.json "
                f"-w '%{{http_code}}' "
                f"'https://{domain}/api/v1/stores/{wave_store_id}/entries"
                f"?status=active&paginated=1&limit=25' "
                f"{auth_flags}"
            ),
        ] if pagination_verify else []),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave4-stores.json "
                f"-w '%{{http_code}}' "
                f"'https://{domain}/api/v1/stores?status=active' "
                f"{auth_flags}"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave4-members.json "
                f"-w '%{{http_code}}' "
                f"'https://{domain}/api/v1/members?status=active' "
                f"{auth_flags}"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave4-sales-channels.json "
                f"-w '%{{http_code}}' "
                f"'https://{domain}/api/v1/stores/{wave_store_id}/sales-channels"
                f"?status=active' "
                f"{auth_flags}"
            ),
        ] if org_config_verify else []),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave5-notebook-export.json "
                f"-w '%{{http_code}}' "
                f"'https://{domain}/api/v1/exports/notebook?"
                f"storeId={wave_store_id}&period=day&date='"
                f"$(date -u +%Y-%m-%d) "
                f"{auth_flags}"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave5-duplicate-ack.json "
                f"-w '%{{http_code}}' -X POST "
                f"{auth_flags} "
                f"-H 'content-type: application/json' "
                f"-d '{{}}' "
                f"https://{shlex.quote(domain)}/api/v1/stores/{wave_store_id}/entries/"
                f"duplicate-summary/acknowledge"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave5-inline-attachment.json "
                f"-w '%{{http_code}}' -X POST "
                f"{auth_flags} "
                f"-H 'content-type: application/json' "
                f"-d '{{}}' "
                f"https://{shlex.quote(domain)}/api/v1/stores/{wave_store_id}/attachments/inline"
            ),
        ] if phase9_verify else []),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave7-saas-kpis.json "
                f"-w '%{{http_code}}' "
                f"https://{shlex.quote(domain)}/api/v1/saas-admin/overview"
            ),
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave7-saas-page.html "
                f"-w '%{{http_code}}' "
                f"https://{shlex.quote(domain)}/saas-admin"
            ),
            *([
                (
                    f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave7-saas-kpis-auth.json "
                    f"-w '%{{http_code}}' -b {shlex.quote(VERIFY_COOKIE_JAR)} "
                    f"https://{shlex.quote(domain)}/api/v1/saas-admin/overview"
                ),
            ] if auth_verify else []),
        ] if saas_verify else []),
        *([
            (
                f"curl -sS --max-time 20 -o /tmp/taqfeelah-wave6-auth-employee.json "
                f"-w '%{{http_code}}' -c {shlex.quote(VERIFY_COOKIE_JAR)} "
                f"-b {shlex.quote(VERIFY_COOKIE_JAR)} "
                f"-X POST https://{shlex.quote(domain)}/api/v1/auth/session "
                f"-H 'content-type: application/json' "
                f"-d {shlex.quote(auth_employee_payload)}"
            ),
        ] if auth_verify else []),
        f"curl -I --max-time 15 https://{shlex.quote(www_domain)} || true",
        "curl -I --max-time 15 https://hajrix.com || true",
        "curl -I --max-time 15 https://arz-lounge.com || true",
    ]
    auth_status_code: str | None = None
    entries_status_code: str | None = None
    summary_day_status_code: str | None = None
    reports_days_status_code: str | None = None
    entries_paginated_status_code: str | None = None
    for c in verify_cmds:
        print_section(c)
        code, out, err = vps.run(c, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())
        if "taqfeelah-auth-session.json" in c and "wave6-auth" not in c:
            auth_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-auth-session.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Auth session response body:")
                safe_print(body.strip())
            if auth_status_code not in {"200", "503"}:
                raise RuntimeError(
                    f"Auth session verification failed with HTTP {auth_status_code or 'unknown'}: {c}"
                )
            continue
        if "/entries" in c and "wave1" in c:
            entries_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-wave1-entries.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Wave 1 entries API response preview:")
                safe_print(body.strip()[:240])
            if entries_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 1 verification failed: entries API returned "
                    f"HTTP {entries_status_code or 'unknown'}"
                )
            continue
        if "/summary/day" in c and "wave2" in c:
            summary_day_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-wave2-summary-day.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Wave 2 summary/day API response preview:")
                safe_print(body.strip()[:240])
            if summary_day_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 2 verification failed: summary/day API returned "
                    f"HTTP {summary_day_status_code or 'unknown'}"
                )
            continue
        if "/reports/days" in c and "wave2" in c:
            reports_days_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-wave2-reports-days.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Wave 2 reports/days API response preview:")
                safe_print(body.strip()[:240])
            if reports_days_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 2 verification failed: reports/days API returned "
                    f"HTTP {reports_days_status_code or 'unknown'}"
                )
            continue
        if "/entries" in c and "wave3" in c and "paginated" in c:
            entries_paginated_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave3-entries-paginated.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 3 paginated entries API response preview:")
                safe_print(body.strip()[:240])
            if entries_paginated_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 3 verification failed: paginated entries API returned "
                    f"HTTP {entries_paginated_status_code or 'unknown'}"
                )
            if '"items"' not in body:
                raise RuntimeError(
                    "Deployment wave 3 verification failed: paginated entries response "
                    "missing items payload"
                )
            continue
        if "wave4-stores.json" in c:
            stores_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-wave4-stores.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Wave 4 stores API response preview:")
                safe_print(body.strip()[:240])
            if stores_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 4 verification failed: stores API returned "
                    f"HTTP {stores_status_code or 'unknown'}"
                )
            if '"stores"' not in body:
                raise RuntimeError(
                    "Deployment wave 4 verification failed: stores response missing stores payload"
                )
            continue
        if "wave4-members.json" in c:
            members_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run("cat /tmp/taqfeelah-wave4-members.json 2>/dev/null || true", check=False)
            if body.strip():
                safe_print("Wave 4 members API response preview:")
                safe_print(body.strip()[:240])
            if members_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 4 verification failed: members API returned "
                    f"HTTP {members_status_code or 'unknown'}"
                )
            if '"members"' not in body:
                raise RuntimeError(
                    "Deployment wave 4 verification failed: members response missing members payload"
                )
            continue
        if "wave4-sales-channels.json" in c:
            channels_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave4-sales-channels.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 4 sales-channels API response preview:")
                safe_print(body.strip()[:240])
            if channels_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 4 verification failed: sales-channels API returned "
                    f"HTTP {channels_status_code or 'unknown'}"
                )
            if '"channels"' not in body:
                raise RuntimeError(
                    "Deployment wave 4 verification failed: sales-channels response "
                    "missing channels payload"
                )
            continue
        if "wave5-notebook-export.json" in c:
            notebook_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave5-notebook-export.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 5 notebook export API response preview:")
                safe_print(body.strip()[:240])
            if notebook_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 5 verification failed: notebook export API returned "
                    f"HTTP {notebook_status_code or 'unknown'}"
                )
            if '"totals"' not in body:
                raise RuntimeError(
                    "Deployment wave 5 verification failed: notebook export response "
                    "missing totals payload"
                )
            continue
        if "wave5-duplicate-ack.json" in c:
            duplicate_ack_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave5-duplicate-ack.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 5 duplicate-summary acknowledge API response preview:")
                safe_print(body.strip()[:240])
            if duplicate_ack_status_code != "400":
                raise RuntimeError(
                    "Deployment wave 5 verification failed: duplicate-summary acknowledge "
                    f"API returned HTTP {duplicate_ack_status_code or 'unknown'} (expected 400)"
                )
            if "entryIds" not in body and "VALIDATION_ERROR" not in body:
                raise RuntimeError(
                    "Deployment wave 5 verification failed: duplicate-summary acknowledge "
                    "response missing validation payload"
                )
            continue
        if "wave5-inline-attachment.json" in c:
            inline_attachment_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave5-inline-attachment.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 5 inline attachment API response preview:")
                safe_print(body.strip()[:240])
            if inline_attachment_status_code != "400":
                raise RuntimeError(
                    "Deployment wave 5 verification failed: inline attachment API returned "
                    f"HTTP {inline_attachment_status_code or 'unknown'} (expected 400)"
                )
            if "VALIDATION_ERROR" not in body and "Invalid inline attachment" not in body:
                raise RuntimeError(
                    "Deployment wave 5 verification failed: inline attachment response "
                    "missing validation payload"
                )
            continue
        if "wave6-auth-owner.json" in c:
            owner_auth_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave6-auth-owner.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 6 owner auth response preview:")
                safe_print(body.strip()[:240])
            if owner_auth_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 6 verification failed: owner auth POST returned "
                    f"HTTP {owner_auth_status_code or 'unknown'} (expected 200). "
                    "Run scripts/seed-auth-credentials.mjs before wave 6."
                )
            continue
        if "wave6-auth-bad.json" in c:
            bad_auth_status_code = out.strip()[-3:] if out.strip() else None
            if bad_auth_status_code != "401":
                raise RuntimeError(
                    "Deployment wave 6 verification failed: invalid owner auth POST returned "
                    f"HTTP {bad_auth_status_code or 'unknown'} (expected 401)"
                )
            continue
        if "wave6-auth-employee.json" in c:
            employee_auth_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave6-auth-employee.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 6 employee auth response preview:")
                safe_print(body.strip()[:240])
            if employee_auth_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 6 verification failed: employee auth POST returned "
                    f"HTTP {employee_auth_status_code or 'unknown'} (expected 200)"
                )
            continue
        if "wave7-saas-kpis.json" in c:
            saas_kpis_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave7-saas-kpis.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 7 SaaS KPIs response preview:")
                safe_print(body.strip()[:240])
            saas_api_enabled = os.environ.get("SAAS_ADMIN_API_ENABLED") == "true"
            expected_saas_status = "401" if saas_api_enabled else "503"
            if saas_kpis_status_code != expected_saas_status:
                raise RuntimeError(
                    "Deployment wave 7 verification failed: SaaS overview API returned "
                    f"HTTP {saas_kpis_status_code or 'unknown'} "
                    f"(expected {expected_saas_status} when "
                    f"{'enabled' if saas_api_enabled else 'disabled'})"
                )
            continue
        if "wave7-saas-page.html" in c:
            saas_page_status_code = out.strip()[-3:] if out.strip() else None
            saas_client_enabled = os.environ.get("NEXT_PUBLIC_SAAS_ADMIN_ENABLED") == "true"
            expected_page_statuses = {"200", "307"} if saas_client_enabled else {"200"}
            if saas_page_status_code not in expected_page_statuses:
                raise RuntimeError(
                    "Deployment wave 7 verification failed: /saas-admin returned "
                    f"HTTP {saas_page_status_code or 'unknown'} "
                    f"(expected {' or '.join(sorted(expected_page_statuses))})"
                )
            if saas_client_enabled and saas_page_status_code == "307":
                _, location_out, _ = vps.run(
                    f"curl -sSI --max-time 15 https://{shlex.quote(domain)}/saas-admin "
                    "| awk 'BEGIN{IGNORECASE=1} /^location:/ {print $0}'",
                    check=False,
                )
                location_value = location_out.strip().lower()
                if "localhost" in location_value or "127.0.0.1" in location_value:
                    raise RuntimeError(
                        "Deployment wave 7 verification failed: /saas-admin login redirect "
                        f"leaks internal host ({location_out.strip()})"
                    )
            continue
        if "wave7-saas-kpis-auth.json" in c:
            saas_auth_status_code = out.strip()[-3:] if out.strip() else None
            _, body, _ = vps.run(
                "cat /tmp/taqfeelah-wave7-saas-kpis-auth.json 2>/dev/null || true",
                check=False,
            )
            if body.strip():
                safe_print("Wave 7 SaaS overview (authenticated) response preview:")
                safe_print(body.strip()[:240])
            if saas_auth_status_code != "200":
                raise RuntimeError(
                    "Deployment wave 7 verification failed: authenticated SaaS overview returned "
                    f"HTTP {saas_auth_status_code or 'unknown'} (expected 200)"
                )
            continue
        if code != 0:
            raise RuntimeError(f"Verification command failed ({code}): {c}")

    if post_deploy_baseline_enabled():
        run_post_deploy_baseline(vps)


def cmd_deploy_pm2(
    vps: VPS,
    domain: str,
    www_domain: str,
    local_path: str,
    *,
    artifact_path: str | None = None,
) -> None:
    app_dir = "/opt/taqfeelah"
    remote_archive = "/tmp/taqfeelah-src.tar.gz"
    nginx_conf = f"/etc/nginx/sites-available/{domain}.conf"
    nginx_enabled = f"/etc/nginx/sites-enabled/{domain}.conf"
    backup_dir = f"/root/nginx-backups/{domain}"
    app_port = 3010

    print_section("Backup current Nginx config")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            mkdir -p {shlex.quote(backup_dir)}
            ts="$(date +%Y%m%d-%H%M%S)"
            cp -a /etc/nginx "{backup_dir}/nginx-$ts"
            """
        ).strip()
    )

    print_section("Read existing production environment")
    existing_env = read_remote_production_env(vps, app_dir)
    if existing_env.get("DATABASE_URL"):
        safe_print("Found existing DATABASE_URL on VPS.")
    elif os.environ.get("DATABASE_URL"):
        safe_print("Using DATABASE_URL from GitHub secret.")
    else:
        existing_env["DATABASE_URL"] = ensure_vps_postgres(vps)

    print_section("Upload application source")
    archive_path, delete_archive = resolve_deploy_archive(local_path, artifact_path)
    try:
        vps.upload(archive_path, remote_archive)
    finally:
        if delete_archive:
            try:
                os.remove(archive_path)
            except OSError:
                pass

    print_section("Extract application source")
    attachments_root = "/var/lib/taqfeelah/attachments"
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            mkdir -p {shlex.quote(attachments_root)}
            if [ -d {shlex.quote(app_dir)}/data/attachments ]; then
              rsync -a {shlex.quote(app_dir)}/data/attachments/ {shlex.quote(attachments_root)}/ || true
            fi
            mkdir -p {shlex.quote(app_dir)}
            rm -rf {shlex.quote(app_dir)}/*
            tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(app_dir)}
            rm -f {shlex.quote(remote_archive)}
            mkdir -p {shlex.quote(attachments_root)}
            """
        ).strip()
    )

    print_section("Write production environment file")
    merged_env = resolve_production_env(existing_env)
    log_production_env_sources(merged_env, existing_env)
    env_payload = build_production_env_payload(merged_env)
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            printf '%s' {shlex.quote(env_payload)} | base64 -d > {shlex.quote(app_dir)}/.env.production
            """
        ).strip()
    )

    skip_remote_build = skip_remote_build_enabled()
    if skip_remote_build:
        print_section("Install dependencies (CI build artifact — skip remote build)")
        vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                npm install -g pnpm@9.15.9
                pnpm install --frozen-lockfile
                if [ ! -f .next/BUILD_ID ]; then
                  echo "Missing .next/BUILD_ID — CI artifact must include a production build" >&2
                  exit 1
                fi
                """
            ).strip()
        )
    else:
        print_section("Install dependencies and build app")
        deploy_commit = os.environ.get("DEPLOY_COMMIT", "").strip() or os.environ.get(
            "GITHUB_SHA", ""
        ).strip()
        release_build_export = (
            f'export RELEASE_BUILD={shlex.quote(deploy_commit)} '
            f'NEXT_PUBLIC_RELEASE_BUILD={shlex.quote(deploy_commit)}; '
            if deploy_commit
            else ""
        )
        vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                npm install -g pnpm@9.15.9
                pnpm install --frozen-lockfile
                {release_build_export}pnpm run build
                """
            ).strip()
        )

    print_section("Apply database schema")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            set -a
            . ./.env.production
            set +a
            node scripts/cleanup-orphan-entries.mjs --apply || true
            node scripts/diagnose-attachments.mjs || true
            node scripts/migrate-inline-attachments-to-local.mjs --apply || true
            node scripts/cleanup-inline-attachments.mjs --apply --vacuum || true
            pnpm exec drizzle-kit migrate || pnpm exec drizzle-kit push --force
            node scripts/baseline-drizzle-migrations.mjs
            """
        ).strip()
    )

    if deployment_wave_requires_auth_verify():
        print_section("Seed auth credentials (wave 6+)")
        _, auth_seed_out, auth_seed_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/seed-auth-credentials.mjs
                """
            ).strip(),
            check=False,
        )
        if auth_seed_out.strip():
            safe_print(auth_seed_out.strip())
        if auth_seed_err.strip():
            safe_print("STDERR:")
            safe_print(auth_seed_err.strip())

    reset_foundation_on_deploy = env_flag_enabled("RESET_FOUNDATION_ON_DEPLOY")

    if reset_foundation_on_deploy:
        confirm = os.environ.get("RESET_FOUNDATION_CONFIRM", "")
        print_section("Reset and seed modern foundation")
        vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                RESET_FOUNDATION_CONFIRM={shlex.quote(confirm)} node scripts/reset-and-seed-modern-foundation.mjs
                """
            ).strip()
        )

    if reset_foundation_on_deploy:
        safe_print("Skipping legacy seed/repair scripts after modern foundation reset.")
    elif not remote_repair_scripts_enabled():
        safe_print(
            "Skipping legacy seed/repair scripts "
            "(VPS_RUN_REMOTE_REPAIR_SCRIPTS is not true)."
        )
    else:
        print_section("Seed closeouts foundation when DATABASE_URL is configured")
        _, seed_out, seed_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/seed-closeouts-foundation.mjs
                """
            ).strip(),
            check=False,
        )
        if seed_out.strip():
            safe_print(seed_out.strip())
        if seed_err.strip():
            safe_print("STDERR:")
            safe_print(seed_err.strip())

        print_section("Repair staff store access for custom store IDs")
        _, staff_repair_out, staff_repair_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/repair-staff-store-access.mjs
                """
            ).strip(),
            check=False,
        )
        if staff_repair_out.strip():
            safe_print(staff_repair_out.strip())
        if staff_repair_err.strip():
            safe_print("STDERR:")
            safe_print(staff_repair_err.strip())

        print_section("Repair canonical sales channel UUIDs")
        _, canonical_channel_out, canonical_channel_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/repair-canonical-sales-channel-uuids.mjs
                """
            ).strip(),
            check=False,
        )
        if canonical_channel_out.strip():
            safe_print(canonical_channel_out.strip())
        if canonical_channel_err.strip():
            safe_print("STDERR:")
            safe_print(canonical_channel_err.strip())

        print_section("Repair sales channels for prototype/UI channel ids")
        _, channel_repair_out, channel_repair_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/repair-sales-channels.mjs
                """
            ).strip(),
            check=False,
        )
        if channel_repair_out.strip():
            safe_print(channel_repair_out.strip())
        if channel_repair_err.strip():
            safe_print("STDERR:")
            safe_print(channel_repair_err.strip())

        print_section("Repair stuck employee closeouts (auto-approve pending)")
        _, repair_out, repair_err = vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                cd {shlex.quote(app_dir)}
                set -a
                . ./.env.production
                set +a
                node scripts/repair-stuck-closeouts.mjs
                """
            ).strip(),
            check=False,
        )
        if repair_out.strip():
            safe_print(repair_out.strip())
        if repair_err.strip():
            safe_print("STDERR:")
            safe_print(repair_err.strip())

    print_section("Start isolated PM2 process")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            pm2 delete taqfeelah-app || true
            NODE_ENV=production pm2 start npx --name taqfeelah-app -- next start --hostname 127.0.0.1 --port {app_port}
            pm2 save
            pm2 ls
            """
        ).strip()
    )

    print_section("Create dedicated Nginx vhost")
    vhost_content = textwrap.dedent(
        f"""
        server {{
            listen 80;
            listen [::]:80;
            server_name {domain} {www_domain};

            location / {{
                proxy_pass http://127.0.0.1:{app_port};
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
            }}
        }}
        """
    ).strip()
    escaped_vhost = vhost_content.replace("'", "'\"'\"'")
    vps.run(f"bash -lc 'cat > {shlex.quote(nginx_conf)} <<\"EOF\"\n{escaped_vhost}\nEOF'")
    vps.run(f"ln -sfn {shlex.quote(nginx_conf)} {shlex.quote(nginx_enabled)}")
    vps.run("nginx -t")
    vps.run("systemctl reload nginx")

    print_section("Validate app through local Host header")
    _, out, err = vps.run(
        f"curl -I --max-time 15 -H 'Host: {domain}' http://127.0.0.1/",
        check=False,
    )
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())

    print_section("Ensure SSL remains active after deploy")
    cmd_enable_ssl(vps, domain, www_domain)


def cmd_repair_docker(vps: VPS) -> None:
    repair_cmd = textwrap.dedent(
        """
        set -euo pipefail
        export DEBIAN_FRONTEND=noninteractive
        systemctl reset-failed docker.service docker.socket || true
        dpkg --configure -a || true
        apt-get -f install -y
        apt-get install -y docker-compose-v2
        systemctl daemon-reload
        systemctl enable docker.socket
        systemctl start docker.socket
        systemctl enable docker
        systemctl restart docker
        systemctl status docker --no-pager -l | sed -n '1,60p'
        docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'
        """
    ).strip()
    print_section("Repairing Docker runtime")
    _, out, err = vps.run(repair_cmd, check=False)
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())


def cmd_docker_debug(vps: VPS) -> None:
    debug_cmds = [
        "systemctl status docker --no-pager -l | sed -n '1,120p'",
        "systemctl status docker.socket --no-pager -l | sed -n '1,120p'",
        "systemctl cat docker.service",
        "systemctl cat docker.socket",
        "journalctl -u docker --no-pager -n 120 | sed -n '1,140p'",
        "which dockerd || true",
        "dockerd --version || true",
    ]
    for c in debug_cmds:
        print_section(c)
        _, out, err = vps.run(c, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())


def cmd_pm2_app_logs(vps: VPS, app_name: str) -> None:
    print_section(f"pm2 logs {app_name}")
    _, out, err = vps.run(f"pm2 logs {shlex.quote(app_name)} --lines 120 --nostream", check=False)
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())


def cmd_reset_owner_auth(vps: VPS, owner_username: str, owner_password: str) -> None:
    app_dir = "/opt/taqfeelah"
    username_sql = owner_username.strip().lower().replace("'", "''")
    password_sql = owner_password.replace("'", "''")
    remote_env_bootstrap = textwrap.dedent(
        """
        ORG_ID="${AUTH_ORGANIZATION_ID:-${NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID:-8f63cf87-f2e2-4e2a-a20e-8f637f0a9e1}}"
        OWNER_ID="${AUTH_OWNER_USER_ID:-${NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID:-e8f3e35b-6051-4da3-8b10-979700c2f00f}}"
        """
    ).strip()

    print_section("Diagnose current owner auth")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            set -a
            . ./.env.production
            set +a
            {remote_env_bootstrap}
            node -e "const u=new URL(process.env.DATABASE_URL); console.log('DATABASE host:', u.host)"
            echo "Organization: $ORG_ID"
            psql "$DATABASE_URL" -c "
            SELECT created_at, reason,
                   metadata->'settings'->'authConfig'->>'ownerUsername' AS username,
                   metadata->'settings'->'authConfig'->>'ownerPassword' AS password
            FROM audit_events
            WHERE organization_id = '$ORG_ID'
              AND action = 'runtime_settings_saved'
            ORDER BY created_at DESC
            LIMIT 1;
            "
            """
        ).strip(),
        check=False,
    )

    print_section("Write AUTH_OWNER credentials to .env.production")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            touch .env.production
            if grep -q '^AUTH_OWNER_USERNAME=' .env.production; then
              sed -i 's/^AUTH_OWNER_USERNAME=.*/AUTH_OWNER_USERNAME={owner_username.strip().lower()}/' .env.production
            else
              echo 'AUTH_OWNER_USERNAME={owner_username.strip().lower()}' >> .env.production
            fi
            if grep -q '^AUTH_OWNER_PASSWORD=' .env.production; then
              sed -i 's/^AUTH_OWNER_PASSWORD=.*/AUTH_OWNER_PASSWORD={owner_password}/' .env.production
            else
              echo 'AUTH_OWNER_PASSWORD={owner_password}' >> .env.production
            fi
            grep '^AUTH_OWNER_USERNAME=' .env.production
            grep '^AUTH_OWNER_PASSWORD=' .env.production | sed 's/=.*/=<set>/'
            """
        ).strip()
    )

    print_section("Insert fresh runtime settings row with owner auth reset")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            set -a
            . ./.env.production
            set +a
            {remote_env_bootstrap}
            psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
            WITH latest AS (
              SELECT metadata
              FROM audit_events
              WHERE organization_id = '$ORG_ID'
                AND action = 'runtime_settings_saved'
              ORDER BY created_at DESC
              LIMIT 1
            )
            INSERT INTO audit_events (
              organization_id, store_id, entry_id, actor_user_id,
              action, reason, metadata
            )
            SELECT
              '$ORG_ID',
              null,
              null,
              '$OWNER_ID',
              'runtime_settings_saved',
              'vps_reset_owner_auth',
              jsonb_build_object(
                'schemaVersion', 1,
                'settings',
                jsonb_set(
                  COALESCE(latest.metadata->'settings', '{{}}'::jsonb),
                  '{{authConfig}}',
                  COALESCE(latest.metadata->'settings'->'authConfig', '{{}}'::jsonb)
                    || jsonb_build_object(
                      'ownerUsername', '{username_sql}',
                      'ownerPassword', '{password_sql}'
                    ),
                  true
                )
              )
            FROM latest;
            "
            """
        ).strip()
    )

    print_section("Restart PM2 app")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            pm2 restart taqfeelah-app
            pm2 ls
            """
        ).strip()
    )

    print_section("Verify owner login API")
    _, out, err = vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            sleep 3
            curl -sS --max-time 20 -X POST https://www.taqfeelah.com/api/v1/auth/session \\
              -H 'content-type: application/json' \\
              -d '{{"mode":"owner_password","username":"{owner_username.strip().lower()}","password":"{owner_password}"}}'
            """
        ).strip(),
        check=False,
    )
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())


def cmd_enable_ssl(vps: VPS, domain: str, www_domain: str) -> None:
    print_section("Enable SSL certificate via Certbot")
    certbot_cmd = (
        f"certbot --nginx -d {shlex.quote(domain)} -d {shlex.quote(www_domain)} "
        "--agree-tos --register-unsafely-without-email --redirect --non-interactive"
    )
    _, out, err = vps.run(certbot_cmd, check=False)
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print("STDERR:")
        safe_print(err.strip())

    print_section("Post-SSL validation")
    for c in [
        "nginx -t",
        f"curl -I --max-time 20 https://{shlex.quote(domain)} || true",
        f"curl -I --max-time 20 https://{shlex.quote(www_domain)} || true",
        "curl -I --max-time 20 https://hajrix.com || true",
        "curl -I --max-time 20 https://arz-lounge.com || true",
    ]:
        _, out, err = vps.run(c, check=False)
        safe_print(f"$ {c}")
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy Taqfeelah safely to VPS")
    sub = parser.add_subparsers(dest="action", required=True)

    sub.add_parser("audit")

    p_deploy = sub.add_parser("deploy")
    p_deploy.add_argument("--domain", required=True)
    p_deploy.add_argument("--www-domain", required=True)
    p_deploy.add_argument("--local-path", default=".")

    p_verify = sub.add_parser("verify")
    p_verify.add_argument("--domain", required=True)
    p_verify.add_argument("--www-domain", required=True)

    sub.add_parser("baseline-verify")

    p_preflight = sub.add_parser("preflight")
    p_preflight.add_argument("--domain", required=True)
    p_preflight.add_argument("--www-domain", required=True)

    p_deploy_pm2 = sub.add_parser("deploy-pm2")
    p_deploy_pm2.add_argument("--domain", required=True)
    p_deploy_pm2.add_argument("--www-domain", required=True)
    p_deploy_pm2.add_argument("--local-path", default=".")
    p_deploy_pm2.add_argument(
        "--artifact-path",
        default="",
        help="Pre-built tar.gz from CI (includes .next). Skips remote pnpm build.",
    )

    p_deploy_production = sub.add_parser(
        "deploy-production",
        help="TCP probe + preflight + deploy-pm2 + verify in one SSH session",
    )
    p_deploy_production.add_argument("--domain", required=True)
    p_deploy_production.add_argument("--www-domain", required=True)
    p_deploy_production.add_argument("--local-path", default=".")
    p_deploy_production.add_argument(
        "--artifact-path",
        default="",
        help="Pre-built tar.gz from CI (includes .next). Skips remote pnpm build.",
    )

    sub.add_parser("repair-docker")
    sub.add_parser("docker-debug")
    p_pm2_logs = sub.add_parser("pm2-logs")
    p_pm2_logs.add_argument("--app-name", required=True)
    p_ssl = sub.add_parser("enable-ssl")
    p_ssl.add_argument("--domain", required=True)
    p_ssl.add_argument("--www-domain", required=True)

    p_reset_owner = sub.add_parser("reset-owner-auth")
    p_reset_owner.add_argument("--username", default=os.environ.get("AUTH_OWNER_USERNAME", "hajri"))
    p_reset_owner.add_argument("--password", default=os.environ.get("AUTH_OWNER_PASSWORD", "123"))

    args = parser.parse_args()
    artifact_path = getattr(args, "artifact_path", "").strip() or None

    host = get_required_env("VPS_HOST")
    get_required_env("VPS_USER")
    password = os.environ.get("VPS_PASS", "").strip()
    pkey = load_ssh_private_key_from_env()
    if not password and pkey is None:
        raise RuntimeError("Missing VPS auth: set VPS_PASS or VPS_SSH_PRIVATE_KEY")
    port = parse_env_int("VPS_PORT", 22)
    connect_timeout = float(os.environ.get("VPS_CONNECT_TIMEOUT", "20"))
    tcp_probe_timeout = float(os.environ.get("VPS_TCP_PROBE_TIMEOUT", "10"))
    connect_retries = parse_env_int("VPS_CONNECT_RETRIES", 2)
    retry_delay_seconds = float(os.environ.get("VPS_RETRY_DELAY_SECONDS", "8"))

    needs_tcp_preflight = args.action in {"preflight", "deploy-production"}
    if needs_tcp_preflight:
        run_tcp_connectivity_preflight(host, port, tcp_probe_timeout)

    with open_vps_client(
        port=port,
        connect_timeout=connect_timeout,
        connect_retries=connect_retries,
        retry_delay_seconds=retry_delay_seconds,
    ) as vps:
        if args.action == "audit":
            cmd_audit(vps)
        elif args.action == "deploy":
            cmd_deploy(vps, args.domain, args.www_domain, args.local_path)
        elif args.action == "verify":
            cmd_verify(vps, args.domain, args.www_domain)
        elif args.action == "baseline-verify":
            cmd_baseline_verify(vps)
        elif args.action == "preflight":
            cmd_preflight(vps, args.domain, args.www_domain)
        elif args.action == "deploy-pm2":
            cmd_deploy_pm2(
                vps,
                args.domain,
                args.www_domain,
                args.local_path,
                artifact_path=artifact_path,
            )
        elif args.action == "deploy-production":
            cmd_deploy_production(
                vps,
                args.domain,
                args.www_domain,
                args.local_path,
                artifact_path=artifact_path,
            )
        elif args.action == "repair-docker":
            cmd_repair_docker(vps)
        elif args.action == "docker-debug":
            cmd_docker_debug(vps)
        elif args.action == "pm2-logs":
            cmd_pm2_app_logs(vps, args.app_name)
        elif args.action == "enable-ssl":
            cmd_enable_ssl(vps, args.domain, args.www_domain)
        elif args.action == "reset-owner-auth":
            cmd_reset_owner_auth(vps, args.username, args.password)
        else:
            raise RuntimeError(f"Unknown action: {args.action}")

    safe_print("\nCompleted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
