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
