
# 003 — SSH Cheatsheet

> 🔐 SSH (Secure Shell) is how you securely connect to remote servers and authenticate with GitHub.
> This cheatsheet covers everything you need for the bootcamp.

---

## Table of Contents

1. [SSH Key Generation](#1-ssh-key-generation)
2. [Adding SSH Key to GitHub](#2-adding-ssh-key-to-github)
3. [Adding SSH Key to DigitalOcean VPS](#3-adding-ssh-key-to-digitalocean-vps)
4. [SSH Config File](#4-ssh-config-file)
5. [Common SSH Commands](#5-common-ssh-commands)
6. [Troubleshooting](#6-troubleshooting)
7. [Quick Reference Card](#7-quick-reference-card)

---

## 1. SSH Key Generation

### 1.1 Understanding SSH Keys

SSH uses a **key pair**:
- **Private key** (`~/.ssh/id_ed25519`) — stays on YOUR machine. Never share this.
- **Public key** (`~/.ssh/id_ed25519.pub`) — goes on remote servers/GitHub. Safe to share.

Think of it like a lock and key:
- The **public key** is the lock (you put it on doors you want to open)
- The **private key** is the key (only you have it)

### 1.2 Generate a Key (All Platforms)

> Works identically on **macOS Terminal**, **WSL Ubuntu**, and **Windows PowerShell**.

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**Prompts:**
```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/user/.ssh/id_ed25519): [Press Enter]
Enter passphrase (empty for no passphrase): [Press Enter or set passphrase]
Enter same passphrase again: [Press Enter]
```

**Output:**
```
Your identification has been saved in /home/user/.ssh/id_ed25519
Your public key has been saved in /home/user/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:abc123... your_email@example.com
```

### 1.3 Start SSH Agent & Add Key

**macOS / WSL (Linux):**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**Windows PowerShell (native, if not using WSL):**
```powershell
# Start the ssh-agent service
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# Add your key
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

### 1.4 View Your Public Key

**macOS / WSL:**
```bash
cat ~/.ssh/id_ed25519.pub
```

**Windows PowerShell:**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Example output:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHx7...long_string...abc your_email@example.com
```

### 1.5 Check Existing Keys

Before generating, check if you already have keys:

```bash
ls -la ~/.ssh/
```

Look for files like:
- `id_ed25519` / `id_ed25519.pub` (Ed25519 — recommended)
- `id_rsa` / `id_rsa.pub` (RSA — older but still works)

If you already have a key pair, you can reuse them.

---

## 2. Adding SSH Key to GitHub

### 2.1 Copy Your Public Key

**macOS (copy to clipboard):**
```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

**WSL/Linux (copy to clipboard):**
```bash
cat ~/.ssh/id_ed25519.pub | clip.exe
```

**Or just display and manually select+copy:**
```bash
cat ~/.ssh/id_ed25519.pub
```

### 2.2 Add to GitHub

1. Go to: **[https://github.com/settings/ssh/new](https://github.com/settings/ssh/new)**
2. **Title:** `Bootcamp Laptop` (or any descriptive name)
3. **Key type:** `Authentication Key`
4. **Key:** Paste your public key
5. Click **Add SSH key**

### 2.3 Test GitHub Connection

```bash
ssh -T git@github.com
```

**✅ Success:**
```
Hi YOUR_USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```

**❌ Failure:**
```
Permission denied (publickey).
```
→ See [Troubleshooting Section 6.1](#61-permission-denied-publickey)

### 2.4 Clone Using SSH (not HTTPS)

Once your key is set up, always clone using SSH URLs:

```bash
# ✅ SSH (use this)
git clone git@github.com:proxeon/bootcamp.git

# ❌ HTTPS (avoid — requires password/token each time)
git clone https://github.com/proxeon/bootcamp.git
```

---

## 3. Adding SSH Key to DigitalOcean VPS

### 3.1 Method A: Add Key During Droplet Creation (Recommended)

When creating a new Droplet on DigitalOcean:

1. In the **Authentication** section, select **SSH Keys**
2. Click **New SSH Key**
3. Paste your public key (`cat ~/.ssh/id_ed25519.pub`)
4. Give it a name (e.g., `My Laptop`)
5. Click **Add SSH Key**
6. Continue creating the Droplet

Now you can immediately SSH into the server:
```bash
ssh root@YOUR_DROPLET_IP
```

### 3.2 Method B: Add Key After Droplet Creation

If you already created a Droplet with password auth:

**From your local machine:**
```bash
ssh-copy-id root@YOUR_DROPLET_IP
```

You'll be prompted for the root password (the one DigitalOcean emailed you), then your key will be installed.

**Or manually:**
```bash
# SSH in with password first
ssh root@YOUR_DROPLET_IP

# On the VPS, create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste the content of id_ed25519.pub)
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... your_email" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3 Test VPS Connection

```bash
ssh root@YOUR_DROPLET_IP
```

**✅ Success:** You see the server welcome message and a `root@droplet:~#` prompt.

**First-time connection** — you'll see:
```
The authenticity of host '123.456.78.90' can't be established.
ED25519 key fingerprint is SHA256:abc123...
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

Type `yes` and press Enter. This is normal for first connections.

### 3.4 Add Key to DigitalOcean Account (for future Droplets)

1. Go to: **[https://cloud.digitalocean.com/account/security](https://cloud.digitalocean.com/account/security)**
2. Scroll to **SSH Keys**
3. Click **Add SSH Key**
4. Paste your public key and name it

Now every new Droplet you create will automatically include this key.

---

## 4. SSH Config File

> The SSH config file (`~/.ssh/config`) lets you create shortcuts for SSH connections.
> Instead of typing `ssh root@167.71.123.45`, you can just type `ssh vps`.

### 4.1 Create/Edit the Config File

```bash
nano ~/.ssh/config
```

Or with any editor:
```bash
code ~/.ssh/config    # VS Code
vim ~/.ssh/config     # Vim
```

### 4.2 Basic Config Structure

```ssh-config
# ─── GitHub ─────────────────────────────────────────
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes

# ─── DigitalOcean VPS ───────────────────────────────
Host vps
    HostName 167.71.123.45
    User root
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes

# ─── Alternative: VPS with custom port ──────────────
Host vps-secure
    HostName 167.71.123.45
    User root
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

### 4.3 Set Correct Permissions

```bash
chmod 600 ~/.ssh/config
```

### 4.4 Usage After Config

```bash
# Before config:
ssh root@167.71.123.45

# After config:
ssh vps
```

```bash
# SCP files using alias
scp ./file.txt vps:/root/file.txt

# Run remote command
ssh vps "docker ps"
```

### 4.5 Multiple Keys for Different Services

If you have separate keys for GitHub and your VPS:

```ssh-config
# GitHub uses one key
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github

# VPS uses a different key
Host vps
    HostName 167.71.123.45
    User root
    IdentityFile ~/.ssh/id_ed25519_vps
```

### 4.6 Wildcard Config (apply to all hosts)

```ssh-config
# Apply to all connections
Host *
    AddKeysToAgent yes
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

`ServerAliveInterval` prevents SSH from disconnecting due to inactivity.

---

## 5. Common SSH Commands

### 5.1 Connecting

| Command | Description |
|---------|-------------|
| `ssh root@IP` | Connect to server as root |
| `ssh user@IP` | Connect as specific user |
| `ssh -p 2222 root@IP` | Connect on custom port |
| `ssh vps` | Connect using config alias |
| `ssh -v root@IP` | Verbose mode (for debugging) |
| `ssh -vvv root@IP` | Extra verbose (maximum debugging) |

### 5.2 Key Management

| Command | Description |
|---------|-------------|
| `ssh-keygen -t ed25519 -C "email"` | Generate new key pair |
| `ssh-keygen -t ed25519 -f ~/.ssh/mykey` | Generate with custom filename |
| `ssh-add ~/.ssh/id_ed25519` | Add key to agent |
| `ssh-add -l` | List keys in agent |
| `ssh-add -D` | Remove all keys from agent |
| `ssh-keygen -R hostname` | Remove host from known_hosts |
| `ssh-keygen -l -f ~/.ssh/id_ed25519.pub` | Show key fingerprint |

### 5.3 File Transfer (SCP)

| Command | Description |
|---------|-------------|
| `scp file.txt root@IP:/path/` | Upload file to server |
| `scp root@IP:/path/file.txt .` | Download file from server |
| `scp -r folder/ root@IP:/path/` | Upload folder recursively |
| `scp -P 2222 file.txt root@IP:/path/` | SCP with custom port |

### 5.4 Remote Command Execution

```bash
# Run single command on remote server
ssh vps "docker ps"

# Run multiple commands
ssh vps "cd ~/kanban-prod && docker compose ps"

# Run script remotely
ssh vps 'bash -s' < local-script.sh
```

### 5.5 SSH Tunneling (Port Forwarding)

```bash
# Forward local port 8080 to remote server's port 80
ssh -L 8080:localhost:80 root@IP

# Access remote database locally (e.g., PostgreSQL on VPS)
ssh -L 5433:localhost:5432 root@IP
# Then connect to localhost:5433 with your local DB client

# Reverse tunnel: make your local port 3000 accessible on the VPS
ssh -R 9000:localhost:3000 root@IP
```

---

## 6. Troubleshooting

### 6.1 "Permission denied (publickey)"

**Diagnosis:**
```bash
ssh -vT git@github.com
```

Look for lines like:
```
debug1: Offering public key: /home/user/.ssh/id_ed25519
debug1: Server accepts key: /home/user/.ssh/id_ed25519
```

**Common causes & fixes:**

| Cause | Fix |
|-------|-----|
| Key not added to agent | `ssh-add ~/.ssh/id_ed25519` |
| Wrong key on GitHub | Re-check `cat ~/.ssh/id_ed25519.pub` matches GitHub |
| SSH agent not running | `eval "$(ssh-agent -s)"` then re-add key |
| Wrong file permissions | See [Section 6.5](#65-file-permission-issues) |
| Multiple keys, wrong one offered | Use SSH config with explicit `IdentityFile` |

### 6.2 "Host key verification failed"

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@ WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
```

**Cause:** The server's fingerprint changed (e.g., you recreated the Droplet).

**Fix:**
```bash
# Remove the old fingerprint
ssh-keygen -R YOUR_DROPLET_IP

# Or remove specific line from known_hosts
nano ~/.ssh/known_hosts
# Delete the line containing the IP address
```

Then try connecting again — you'll be asked to accept the new fingerprint.

### 6.3 "Connection refused" or "Connection timed out"

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Connection refused | SSH not running on server | Check server status on DigitalOcean dashboard |
| Connection refused | Wrong port | Verify port (default 22): `ssh -p 22 root@IP` |
| Connection timed out | Firewall blocking | Check VPS firewall: `ufw status` |
| Connection timed out | Wrong IP address | Verify IP on DigitalOcean dashboard |
| Connection timed out | Server is down | Reboot via DigitalOcean console |

### 6.4 "Too many authentication failures"

**Cause:** SSH agent is trying multiple keys and failing.

**Fix:**
```bash
# Specify exact key to use
ssh -i ~/.ssh/id_ed25519 root@IP

# Or clear agent and add only the right key
ssh-add -D
ssh-add ~/.ssh/id_ed25519
```

### 6.5 File Permission Issues

SSH is strict about file permissions. Fix with:

```bash
# Fix .ssh directory
chmod 700 ~/.ssh

# Fix private key
chmod 600 ~/.ssh/id_ed25519

# Fix public key
chmod 644 ~/.ssh/id_ed25519.pub

# Fix config file
chmod 600 ~/.ssh/config

# Fix authorized_keys (on server)
chmod 600 ~/.ssh/authorized_keys

# Fix ownership (if needed)
chown -R $USER:$USER ~/.ssh
```

**If permissions are wrong, SSH will silently refuse to use the key.**

### 6.6 WSL-Specific Issues

**Problem:** SSH key generated in Windows is not accessible in WSL (or vice versa).

**Fix:** Generate and use keys **inside WSL only**. Windows and WSL have separate filesystems.

```bash
# Check where you are
pwd
# Should be /home/yourname (WSL) not /mnt/c/Users/... (Windows)

# Your WSL SSH directory
ls ~/.ssh/
# Should show id_ed25519 and id_ed25519.pub
```

> ⚠️ Never store SSH keys on the Windows filesystem (`/mnt/c/...`) and use them from WSL. The file permissions will be wrong and SSH will ignore them.

### 6.7 "Agent has no identities" or Key Not Persisting

**Problem:** SSH key disappears after terminal restart.

**Fix for macOS:** Add to `~/.ssh/config`:
```ssh-config
Host *
    UseKeychain yes
    AddKeysToAgent yes
    IdentityFile ~/.ssh/id_ed25519
```

**Fix for WSL/Linux:** Add to `~/.bashrc`:
```bash
# Auto-start SSH agent
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)" > /dev/null 2>&1
    ssh-add ~/.ssh/id_ed25519 > /dev/null 2>&1
fi
```

Then reload:
```bash
source ~/.bashrc
```

### 6.8 Testing Connection Step by Step

When something isn't working, debug systematically:

```bash
# Step 1: Check if key exists
ls -la ~/.ssh/id_ed25519

# Step 2: Check permissions
stat -c "%a %U" ~/.ssh/id_ed25519
# Should show: 600 yourusername

# Step 3: Check if agent is running
echo $SSH_AUTH_SOCK
# Should show a path, not empty

# Step 4: Check if key is loaded in agent
ssh-add -l
# Should show your key fingerprint

# Step 5: Verbose connection test
ssh -vvv root@YOUR_IP 2>&1 | head -50

# Step 6: Check if port is reachable
nc -zv YOUR_IP 22
# Should show: Connection to YOUR_IP 22 port [tcp/ssh] succeeded!
```

---

## 7. Quick Reference Card

### Key Generation Cheat Sheet

```bash
# Generate key
ssh-keygen -t ed25519 -C "email@example.com"

# Start agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# View public key (copy this to GitHub/VPS)
cat ~/.ssh/id_ed25519.pub

# Test GitHub
ssh -T git@github.com

# Test VPS
ssh root@YOUR_DROPLET_IP
```

### SSH Config Template

```ssh-config
# ~/.ssh/config

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519

Host vps
    HostName YOUR_DROPLET_IP
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

### Permissions Cheat Sheet

```
~/.ssh/              → 700 (drwx------)
~/.ssh/id_ed25519    → 600 (-rw-------)
~/.ssh/id_ed25519.pub → 644 (-rw-r--r--)
~/.ssh/config        → 600 (-rw-------)
~/.ssh/known_hosts   → 644 (-rw-r--r--)
~/.ssh/authorized_keys → 600 (-rw-------)  [on server]
```

### Emergency Fixes

```bash
# "I can't connect to anything"
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519

# "My known_hosts is messed up"
ssh-keygen -R HOSTNAME_OR_IP

# "Permission denied on everything"
chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519 && chmod 644 ~/.ssh/id_ed25519.pub

# "I need to start over"
rm -rf ~/.ssh && ssh-keygen -t ed25519 -C "email@example.com"
```

---

## Diagram: SSH Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR LOCAL MACHINE                            │
│                                                                   │
│  ~/.ssh/id_ed25519      (Private Key - NEVER leaves this box)    │
│  ~/.ssh/id_ed25519.pub  (Public Key  - copy to remote services)  │
│                                                                   │
└──────────────┬──────────────────────────┬────────────────────────┘
               │                          │
               │ ssh -T git@github.com    │ ssh root@DROPLET_IP
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│        GITHUB            │  │      DIGITALOCEAN VPS             │
│                          │  │                                    │
│  Settings > SSH Keys     │  │  ~/.ssh/authorized_keys           │
│  (your public key here)  │  │  (your public key here)           │
│                          │  │                                    │
│  ✅ Allows: git clone    │  │  ✅ Allows: full server access    │
│  ✅ Allows: git push     │  │  ✅ Allows: docker, files, etc.   │
│  ✅ Allows: git pull     │  │                                    │
└──────────────────────────┘  └──────────────────────────────────┘
```

---

## Bootcamp Day: Quick Setup Summary

If you followed the [Pre-Bootcamp Setup Guide (000)](./000-pre-bootcamp-setup.md), you should already have:
- ✅ SSH key generated
- ✅ Key added to GitHub
- ✅ `ssh -T git@github.com` works

**On bootcamp day, you'll additionally:**
1. Create a DigitalOcean Droplet (add your SSH key during creation)
2. Add VPS entry to your `~/.ssh/config`
3. SSH into VPS and deploy the application

```bash
# After creating Droplet, add to config:
echo "
Host vps
    HostName YOUR_NEW_DROPLET_IP
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
" >> ~/.ssh/config

# Then simply:
ssh vps
```
