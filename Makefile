deploy:
	docker-compose up --build -d
	docker-compose logs -f

down:
	docker-compose down
connect:
	docker exec -it pdf-generator /bin/bash
