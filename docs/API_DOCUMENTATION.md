# API documentation

Base URL: `http://localhost:4000/api`

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /parking/locations?q=`, `GET /parking/locations/:id`
- `POST /reservations`, `GET /reservations`, `PATCH /reservations/:id/cancel`
- `GET /traffic`
- `GET /ai/predictions?locationId=&hour=`
- `GET /analytics/summary` (ADMIN or PARKING_OPERATOR)
- `PATCH /parking/slots/:id` (ADMIN or PARKING_OPERATOR)

Send protected requests with `Authorization: Bearer <JWT>`.
