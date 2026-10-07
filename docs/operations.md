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

## 還原

```bash
./scripts/restore.sh backups/erp-20260101-020000.dump
```

還原會覆蓋現有資料,執行前請停止對外服務。

## 常見問題

| 現象 | 處理 |
| --- | --- |
| API 一直重啟 | 看日誌,多半是 `DATABASE_URL` 或遷移失敗 |
| 登入回 401 | 確認帳密,或 `JWT_SECRET` 在重啟後被改動 |
| 登入回 429 | 登入每分鐘限 10 次,稍候再試 |
| 忘記管理員密碼 | 由其他管理員重設,或直接更新資料庫中的 `passwordHash` |
