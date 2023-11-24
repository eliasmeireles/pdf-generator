deploy:
	docker-compose up --build -d
	docker-compose logs -f

down:
	docker-compose down
connect:
	docker exec -it pdf-generator /bin/bash

test:
	./gradlew clean test

rebuild:
	./gradlew clean shadowJar

pdf-server:
	docker build -t pdf-server -f DockerfileBuilder .
