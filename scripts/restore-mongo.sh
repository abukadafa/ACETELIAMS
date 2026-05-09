#!/bin/bash

# ACETEL IAMS — Institutional Database Restore Utility
# Usage: ./restore-mongo.sh /opt/acetel/backups/acetel_YYYYMMDD_HHMMSS.tar.gz

BACKUP_FILE=$1
CONTAINER_NAME="acetel-mongodb"
DB_NAME="acetel_iams"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <path_to_backup_tar_gz>"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current '${DB_NAME}' database."
read -p "Are you sure you want to proceed? (y/N) " confirm

if [[ $confirm == [yY] ]]; then
    TEMP_DIR=$(mktemp -d)
    echo "Extracting backup..."
    tar -xzf $BACKUP_FILE -C $TEMP_DIR
    
    ARCHIVE_FILE=$(find $TEMP_DIR -name "*.archive")
    
    echo "Restoring to MongoDB container..."
    docker exec -i $CONTAINER_NAME mongorestore --drop --archive < $ARCHIVE_FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore successful."
    else
        echo "❌ Restore failed."
    fi
    
    rm -rf $TEMP_DIR
else
    echo "Operation cancelled."
fi
