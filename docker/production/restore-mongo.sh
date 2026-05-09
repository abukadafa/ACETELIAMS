#!/bin/bash
# scripts/restore-mongo.sh

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_tar_gz>"
  exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="/tmp/mongo_restore_$(date +%s)"

mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Get the directory name (it's the timestamp)
RESTORE_DIR=$(ls $TEMP_DIR)

# Copy to mongo container volume path
cp -r $TEMP_DIR/$RESTORE_DIR /opt/acetel/mongo-data/restore_temp

# Run mongorestore
docker exec acetel-mongo mongorestore \
  --username ${MONGO_ROOT_USER} \
  --password ${MONGO_ROOT_PASSWORD} \
  --authenticationDatabase admin \
  --nsInclude "${MONGO_APP_DB}.*" \
  /data/db/restore_temp/${MONGO_APP_DB}

# Cleanup
rm -rf $TEMP_DIR
rm -rf /opt/acetel/mongo-data/restore_temp

echo "✅ Restore completed from $BACKUP_FILE"
