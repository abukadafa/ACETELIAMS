#!/bin/bash
# scripts/backup-mongo.sh

# Load environment variables if running manually
# source ../.env.production

BACKUP_DIR="/opt/acetel/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
LOG_FILE="/var/log/acetel-backup.log"

mkdir -p $BACKUP_DIR

echo "[$TIMESTAMP] Starting MongoDB backup..." >> $LOG_FILE

# Run mongodump inside the container
docker exec acetel-mongo mongodump \
  --username ${MONGO_ROOT_USER} \
  --password ${MONGO_ROOT_PASSWORD} \
  --authenticationDatabase admin \
  --db ${MONGO_APP_DB} \
  --out /data/db/backup_$TIMESTAMP

# Move from container to host
docker exec acetel-mongo mv /data/db/backup_$TIMESTAMP /data/db/backup_latest
# Note: Since /data/db is mapped to /opt/acetel/mongo-data, we can access it directly
cp -r /opt/acetel/mongo-data/backup_$TIMESTAMP $BACKUP_PATH

# Compress
tar -czf $BACKUP_PATH.tar.gz -C $BACKUP_DIR $TIMESTAMP
rm -rf $BACKUP_PATH
rm -rf /opt/acetel/mongo-data/backup_$TIMESTAMP

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "[$TIMESTAMP] Backup completed successfully: $BACKUP_PATH.tar.gz" >> $LOG_FILE
