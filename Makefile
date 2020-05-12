dev:
	docker-compose up -d dev-client-bundle dev-server dynamodb

dynamodb:
	docker-compose up -d dynamodb

dynamodb-tables: dynamodb
	./development/create-tables.sh

list-dev-api-keys:
	./development/list-api-keys.sh

do-full-recovery:
	docker-compose run --rm do-full-recovery

stop:
	docker-compose stop

test:
	npm test
