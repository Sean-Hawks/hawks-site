# Current production host

Migrated on 2026-09-10 (Asia/Taipei).

- SSH: `ssh sean8@hawks-wsl` (Tailscale; may require browser authorization)
- Application: `/home/sean8/apps/hawks-agent`
- Node: `/home/sean8/.local/opt/hawks-agent-node/bin/node`
- Service: `hawks-agent.service` (systemd user service)
- Data: `/home/sean8/apps/hawks-agent/.data`
- Credentials: `/home/sean8/apps/hawks-agent/.env` (private; do not print or commit)
- User linger is enabled. The service starts when WSL/systemd starts and survives SSH logout.

```sh
ssh sean8@hawks-wsl 'systemctl --user status hawks-agent --no-pager'
ssh sean8@hawks-wsl 'systemctl --user restart hawks-agent'
ssh sean8@hawks-wsl 'journalctl --user -u hawks-agent -n 50 --no-pager'
```

The Mac background process is stopped. Do not start it while the WSL instance is running. This migration keeps the personalized agent; it does not replace it with the public Discord Ink preview.

The verified cutover backup is private at:
`/Users/hawks/.local/share/hawks-agent-backups/wsl-cutover-20260910-002112.tar.gz`

Back up the complete remote `.data` with the service stopped, and keep `.env` privately. Before rolling back, stop WSL's service and copy its newest data back to the Mac; the Mac copy becomes stale after migration. Only one instance may use this Discord token.

WSL must remain running. Windows shutdown, sleep or `wsl --shutdown` stops the bot. The systemd service does not configure Windows to start WSL automatically after reboot.
