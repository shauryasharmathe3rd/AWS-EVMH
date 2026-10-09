.PHONY: help up down logs reset-demo test build check-contrast

help:
	@echo "Tript-Dhara Orchestration Commands:"
	@echo "  make up          - Build and bring up all containers in detached mode"
	@echo "  make down        - Tear down containers and networks"
	@echo "  make logs        - Follow logs across all containers"
	@echo "  make reset-demo  - Reset leaks and simulation to fixed-seed repeatable state"
	@echo "  make test        - Run backend test suite"
	@echo "  make check-contrast - Verify WCAG AA 4.5:1 color contrast"

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

reset-demo:
	curl -X POST http://localhost:8080/api/v1/demo/reset

test:
	docker compose exec backend pytest -v

check-contrast:
	node frontend/scripts/check-contrast.js
