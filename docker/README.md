# Containers and local object storage

Service Dockerfiles live beside each service. `docker-compose.yml` starts the app, MySQL, Redis, the AI API, and MinIO with one command. The project Dockerfiles use small official base images and the frontend installs its locked dependencies with `npm ci`.

## Start the stack

From the project root, run `docker compose up --build`. Open the app at <http://localhost:3000>, the MinIO S3 API at <http://localhost:9000>, and the MinIO console at <http://localhost:9001>. Local MinIO credentials default to `minioadmin` / `minioadmin123` and can be overridden with environment variables.

## Prove S3 upload and read-back

Keep the stack running, then run from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r docker/storage/requirements.txt
.\.venv\Scripts\python docker/storage/s3_demo.py
```

The script creates the `parking-demo` bucket, uploads `hello-minio.txt`, lists the bucket, downloads and checks the object, then saves the verified copy to `docker/storage/hello-minio-downloaded.txt`. `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` can be set to use a different S3-compatible service.

Production image publishing and ECS configuration are described in `docs/AWS_DEPLOYMENT_GUIDE.md`.
