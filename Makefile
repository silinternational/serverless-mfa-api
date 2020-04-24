dev-server:
	node development/server

do-full-recovery:
	docker-compose run --rm do-full-recovery

test:
	npm test
