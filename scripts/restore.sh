#!/bin/bash
set -euo pipefail

FILE="${1:?用法: restore.sh <備份檔>}"
read -r -p "將覆蓋目前資料庫,確定繼續? (yes/no) " ans
[ "$ans" = "yes" ] || exit 1

docker compose exec -T db pg_restore -U "${POSTGRES_USER:-erp}" -d "${POSTGRES_DB:-erp}" --clean --if-exists < "$FILE"
echo "還原完成"
