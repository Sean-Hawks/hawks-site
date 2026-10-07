#!/usr/bin/env python3
"""Add a loopback-only comments relay to the existing Hawks WSL mail server.

Requires existing Postfix and Rspamd DKIM signing for source 127.2.4.7.
--probe temporarily holds mail to probe@hawks-comments.invalid for inspection.
Run again without --probe to remove the temporary probe policy.
"""
import argparse
import datetime
import os
from pathlib import Path
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--probe", action="store_true")
args = parser.parse_args()
if os.geteuid() != 0:
    raise SystemExit("Run as root on the existing WSL mail server.")
for command in ["postconf", "rspamadm"]:
    if not shutil.which(command):
        raise SystemExit(f"Existing {command} installation required.")
if subprocess.check_output(["postconf", "-h", "mydomain"], text=True).strip() != "hawks.tw":
    raise SystemExit("This configuration targets the existing hawks.tw server.")

master = Path("/etc/postfix/master.cf")
start = "# BEGIN HAWKS COMMENTS RELAY\n"
end = "# END HAWKS COMMENTS RELAY\n"
existing = master.read_text()
if start in existing:
    before, block = existing.split(start, 1)
    _, after = block.split(end, 1)
    existing = before + after
backup = Path("/etc/hawks-comments/mail-backups") / datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
backup.mkdir(parents=True, mode=0o700)
for name in ["main.cf", "master.cf"]:
    shutil.copy2(Path("/etc/postfix") / name, backup / name)
    (backup / name).chmod(0o600)

sender_map = Path("/etc/postfix/hawks-comments-senders")
sender_map.write_text("/^comments@hawks\\.tw$/ OK\n/.*/ REJECT Only the comments sender is allowed\n")
sender_map.chmod(0o644)
lines = [
    "127.0.0.1:2526 inet n - n - - smtpd",
    "  -o syslog_name=postfix/comments",
    "  -o mynetworks=127.2.4.7/32",
    "  -o smtpd_client_restrictions=permit_mynetworks,reject",
    "  -o smtpd_relay_restrictions=permit_mynetworks,reject",
    "  -o smtpd_sender_restrictions=check_sender_access,regexp:/etc/postfix/hawks-comments-senders",
    "  -o smtpd_sasl_auth_enable=no",
    "  -o smtpd_tls_security_level=none",
    "  -o milter_macro_daemon_name=ORIGINATING",
    "  -o milter_default_action=tempfail",
]
probe_map = Path("/etc/postfix/hawks-comments-probe")
if args.probe:
    probe_map.write_text("/^probe@hawks-comments\\.invalid$/ HOLD Local comments transport probe\n")
    probe_map.chmod(0o644)
    lines.append("  -o smtpd_recipient_restrictions=check_recipient_access,regexp:/etc/postfix/hawks-comments-probe")
    lines.append("  -o smtpd_reject_unlisted_recipient=no")
else:
    probe_map.unlink(missing_ok=True)
master.write_text(existing.rstrip() + "\n\n" + start + "\n".join(lines) + "\n" + end)

# Existing inet services bind the Tailscale address. Retry startup if that
# address is not ready yet after Windows starts WSL.
dropin = Path("/etc/systemd/system/postfix@-.service.d/hawks-comments-retry.conf")
dropin.parent.mkdir(parents=True, exist_ok=True)
if dropin.exists():
    shutil.copy2(dropin, backup / dropin.name)
dropin.write_text("[Unit]\nWants=tailscaled.service\nAfter=tailscaled.service network-online.target\n\n[Service]\nRestart=on-failure\nRestartSec=15s\n")
# Refresh DNS inside the Postfix chroot after WSL/Tailscale changes resolvers.
shutil.copyfile("/etc/resolv.conf", "/var/spool/postfix/etc/resolv.conf")
Path("/var/spool/postfix/etc/resolv.conf").chmod(0o644)
subprocess.run(["postfix", "check"], check=True)
subprocess.run(["systemctl", "daemon-reload"], check=True)
subprocess.run(["systemctl", "reload", "postfix@-.service"], check=True)
print("Comments loopback relay configured; probe hold: " + str(args.probe))
print("Backup: " + str(backup))
