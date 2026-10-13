# ERP

企業資源規劃系統,涵蓋採購、銷售、庫存、財務會計與人事薪資,可直接以 Docker 部署上線。

## 功能

- 認證與權限: JWT 登入、角色型權限控管 (RBAC)、操作稽核紀錄
- 主檔: 商品、分類、倉庫、客戶、供應商
- 採購: 採購單、核准、分批收貨、應付帳款
- 銷售: 銷售單、信用額度檢查、分批出貨、應收帳款
- 庫存: 即時庫存、異動紀錄、盤點調整、倉庫調撥、移動平均成本
- 財務: 會計科目、傳票與沖銷、收付款、帳齡分析、試算表、損益表
- 人事: 部門、員工、考勤打卡、請假簽核、薪資計算與發放
- 報表: 儀表板、月銷售趨勢、熱銷商品、庫存估值

業務單據過帳時會自動產生會計分錄,採購收貨、銷貨出庫、收付款與薪資發放全程借貸平衡。

## 技術棧

| 層級 | 技術 |
| --- | --- |
| 後端 | NestJS 11、Prisma 6、PostgreSQL 17 |
| 前端 | React 19、Vite、TypeScript |
| 部署 | Docker Compose、Nginx |
| 品質 | Jest 單元與端對端測試、ESLint、Prettier、GitHub Actions |

## 快速開始(Docker)

```bash
cp .env.example .env
# 編輯 .env,填入 POSTGRES_PASSWORD、JWT_SECRET、ADMIN_PASSWORD
docker compose up -d --build
```

啟動後開啟 http://localhost ,以 `.env` 中的 `ADMIN_EMAIL` 與 `ADMIN_PASSWORD` 登入。
資料庫遷移與初始資料會在 API 容器啟動時自動執行。

## 本機開發

需求: Node.js 24、PostgreSQL 15 以上。

```bash
make install
cp apps/api/.env.example apps/api/.env   # 調整 DATABASE_URL
cd apps/api && npx prisma migrate dev && npm run db:seed
make dev-api      # http://localhost:3000/api/docs
make dev-web      # http://localhost:5173
```

預設管理員為 `admin@example.com`,密碼取自 `ADMIN_PASSWORD`(開發環境預設 `Admin12345`)。
設定 `SEED_DEMO=1` 再執行 seed 可匯入示範資料。

## 測試

```bash
make test
```

端對端測試需要已套用遷移並完成 seed 的資料庫,見 [開發指南](docs/development.md)。
