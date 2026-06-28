# API 概覽

基底路徑 `/api`,除登入與健康檢查外都需要 `Authorization: Bearer <token>`。
開發環境可在 `/api/docs` 查看 Swagger 文件,正式環境預設關閉。

## 回應格式

- 列表: `{ items, total, page, pageSize, totalPages }`,以 `page`、`pageSize`、`keyword` 查詢
- 錯誤: `{ statusCode, message }`,驗證錯誤的 `message` 為陣列

## 狀態碼

| 碼 | 意義 |
| --- | --- |
| 400 | 驗證失敗或違反業務規則 |
| 401 | 未登入或憑證過期 |
| 403 | 權限不足 |
| 404 | 資料不存在 |
| 409 | 唯一欄位重複或資料被引用 |
| 429 | 請求過於頻繁 |

## 端點

| 路徑 | 說明 |
| --- | --- |
| POST /auth/login | 登入 |
| GET /auth/me | 目前使用者 |
| POST /auth/change-password | 修改密碼 |
| /users, /roles | 使用者與角色 |
| GET /audit-logs | 稽核紀錄 |
| /products, /categories, /warehouses | 商品主檔 |
| /customers, /suppliers | 往來對象 |
| /purchase-orders | 採購單,含 approve、receive、cancel |
| /sales-orders | 銷售單,含 confirm、ship、cancel |
| /inventory/levels, /inventory/movements | 庫存查詢 |
| POST /inventory/adjust, /inventory/transfer | 盤點與調撥 |
| /accounting/accounts, /accounting/journals | 科目與傳票 |
| /accounting/invoices | 應收應付,含 pay |
| GET /accounting/trial-balance | 試算表 |
| GET /accounting/aging/:kind | 帳齡 (AR 或 AP) |
| /hr/departments, /hr/employees | 組織與員工 |
| /hr/attendance, /hr/leaves | 考勤與請假 |
| /hr/payrolls | 薪資,含 generate、pay |
| /reports/* | 報表 |
| GET /health | 健康檢查,含資料庫連線 |
