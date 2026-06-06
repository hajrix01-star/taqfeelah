#!/usr/bin/env python3
"""
Safe deployment helper for Taqfeelah on Hostinger VPS.

Usage examples:
  python scripts/vps_deploy.py audit
  python scripts/vps_deploy.py deploy --domain taqfeelah.com --www-domain www.taqfeelah.com
  python scripts/vps_deploy.py verify --domain taqfeelah.com --www-domain www.taqfeelah.com

Environment variables:
  VPS_HOST, VPS_USER, VPS_PASS
  VPS_PORT (optional, default: 22)
  VPS_CONNECT_TIMEOUT (optional seconds, default: 25)
  VPS_CONNECT_RETRIES (optional, default: 3)
  VPS_RETRY_DELAY_SECONDS (optional seconds, default: 5)
"""

from __future__ import annotations

import argparse
import base64
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
    "APP_MODE",
    "NEXT_PUBLIC_APP_MODE",
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
]

# Bootstrap defaults align with scripts/seed-closeouts-foundation.mjs so deploy can
# proceed without GitHub app-env secrets. DATABASE_URL must still come from secrets
# or an existing VPS .env.production file.
PRODUCTION_ENV_BOOTSTRAP_DEFAULTS: dict[str, str] = {
    "APP_MODE": "production",
    "NEXT_PUBLIC_APP_MODE": "production",
    "AUTH_SESSION_SECRET": "taqfeelah-prod-bootstrap-session-secret-v1",
    "AUTH_SESSION_COOKIE_NAME": "taqfeelah_session",
    "AUTH_ORGANIZATION_ID": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
    "AUTH_OWNER_USER_ID": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED": "true",
    "NEXT_PUBLIC_ENTRIES_API_ENABLED": "true",
    "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
    "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    "NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP": (
        '{"shami":"302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"}'
    ),
    "NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP": (
        '{"owner":"e8f3e35b-6051-4da3-8b10-979700c2f00f",'
        '"ahmed":"4cf1450d-08d8-4ca1-b180-1c2642174a79",'
        '"sara":"85f696d6-f655-4f2d-9f56-1f13c2f4c66c"}'
    ),
    "NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP": (
        '{"cash":"9bc40d4f-c773-4ba3-87db-b8bb1467dafb",'
        '"card":"bb16ea8f-8abf-4ca9-ab0d-e3a8f69f8db1",'
        '"online":"f0f8dd28-4fbe-4bf2-9074-2be703f10ccd"}'
    ),
    "AUTH_EMPLOYEE_PIN_MAP": '{"ahmed":"1234","sara":"1234"}',
}

VPS_POSTGRES_CONTAINER = "taqfeelah-postgres"
VPS_POSTGRES_USER = "taqfeelah"
VPS_POSTGRES_PASSWORD = "taqfeelah_prod_local_v1"
VPS_POSTGRES_DB = "taqfeelah"
VPS_POSTGRES_PORT = 5433


def safe_print(value: str) -> None:
    # Keep script resilient on Windows shells with legacy codepages.
    try:
        print(value)
    except UnicodeEncodeError:
        sys.stdout.buffer.write((value + "\n").encode("utf-8", errors="replace"))
        sys.stdout.flush()


class VPS:
    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        *,
        port: int = 22,
        connect_timeout: float = 25,
        connect_retries: int = 3,
        retry_delay_seconds: float = 5,
    ) -> None:
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.connect_timeout = connect_timeout
        self.connect_retries = max(1, connect_retries)
        self.retry_delay_seconds = max(0.0, retry_delay_seconds)
        self.client: paramiko.SSHClient | None = None

    def _new_client(self) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        return client

    def _resolved_endpoints(self) -> list[tuple[socket.AddressFamily, tuple]]:
        endpoints: list[tuple[socket.AddressFamily, tuple]] = []
        seen: set[tuple[socket.AddressFamily, str, int]] = set()
        for family, _, _, _, sockaddr in socket.getaddrinfo(
            self.host,
            self.port,
            type=socket.SOCK_STREAM,
        ):
            ip = sockaddr[0]
            port = sockaddr[1]
            key = (family, ip, port)
            if key in seen:
                continue
            seen.add(key)
            endpoints.append((family, sockaddr))
        if not endpoints:
            raise RuntimeError(f"No SSH endpoints resolved for {self.host}:{self.port}")
        return endpoints

    def __enter__(self) -> "VPS":
        endpoints = self._resolved_endpoints()
        errors: list[str] = []
        for attempt in range(1, self.connect_retries + 1):
            for family, sockaddr in endpoints:
                sock: socket.socket | None = None
                client = self._new_client()
                ip = sockaddr[0]
                try:
                    sock = socket.socket(family, socket.SOCK_STREAM)
                    sock.settimeout(self.connect_timeout)
                    sock.connect(sockaddr)
                    client.connect(
                        self.host,
                        port=self.port,
                        username=self.user,
                        password=self.password,
                        sock=sock,
                        timeout=self.connect_timeout,
                        banner_timeout=self.connect_timeout,
                        auth_timeout=self.connect_timeout,
                        look_for_keys=False,
                        allow_agent=False,
                    )
                    self.client = client
                    return self
                except Exception as exc:
                    errors.append(f"attempt {attempt}, endpoint {ip}:{self.port}: {exc!r}")
                    try:
                        client.close()
                    except Exception:
                        pass
                    try:
                        if sock is not None:
                            sock.close()
                    except Exception:
                        pass
            if attempt < self.connect_retries:
                time.sleep(self.retry_delay_seconds)

        unique_ips = ", ".join(sockaddr[0] for _, sockaddr in endpoints)
        details = "\n".join(errors[-6:])
        raise RuntimeError(
            "Unable to establish SSH connection to "
            f"{self.host}:{self.port} after {self.connect_retries} retries.\n"
            f"Resolved endpoints: {unique_ips}\n"
            "Common causes: blocked port 22, incorrect VPS_HOST, or provider firewall rules.\n"
            f"Last failures:\n{details}"
        )

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None

    def run(self, command: str, check: bool = True) -> tuple[int, str, str]:
        if self.client is None:
            raise RuntimeError("VPS SSH client is not connected")
        stdin, stdout, stderr = self.client.exec_command(command, get_pty=True)
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        code = stdout.channel.recv_exit_status()
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


def get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


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

    if not merged.get("DATABASE_URL"):
        raise RuntimeError(
            "DATABASE_URL is required for production deploy. "
            "Set the GitHub secret DATABASE_URL or ensure /opt/taqfeelah/.env.production "
            "already exists on the VPS with a valid DATABASE_URL."
        )
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
    for key in PRODUCTION_ENV_KEYS:
        value = merged_env.get(key)
        if not value:
            continue
        normalized = value.replace("\r\n", "\n").replace("\n", "\\n")
        lines.append(f"{key}={normalized}")
    payload = ("\n".join(lines) + "\n").encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


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


def cmd_verify(vps: VPS, domain: str, www_domain: str) -> None:
    verify_cmds = [
        "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
        "nginx -t",
        f"curl -I --max-time 15 http://{shlex.quote(domain)} || true",
        f"curl -I --max-time 15 https://{shlex.quote(domain)} || true",
        (
            f"curl -sS --max-time 20 -o /tmp/taqfeelah-auth-session.json "
            f"-w '%{{http_code}}' https://{shlex.quote(domain)}/api/v1/auth/session"
        ),
        f"curl -I --max-time 15 https://{shlex.quote(www_domain)} || true",
        "curl -I --max-time 15 https://hajrix.com || true",
        "curl -I --max-time 15 https://arz-lounge.com || true",
    ]
    auth_status_code: str | None = None
    for c in verify_cmds:
        print_section(c)
        code, out, err = vps.run(c, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())
        if "/api/v1/auth/session" in c:
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
        if code != 0:
            raise RuntimeError(f"Verification command failed ({code}): {c}")


def cmd_deploy_pm2(vps: VPS, domain: str, www_domain: str, local_path: str) -> None:
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
    archive_path = build_source_archive(local_path)
    try:
        vps.upload(archive_path, remote_archive)
    finally:
        try:
            os.remove(archive_path)
        except OSError:
            pass

    print_section("Extract application source")
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

    print_section("Install dependencies and build app")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            npm install -g pnpm@9.15.9
            pnpm install --frozen-lockfile
            pnpm run build
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
            pnpm exec drizzle-kit push --force
            """
        ).strip()
    )

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
    organization_id = os.environ.get(
        "AUTH_ORGANIZATION_ID",
        os.environ.get("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-8f637f0a9e1"),
    )
    owner_user_id = os.environ.get(
        "AUTH_OWNER_USER_ID",
        os.environ.get("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f"),
    )
    username_sql = owner_username.strip().lower().replace("'", "''")
    password_sql = owner_password.replace("'", "''")

    print_section("Diagnose current owner auth")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            cd {shlex.quote(app_dir)}
            set -a
            . ./.env.production
            set +a
            node -e "const u=new URL(process.env.DATABASE_URL); console.log('DATABASE host:', u.host)"
            psql "$DATABASE_URL" -c "
            SELECT created_at, reason,
                   metadata->'settings'->'authConfig'->>'ownerUsername' AS username,
                   metadata->'settings'->'authConfig'->>'ownerPassword' AS password
            FROM audit_events
            WHERE organization_id = '{organization_id}'
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
            psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
            WITH latest AS (
              SELECT metadata
              FROM audit_events
              WHERE organization_id = '{organization_id}'
                AND action = 'runtime_settings_saved'
              ORDER BY created_at DESC
              LIMIT 1
            )
            INSERT INTO audit_events (
              organization_id, store_id, entry_id, actor_user_id,
              action, reason, metadata
            )
            SELECT
              '{organization_id}',
              null,
              null,
              '{owner_user_id}',
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

    p_deploy_pm2 = sub.add_parser("deploy-pm2")
    p_deploy_pm2.add_argument("--domain", required=True)
    p_deploy_pm2.add_argument("--www-domain", required=True)
    p_deploy_pm2.add_argument("--local-path", default=".")

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

    host = get_required_env("VPS_HOST")
    user = get_required_env("VPS_USER")
    password = get_required_env("VPS_PASS")
    port = int(os.environ.get("VPS_PORT", "22"))
    connect_timeout = float(os.environ.get("VPS_CONNECT_TIMEOUT", "25"))
    connect_retries = int(os.environ.get("VPS_CONNECT_RETRIES", "3"))
    retry_delay_seconds = float(os.environ.get("VPS_RETRY_DELAY_SECONDS", "5"))

    with VPS(
        host,
        user,
        password,
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
        elif args.action == "deploy-pm2":
            cmd_deploy_pm2(vps, args.domain, args.www_domain, args.local_path)
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
