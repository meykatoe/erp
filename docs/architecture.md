# 架構設計

## 總覽

```
瀏覽器 ──> Nginx (靜態檔 + /api 反向代理) ──> NestJS API ──> PostgreSQL
```

前端為單頁應用,所有資料透過 `/api` 取得。API 為無狀態服務,可水平擴充;
狀態只存在 PostgreSQL。

## 後端模組

| 模組 | 職責 |
| --- | --- |
| auth / users / roles | 登入、使用者、角色與權限 |
| audit | 寫入類請求的稽核紀錄 |
| sequence | 單據流水號,以資料庫計數器保證不重複 |
| products / categories / warehouses | 商品與倉庫主檔 |
| customers / suppliers | 往來對象 |
| purchase | 採購單狀態機、收貨 |
| sales | 銷售單狀態機、出貨、信用額度 |
| inventory | 庫存水位、異動、盤點、調撥 |
| accounting | 科目、傳票、發票、收付款、試算 |
| hr | 部門、員工、考勤、請假、薪資 |
| reports | 儀表板與統計查詢 |
