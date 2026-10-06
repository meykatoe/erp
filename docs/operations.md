# 維運手冊

## 健康檢查

- API: `GET /api/health`,會實際查詢資料庫
- Nginx: `GET /healthz`
- 兩個容器都有 Docker healthcheck,`docker compose ps` 可看到狀態

## 日誌

```bash
docker compose logs -f --tail=100 api
```

## 備份

```bash
./scripts/backup.sh
```

預設輸出到 `./backups`,保留 14 天,可用 `BACKUP_DIR`、`KEEP_DAYS` 調整。
建議以 cron 每日執行並將備份複製到另一台主機或物件儲存:

```
0 2 * * * cd /opt/erp && ./scripts/backup.sh >> /var/log/erp-backup.log 2>&1
```

備份檔必須定期做還原演練,確認可用。
