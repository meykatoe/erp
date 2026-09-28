#!/bin/bash
set -euo pipefail

DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DIR"
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-erp}" -Fc "${POSTGRES_DB:-erp}" > "$DIR/erp-$STAMP.dump"
find "$DIR" -name 'erp-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "備份完成: $DIR/erp-$STAMP.dump"
