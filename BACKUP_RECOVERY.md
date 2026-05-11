# ACETEL IAMS: Backup & Recovery Documentation

## 1. Automated Backup System
The system performs a full backup daily at **2:00 AM**.

- **Backup Content**:
    - MongoDB Institutional Data
    - Environment Configuration (`.env.production`)
    - Docker Compose Configuration
- **Location**: `/opt/acetel/backups/`
- **Retention**: 14 Days (Automatically rotated)
- **Log File**: `/var/log/acetel-backup.log`

### Manual Backup Trigger
Run the following command as root or a user in the docker group:
```bash
/opt/acetel/scripts/backup-mongo.sh
```

## 2. Disaster Recovery Procedure
In the event of data loss or corruption, follow these steps to restore the system to a previous state.

### Step 1: Identify the Backup File
Locate the desired backup in `/opt/acetel/backups/`. Files are named by timestamp: `YYYYMMDD_HHMMSS.tar.gz`.

### Step 2: Execute Restore Script
Run the restore script with the path to the backup file:
```bash
/opt/acetel/scripts/restore-mongo.sh /opt/acetel/backups/20260510_020000.tar.gz
```
**Warning**: This will drop the current database and replace it with the backup data.

### Step 3: Verify Restoration
1. Check the restore logs in the terminal output.
2. Login to the Dashboard and verify the records in the Audit Trail.
3. Check the Analytics tab to ensure counts match the expected state.

## 3. Configuration Recovery
Environment files are backed up into the `config/` subfolder of each backup archive. If secrets need to be recovered, manually extract them:
```bash
tar -xf /opt/acetel/backups/FILE.tar.gz -C /tmp
cat /tmp/TIMESTAMP/config/.env.production
```
