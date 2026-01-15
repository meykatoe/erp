# 權限設計

權限字串格式為 `資源:動作`。使用者的有效權限為其所有角色權限的聯集,
登入時寫入 JWT,伺服器端每個端點都會檢查。

## 預設角色

| 角色 | 說明 |
| --- | --- |
| admin | 全部權限 |
| sales | 客戶、銷售單建立與確認、庫存查詢、報表 |
| purchaser | 供應商、採購單建立與核准 |
| warehouse | 庫存調整、採購收貨、銷售出貨 |
| finance | 會計、薪資、報表 |
| hr | 人事、薪資查詢 |

預設角色於 seed 時建立,可在系統內調整,也可自行新增角色。

## 權限清單

| 權限 | 說明 |
| --- | --- |
| user:read / user:write | 使用者管理 |
| role:read / role:write | 角色管理 |
| audit:read | 查看稽核紀錄 |
| product:read / product:write | 商品與分類 |
| warehouse:read / warehouse:write | 倉庫 |
| customer:read / customer:write | 客戶 |
| supplier:read / supplier:write | 供應商 |
| purchase:read / write / approve / receive | 採購單 |
| sales:read / write / confirm / ship | 銷售單 |
| inventory:read / inventory:adjust | 庫存查詢與調整 |
| accounting:read / accounting:write | 會計 |
| hr:read / hr:write | 人事 |
| payroll:read / payroll:write | 薪資 |
| report:read | 報表 |

## 注意事項

- 權限變更後,已登入的使用者需重新登入才會生效
- 管理員角色不可刪除
- 仍有使用者的角色不可刪除
