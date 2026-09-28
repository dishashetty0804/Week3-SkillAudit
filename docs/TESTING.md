# Testing

Backend smoke tests use Node's built-in test runner: `cd backend && npm test`. They verify health, demo login, and parking search. Add integration tests against the Docker MySQL service for transaction locking and time-overlap reservations before production rollout. The frontend can be built with `cd frontend && npm run build`.
