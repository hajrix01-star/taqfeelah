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

REQUIRED_RUNTIME_ENV_KEYS = [
    "APP_MODE",
    "NEXT_PUBLIC_APP_MODE",
    "DATABASE_URL",
    "AUTH_SESSION_SECRET",
    "AUTH_ORGANIZATION_ID",
    "AUTH_OWNER_USER_ID",
    "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED",
    "NEXT_PUBLIC_ENTRIES_API_ENABLED",
    "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID",
    "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID",
    "NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP",
    "NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP",
    "NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP",
]


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


def build_production_env_payload() -> str:
    missing_required = [key for key in REQUIRED_RUNTIME_ENV_KEYS if not os.environ.get(key)]
    if missing_required:
        raise RuntimeError(
            "Missing required production environment values for runtime strict mode: "
            + ", ".join(missing_required)
        )
    lines: list[str] = []
    for key in PRODUCTION_ENV_KEYS:
        value = os.environ.get(key)
        if value is None or value == "":
            continue
        normalized = value.replace("\r\n", "\n").replace("\n", "\\n")
        lines.append(f"{key}={normalized}")
    if not lines:
        return ""
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
        f"curl -fsS --max-time 20 https://{shlex.quote(domain)}/api/v1/auth/session",
        f"curl -I --max-time 15 https://{shlex.quote(www_domain)} || true",
        "curl -I --max-time 15 https://hajrix.com || true",
        "curl -I --max-time 15 https://arz-lounge.com || true",
    ]
    for c in verify_cmds:
        print_section(c)
        code, out, err = vps.run(c, check=False)
        if out.strip():
            safe_print(out.strip())
        if err.strip():
            safe_print("STDERR:")
            safe_print(err.strip())
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

    print_section("Upload application source")
    archive_path = build_source_archive(local_path)
    try:
        vps.upload(archive_path, remote_archive)
    finally:
        try:
            os.remove(archive_path)
        except OSError:
            pass

    env_payload = build_production_env_payload()
    if env_payload:
        print_section("Write production environment file")
        vps.run(
            textwrap.dedent(
                f"""
                set -euo pipefail
                mkdir -p {shlex.quote(app_dir)}
                printf '%s' {shlex.quote(env_payload)} | base64 -d > {shlex.quote(app_dir)}/.env.production
                """
            ).strip()
        )
    else:
        print_section("No deployment env payload provided")
        safe_print("Proceeding without writing .env.production on VPS.")

    print_section("Install dependencies and build app")
    vps.run(
        textwrap.dedent(
            f"""
            set -euo pipefail
            mkdir -p {shlex.quote(app_dir)}
            rm -rf {shlex.quote(app_dir)}/*
            tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(app_dir)}
            rm -f {shlex.quote(remote_archive)}
            cd {shlex.quote(app_dir)}
            npm install
            npm run build
            """
        ).strip()
    )

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
        else:
            raise RuntimeError(f"Unknown action: {args.action}")

    safe_print("\nCompleted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
