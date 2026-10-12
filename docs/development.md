# 開發指南

## 目錄結構

```
apps/api
  prisma/          資料模型、遷移、seed
  src/<module>/    每個模組含 controller、service、dto
  src/common/      共用的 guard、filter、decorator、工具
  test/            端對端測試
apps/web
  src/pages/       頁面
  src/components/  共用元件
  src/api/         API 用戶端
docs/              文件
scripts/           維運腳本
```

## 資料庫

```bash
cd apps/api
npx prisma migrate dev --name <變更說明>
npx prisma studio
```

遷移檔必須一併提交。不要修改已合併的遷移,改以新增遷移處理。

## 測試

單元測試不需要資料庫:

```bash
cd apps/api && npm test
```

端對端測試使用真實資料庫,請準備獨立的測試庫,避免污染開發資料:

```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/erp_test
export JWT_SECRET=test
npx prisma migrate deploy && npx tsx prisma/seed.ts
npm run test:e2e
```

## 程式風格

```bash
npm run lint
npm run format
```

## 新增模組

1. 在 `prisma/schema.prisma` 新增模型並建立遷移
2. 建立 `module / controller / service / dto`,controller 以 `@Perm()` 標示權限
3. 新權限加入 `common/constants/permissions.ts`,並視需要加入預設角色
4. 於 `app.module.ts` 註冊
5. 補單元測試,關鍵流程補端對端測試
