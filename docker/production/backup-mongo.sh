#!/bin/bash
# scripts/backup-mongo.sh

# Load environment variables if running manually
if [ -f "/opt/acetel/.env.production" ]; then
  source /opt/acetel/.env.production
fi

BACKUP_DIR="/opt/acetel/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
LOG_FILE="/var/log/acetel-backup.log"

mkdir -p $BACKUP_DIR

echo "[$TIMESTAMP] Starting full system backup..." >> $LOG_FILE

# 1. Database Backup
echo "[$TIMESTAMP] Dumping MongoDB..." >> $LOG_FILE
docker exec acetel-mongo mongodump \
  --username ${MONGO_ROOT_USER} \
  --password ${MONGO_ROOT_PASSWORD} \
  --authenticationDatabase admin \
  --db ${MONGO_APP_DB} \
  --out /data/db/backup_$TIMESTAMP >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    # Move from container to host via the volume mapping
    cp -r /opt/acetel/mongo-data/backup_$TIMESTAMP $BACKUP_PATH
    
    # 2. Environment Configuration Backup
    echo "[$TIMESTAMP] Backing up environment configuration..." >> $LOG_FILE
    mkdir -p $BACKUP_PATH/config
    cp /opt/acetel/.env.production $BACKUP_PATH/config/
    cp /opt/acetel/docker-compose.yml $BACKUP_PATH/config/

    # 3. Compress
    tar -czf $BACKUP_PATH.tar.gz -C $BACKUP_DIR $TIMESTAMP >> $LOG_FILE 2>&1
    
    # 4. Cleanup temp folders
    rm -rf $BACKUP_PATH
    docker exec acetel-mongo rm -rf /data/db/backup_$TIMESTAMP
    
    # 5. Backup rotation (keep 14 days for production)
    find $BACKUP_DIR -name "*.tar.gz" -mtime +14 -delete
    
    echo "[$TIMESTAMP] Backup successful: $BACKUP_PATH.tar.gz" >> $LOG_FILE
else
    echo "[$TIMESTAMP] CRITICAL: MongoDB backup failed!" >> $LOG_FILE
    exit 1
fi
