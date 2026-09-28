# Local setup

## Fast smoke path
1. Install Node.js 22 and Python 3.12.
2. In `backend`, run `npm install`, then `npm test`.
3. Run `npm start` in `backend`.
4. In `frontend`, run `npm install` and `npm run dev`.
5. In `ai-service`, run `python -m venv .venv`, activate it, `pip install -r requirements.txt`, then `uvicorn main:app --reload --port 8000`.

Open `http://localhost:5173`. The backend uses seeded in-memory records for this fast path.

## Full Docker path
Run `docker compose up --build`. Open `http://localhost:3000`, backend health at `http://localhost:4000/api/health`, AI docs at `http://localhost:8000/docs`, and MinIO console at `http://localhost:9001`. MySQL is initialized from `database/schema.sql` and persisted in `mysql_data`; MinIO objects persist in `minio_data`. Follow [docker/README.md](../docker/README.md) to create a bucket and prove upload, listing, and read-back.

Demo accounts: `driver@parking.local` / `Driver@123`; `operator@parking.local` / `Operator@123`; `admin@parking.local` / `Admin@123`.
