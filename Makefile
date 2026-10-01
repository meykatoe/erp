.PHONY: install dev-api dev-web test build up down logs backup

install:
	cd apps/api && npm ci && npx prisma generate
	cd apps/web && npm ci

dev-api:
	cd apps/api && npm run start:dev

dev-web:
	cd apps/web && npm run dev

test:
	cd apps/api && npm test && npm run test:e2e

build:
	cd apps/api && npm run build
	cd apps/web && npm run build

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

backup:
	./scripts/backup.sh
