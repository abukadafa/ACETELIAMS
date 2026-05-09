# ACETEL IAMS — Production Deployment Handover Guide
**Target Environment:** Proxmox VE (Ubuntu 22.04 LXC Container)
**Deployment Architecture:** Docker Compose (Nginx + Frontend + Backend + MongoDB)

---

## 1. Server Prerequisites (Proxmox LXC)
Ensure your LXC container meets these minimum institutional specs:
- **CPU:** 4 Cores
- **RAM:** 8 GB
- **Storage:** 100 GB (SSD Preferred)
- **Network:** Static IP (e.g., `192.168.1.50`)
- **Docker & Docker Compose:** Installed and running

## 2. Institutional Directory Setup
Run the following commands on the Proxmox host to prepare persistent storage:
```bash
sudo mkdir -p /opt/acetel/mongo-data
sudo mkdir -p /opt/acetel/uploads
sudo mkdir -p /opt/acetel/backups
sudo chown -R 1000:1000 /opt/acetel
```

## 3. Environment Configuration
1. Clone the repository into your deployment folder.
2. Copy the production template: `cp .env.production.template .env.production`.
3. Generate secure secrets and update `.env.production`:
```bash
# Generate a 64-char secret
openssl rand -base64 48
```
4. Set `FRONTEND_URL` to your Proxmox Static IP.

## 4. Launching the System
Execute the production build and launch sequence:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Verify all containers are healthy:
```bash
docker ps
```

## 5. Post-Deployment Seeding
Populate the database with the initial institutional data (Admins, Courses, Staff):
```bash
docker exec -it acetel-backend npx ts-node scripts/seed.ts
```

## 6. Accessing the Platform
- **Student/Public Portal:** `http://192.168.x.x`
- **Admissions/Staff Hub:** `http://192.168.x.x/login` (Admin/Staff Login)
- **Health Dashboard:** `http://192.168.x.x/health-check` (Staff Only)

## 7. Security & Maintenance
### Firewall Configuration (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Automated Backups
Add the backup script to root's crontab for daily institutional backups:
```bash
# Every day at 2 AM
0 2 * * * /path/to/acetel/scripts/backup-mongo.sh
```

### Log Monitoring
```bash
docker logs -f acetel-backend
docker logs -f acetel-nginx
```

---
**Institutional Support:** ACETEL Technical Team
**Version:** 1.0.0-PROD
