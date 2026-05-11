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

# The directory structure is: TEMP_DIR/TIMESTAMP/
TIMESTAMP_DIR=$(ls $TEMP_DIR)
RESTORE_DATA_DIR="$TEMP_DIR/$TIMESTAMP_DIR"

echo "Restoring database from $RESTORE_DATA_DIR..."

# Copy data to mongo container volume path
cp -r $RESTORE_DATA_DIR /opt/acetel/mongo-data/restore_temp

# Run mongorestore
# We assume the user has MONGO_ROOT_USER etc in their current env or we source them
if [ -f "/opt/acetel/.env.production" ]; then
  source /opt/acetel/.env.production
fi

docker exec acetel-mongo mongorestore \
  --username ${MONGO_ROOT_USER} \
  --password ${MONGO_ROOT_PASSWORD} \
  --authenticationDatabase admin \
  --nsInclude "${MONGO_APP_DB}.*" \
  --drop \
  /data/db/restore_temp/${MONGO_APP_DB}

# Cleanup
rm -rf $TEMP_DIR
docker exec acetel-mongo rm -rf /data/db/restore_temp

echo "✅ Restore completed successfully."
echo "💡 Note: Environment config was backed up to $TIMESTAMP_DIR/config/ but was NOT automatically restored to prevent overwriting live secrets."
