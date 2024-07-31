dev-server:
	node development/server

dynamodb:
	docker compose up -d dynamodb

dynamodb-tables: dynamodb
	./development/create-tables.sh

list-dev-api-keys:
	./development/list-api-keys.sh

do-full-recovery:
	docker compose run --rm do-full-recovery

test:
	docker compose run --rm dev bash -c "npm ci && npm test"

update:
	docker compose run --rm dev bash -c "npm update"
