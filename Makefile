dev-server:
	node development/server

dynamodb:
	docker-compose up -d dynamodb

dynamodb-tables: dynamodb
	./development/create-tables.sh

do-full-recovery:
	docker-compose run --rm do-full-recovery

test:
	npm test
