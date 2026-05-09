# ACETEL IAMS Proxmox VE Deployment Guide

This guide provides step-by-step instructions for deploying the ACETEL IAMS full stack on a Proxmox VE server.

## Quick start (first pull on the container)

```bash
cd /opt
git clone https://github.com/abukadafa/ACETELIAMS.git
cd ACETELIAMS/docker/production
cp .env.production.example .env.production
# Edit .env.production: set JWT_*, MONGO_*, REDIS_*, FRONTEND_URL, API_URL (use /api for same-origin)
docker compose up -d --build
docker compose exec backend npx ts-node src/scripts/seed-production.ts
```

- **API_URL** in compose is passed to the frontend build as `VITE_API_URL`. For the bundled nginx layout, set **`API_URL=/api`** so the browser calls same-origin `/api/...` through the gateway.
- After data upload, keep **backups** of `/opt/acetel/mongo-data` and `/opt/acetel/uploads` (see `backup-mongo.sh` in this folder).

## 1. Resource Sizing (Recommended)
For a university system with up to 500 concurrent users:
- **CPU**: 4 vCPUs (Intel Xeon or AMD EPYC recommended)
- **RAM**: 8 GB (Minimum 4 GB)
- **Disk**: 50 GB SSD/NVMe (Scale based on document upload volume)
- **OS**: Ubuntu 22.04 LTS (LXC or VM)

## 2. Create the LXC Container
1. Log in to Proxmox Web UI.
2. Click **Create CT**.
3. **General**: Set Hostname (e.g., `acetel-iams`) and Password.
4. **Template**: Choose `ubuntu-22.04-standard`.
5. **Disk**: Set to `50G`.
6. **CPU**: Set to `4` cores.
7. **Memory**: Set Memory to `8192` and Swap to `2048`.
8. **Network**: Set Static IP (e.g., `192.168.1.100/24`) and Gateway.
9. **Confirm** and Start.

## 3. Prepare the Environment
SSH into your container and run:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Create Persistent Storage Directories
mkdir -p /opt/acetel/mongo-data
mkdir -p /opt/acetel/redis-data
mkdir -p /opt/acetel/uploads
mkdir -p /opt/acetel/certs
chown -R 1000:1000 /opt/acetel/uploads # Ensure backend container can write
```

## 4. Setup Firewall (UFW)
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 5. Deploy the Application
1. **Copy Files**: From your local machine, sync the project:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@192.168.1.100:/opt/acetel-iams
   ```
2. **Configure Environment**:
   ```bash
   cd /opt/acetel-iams/docker/production
   cp .env.production.example .env.production
   nano .env.production # Fill in secure secrets
   ```
3. **Start the Stack**:
   ```bash
   docker compose up -d --build
   ```

## 6. Seed the Database
Once the containers are healthy:
```bash
docker compose exec backend npx ts-node src/scripts/seed-production.ts
```

## 7. Verifying the Deployment
- Check logs: `docker compose logs -f`
- Check health: `curl http://localhost/api/health/db`
- Access via Browser: `http://192.168.1.100`

---
**Institutional Standard**: Always ensure `/opt/acetel/backups` is mounted to a separate physical disk or NAS for data safety.
