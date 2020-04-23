start:
	echo This Makefile has no default action. Be specific.

dev-server:
	node development/server

do-full-recovery:
	docker-compose run --rm do-full-recovery

test:
	npm test
