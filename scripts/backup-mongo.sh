#!/bin/bash

# ACETEL IAMS — Institutional Database Backup Utility
# Automates MongoDB dumps and secures them in the local backup directory

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="/opt/acetel/backups"
CONTAINER_NAME="acetel-mongodb"
DB_NAME="acetel_iams"
LOG_FILE="/var/log/acetel-backup.log"

echo "[$(date)] Starting institutional backup for ${DB_NAME}..." >> $LOG_FILE

# Run mongodump inside container
docker exec $CONTAINER_NAME mongodump --db $DB_NAME --archive > "${BACKUP_PATH}/acetel_${TIMESTAMP}.archive"

if [ $? -eq 0 ]; then
    # Compress the archive
    tar -czf "${BACKUP_PATH}/acetel_${TIMESTAMP}.tar.gz" -C $BACKUP_PATH "acetel_${TIMESTAMP}.archive"
    rm "${BACKUP_PATH}/acetel_${TIMESTAMP}.archive"
    
    # Delete backups older than 7 days
    find $BACKUP_PATH -name "acetel_*.tar.gz" -mtime +7 -delete
    
    echo "[$(date)] Backup successful: acetel_${TIMESTAMP}.tar.gz" >> $LOG_FILE
else
    echo "[$(date)] ERROR: Backup failed for ${DB_NAME}!" >> $LOG_FILE
    exit 1
fi
