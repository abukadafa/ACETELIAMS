#!/bin/bash
# scripts/setup-backup-cron.sh

BACKUP_SCRIPT="/opt/acetel/scripts/backup-mongo.sh"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

chmod +x $BACKUP_SCRIPT

# Create cron job (Runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_SCRIPT") | crontab -

echo "✅ Cron job scheduled: Daily at 2:00 AM"
crontab -l | grep backup-mongo.sh
