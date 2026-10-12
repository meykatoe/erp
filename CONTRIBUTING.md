# 貢獻規範

## 分支

- 由 `develop` 切出 `feature/<功能>`、`fix/<問題>` 或 `chore/<雜務>`
- 完成後以合併請求回到 `develop`,不直接推送 `main`
- `main` 只接受來自 `develop` 的發版合併,並打版本 tag

## 提交訊息

格式 `<type>(<scope>): <主旨>`,主旨以繁體中文撰寫。

| type | 用途 |
| --- | --- |
| feat | 新功能 |
| fix | 修正錯誤 |
| refactor | 重構,不改變行為 |
| test | 測試 |
| docs | 文件 |
| build | 建置與相依套件 |
| ci | 持續整合 |
| chore | 其他雜務 |

範例: `feat(sales): 新增信用額度檢查`

## 合併前檢查

- [ ] `npm run lint` 無錯誤
- [ ] `npm test` 與 `npm run test:e2e` 通過
- [ ] 前端 `npm run build` 通過
- [ ] 資料庫變更附上遷移檔
- [ ] 影響使用方式時同步更新文件與 CHANGELOG
