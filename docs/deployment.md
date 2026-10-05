# 部署指南

## 需求

- Linux 主機,至少 2 vCPU、2 GB RAM、20 GB 磁碟
- Docker 24 以上與 Docker Compose v2
- 對外 80 或 443 連接埠

## 步驟

1. 取得程式碼並建立設定檔

   ```bash
   git clone <repo> erp && cd erp
   cp .env.example .env
   ```

2. 編輯 `.env`,以下三項必填:

   | 變數 | 說明 |
   | --- | --- |
   | POSTGRES_PASSWORD | 資料庫密碼,請用長隨機字串 |
   | JWT_SECRET | 簽發憑證的密鑰,至少 32 字元 |
   | ADMIN_PASSWORD | 初始管理員密碼 |

   產生隨機值: `openssl rand -base64 36`

3. 啟動

   ```bash
   docker compose up -d --build
   docker compose ps
   ```

4. 以管理員登入並立即修改密碼,再建立實際使用者與角色。

## HTTPS

容器內的 Nginx 只提供 HTTP。正式環境請在前面放置終止 TLS 的反向代理
(如 Caddy、Traefik 或雲端負載平衡器),並將 `HTTP_PORT` 改為僅本機可存取的埠。

Caddy 範例:

```
erp.example.com {
  reverse_proxy 127.0.0.1:8080
}
```

## 升級

```bash
git pull
./scripts/backup.sh
docker compose up -d --build
```

資料庫遷移在 API 啟動時自動套用。升級前務必先備份。

## 回復

```bash
git checkout <前一版 tag>
docker compose up -d --build
```

若新版已套用不可逆的遷移,需先以備份還原資料庫,見 [維運手冊](operations.md)。
