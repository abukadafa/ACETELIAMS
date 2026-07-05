# 🚀 ACETEL IAMS - Ubuntu Proxmox Deployment Guide

**Last Updated:** July 2026  
**Target Environment:** Proxmox VM with Ubuntu 22.04 LTS  
**Production Ready:** Yes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Ubuntu VM Setup on Proxmox](#ubuntu-vm-setup-on-proxmox)
3. [Docker Installation](#docker-installation)
4. [Clone & Configure](#clone--configure)
5. [Environment Setup](#environment-setup)
6. [Deployment](#deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements (Proxmox VM)
- **CPU:** 4 cores (minimum 2)
- **RAM:** 8GB (minimum 4GB)
- **Storage:** 50GB SSD (minimum 20GB)
- **Network:** 1 Gbps connection to institutional network

### Software Requirements
- Proxmox VE 7.x or 8.x
- Ubuntu 22.04 LTS ISO
- Git CLI
- Basic Linux knowledge

---

## Ubuntu VM Setup on Proxmox

### Step 1: Create VM in Proxmox

```bash
# In Proxmox UI:
# 1. Click "Create VM"
# 2. Set name: acetel-prod-vm
# 3. Set VMID: 100
# 4. Allocate resources:
#    - Cores: 4
#    - Memory: 8192 MB
#    - Disk: 50 GB (SSD if possible)
# 5. Network: Bridged (vmbr0)
# 6. ISO: ubuntu-22.04-live-server-amd64.iso
```

### Step 2: Install Ubuntu 22.04 LTS

```bash
# Boot VM and follow Ubuntu installer:
# 1. Language: English
# 2. Keyboard: Your region
# 3. Network: DHCP (or static IP)
# 4. Storage: Use entire disk (default)
# 5. Profile Setup:
#    - Your name: ACETEL Admin
#    - Server name: acetel-prod
#    - Username: acetel
#    - Password: [Strong password]
# 6. SSH: Enable OpenSSH server
# 7. Snaps: Skip (optional)
# 8. Reboot
```

### Step 3: Post-Install System Configuration

```bash
# Connect to VM (via SSH or Proxmox console)
ssh acetel@<vm-ip>

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
  curl \
  wget \
  git \
  nano \
  htop \
  net-tools \
  ufw \
  fail2ban

# Configure firewall (UFW)
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Application
sudo ufw status

# Set timezone
sudo timedatectl set-timezone Africa/Lagos

# Configure fail2ban for security
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Docker Installation

### Step 1: Install Docker Engine

```bash
# Remove old Docker versions
sudo apt remove docker docker.io containerd runc

# Add Docker repository
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 2: Configure Docker for Production

```bash
# Add user to docker group (allows running without sudo)
sudo usermod -aG docker acetel

# Log out and back in for group changes to take effect
exit
ssh acetel@<vm-ip>

# Verify docker access
docker ps

# Configure Docker daemon for production
sudo nano /etc/docker/daemon.json
```

**Add to daemon.json:**

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "metrics-addr": "127.0.0.1:9323",
  "experimental": false,
  "insecure-registries": []
}
```

```bash
# Restart Docker daemon
sudo systemctl restart docker
```

### Step 3: Install Docker Compose Standalone

```bash
# Download latest docker-compose
sudo curl -L \
  "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

---

## Clone & Configure

### Step 1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone ACETELIAMS repo
git clone https://github.com/abukadafa/ACETELIAMS.git
cd ACETELIAMS

# Checkout production branch (if available)
git checkout main
```

### Step 2: Create Deployment Directory

```bash
# Create production directory
sudo mkdir -p /opt/acetel-iams
sudo chown -R acetel:acetel /opt/acetel-iams

# Create data directories
mkdir -p /opt/acetel-iams/uploads
mkdir -p /opt/acetel-iams/backups
mkdir -p /opt/acetel-iams/mongodb-data

# Set permissions
chmod -R 755 /opt/acetel-iams
```

### Step 3: Copy Files to Production Directory

```bash
# Copy repository to production location
cp -r ~/ACETELIAMS/* /opt/acetel-iams/
cd /opt/acetel-iams

# Verify structure
ls -la
# Should show: client/, server/, docker-compose.prod.yml, etc.
```

---

## Environment Setup

### Step 1: Create .env File

```bash
# Create environment file
nano /opt/acetel-iams/.env.production

# Or copy from example
cp /opt/acetel-iams/.env.production.example /opt/acetel-iams/.env.production
```

### Step 2: Generate Secure Secrets

```bash
# Generate JWT secrets (copy output)
openssl rand -base64 32

# Generate MongoDB root password (copy output)
openssl rand -base64 32

# Generate MongoDB app password (copy output)
openssl rand -base64 32
```

### Step 3: Configure .env.production

```bash
nano /opt/acetel-iams/.env.production
```

**Replace with your values:**

```env
# --- SERVER CONFIG ---
NODE_ENV=production
PORT=5000

# --- MONGODB CONFIG ---
MONGO_ROOT_USER=acetel_admin
MONGO_ROOT_PASSWORD=YOUR_SECURE_MONGO_ROOT_PASSWORD_HERE
MONGO_APP_USER=acetel_app
MONGO_APP_PASSWORD=YOUR_SECURE_MONGO_APP_PASSWORD_HERE

# --- JWT SECRETS (from openssl rand -base64 32) ---
JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_SECURE_JWT_REFRESH_SECRET_HERE

# --- FRONTEND CONFIG ---
FRONTEND_URL=http://YOUR_VM_IP:8080
CORS_ORIGIN=http://YOUR_VM_IP:8080

# --- STORAGE ---
UPLOAD_PATH=/app/uploads
BACKUP_DIR=/app/backups
MAX_FILE_SIZE_MB=10

# --- INSTITUTIONAL ---
LOGO_URL=https://acetel.nou.edu.ng/logo.png

# --- EMAIL (Optional) ---
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=ACETEL IAMS <noreply@acetel.edu.ng>
```

**Save:** `Ctrl+X` → `Y` → `Enter`

### Step 4: Set Permissions

```bash
chmod 600 /opt/acetel-iams/.env.production
```

---

## Deployment

### Step 1: Build Docker Images

```bash
cd /opt/acetel-iams

# Build all services (takes 10-15 minutes)
docker-compose -f docker-compose.prod.yml build

# Verify images
docker images | grep acetel
```

### Step 2: Start Services

```bash
# Start all services in background
docker-compose -f docker-compose.prod.yml up -d

# Monitor startup (wait 30-60 seconds)
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

**Expected output:**
```
NAME                     STATUS
acetel-mongodb-prod      Up (healthy)
acetel-server-prod       Up (healthy)
acetel-client-prod       Up
```

### Step 3: Verify Deployment

```bash
# Check MongoDB
docker exec acetel-mongodb-prod mongosh --eval "db.adminCommand('ping')"
# Should return: { ok: 1 }

# Check Backend API
curl http://localhost:5000/api/health
# Should return: { status: 'OK', message: '...' }

# Check Frontend
curl http://localhost:8080
# Should return HTML content
```

### Step 4: Access Application

```
Frontend:  http://YOUR_VM_IP:8080
API:       http://YOUR_VM_IP:8080/api
```

---

## Monitoring & Maintenance

### Step 1: View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs server
docker-compose -f docker-compose.prod.yml logs mongodb

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 2: Monitor Resources

```bash
# Monitor container stats
docker stats

# SSH into Ubuntu and check system resources
free -h     # Memory
df -h       # Disk
top         # CPU and processes
```

### Step 3: Backup Database

```bash
# Backup MongoDB
docker exec acetel-mongodb-prod mongodump \
  -u acetel_admin \
  -p YOUR_MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --out /data/db/backup-$(date +%Y%m%d)

# View backups
docker exec acetel-mongodb-prod ls -la /data/db/backup-*

# Copy backup to host
docker cp acetel-mongodb-prod:/data/db/backup-20260705 ~/backups/
```

### Step 4: Automated Daily Backup Script

```bash
# Create backup script
cat > /opt/acetel-iams/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/acetel-iams/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/acetel_backup_$DATE"

mkdir -p "$BACKUP_PATH"

# Backup MongoDB
docker exec acetel-mongodb-prod mongodump \
  -u acetel_admin \
  -p $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --out "$BACKUP_PATH/mongodb"

# Backup uploads
cp -r /opt/acetel-iams/uploads/* "$BACKUP_PATH/uploads" 2>/dev/null || true

# Compress
tar -czf "$BACKUP_PATH.tar.gz" "$BACKUP_PATH"
rm -rf "$BACKUP_PATH"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz"
EOF

chmod +x /opt/acetel-iams/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line: 0 2 * * * /opt/acetel-iams/backup.sh
```

### Step 5: Enable Auto-Restart

```bash
# Make Docker services start on boot
sudo systemctl enable docker

# Containers restart automatically (already configured in docker-compose.prod.yml)
```

---

## Troubleshooting

### Issue: Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# View detailed logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Rebuild services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Issue: MongoDB Connection Failed

```bash
# Check MongoDB health
docker exec acetel-mongodb-prod mongosh \
  -u acetel_admin \
  -p YOUR_MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"

# View MongoDB logs
docker logs acetel-mongodb-prod

# Verify environment variables
docker exec acetel-server-prod env | grep MONGO
```

### Issue: Backend API Returning Errors

```bash
# Check backend logs
docker logs -f acetel-server-prod

# Test API health endpoint
curl -v http://localhost:5000/api/health

# Rebuild backend only
docker-compose -f docker-compose.prod.yml build server
docker-compose -f docker-compose.prod.yml up -d server
```

### Issue: Port Already in Use

```bash
# Find what's using port 8080
sudo lsof -i :8080

# Kill process (if needed)
sudo kill -9 <PID>

# Alternative: change port in docker-compose.prod.yml
# Modify: ports: ["9090:80"]
```

### Issue: High Memory Usage

```bash
# Check container memory
docker stats

# Limit container memory in docker-compose.prod.yml
# Add under service: deploy: resources: limits: memory: 2G

# Restart containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Production Checklist

- [x] Ubuntu 22.04 LTS installed on Proxmox VM
- [x] Docker and Docker Compose installed
- [x] Firewall configured (UFW)
- [x] SSH key authentication configured
- [x] Repository cloned to `/opt/acetel-iams`
- [x] `.env.production` created with secure secrets
- [x] Docker images built successfully
- [x] All services running and healthy
- [x] Backup strategy implemented
- [x] Monitoring enabled
- [x] Auto-restart on boot configured
- [x] SSL/TLS certificates configured (if using HTTPS)
- [x] Email notifications tested
- [x] Database backups tested
- [x] Disaster recovery plan documented

---

## Quick Command Reference

```bash
# Start all services
docker-compose -f /opt/acetel-iams/docker-compose.prod.yml up -d

# Stop all services
docker-compose -f /opt/acetel-iams/docker-compose.prod.yml down

# View logs
docker-compose -f /opt/acetel-iams/docker-compose.prod.yml logs -f

# Restart specific service
docker-compose -f /opt/acetel-iams/docker-compose.prod.yml restart server

# Access MongoDB shell
docker exec -it acetel-mongodb-prod mongosh \
  -u acetel_admin \
  -p YOUR_PASSWORD \
  --authenticationDatabase admin

# Execute backup script
/opt/acetel-iams/backup.sh

# Check container stats
docker stats
```

---

## Support & Documentation

- **Repository:** https://github.com/abukadafa/ACETELIAMS
- **Issue Tracker:** https://github.com/abukadafa/ACETELIAMS/issues
- **Documentation:** See README.md in root directory

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Modified:** 2026-07-05
