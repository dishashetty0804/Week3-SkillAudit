# AWS deployment guide

1. Create an AWS account, an ECR repository for `frontend`, `backend`, and `ai-service`, an ECS cluster, and a VPC with private subnets for ECS/RDS/ElastiCache plus public subnets for the ALB.
2. Create RDS MySQL 8.4 and ElastiCache Redis in private subnets. Restrict security groups so only ECS can reach ports 3306 and 6379; allow the ALB to reach frontend 80 and backend 4000.
3. Build and publish images: `docker build -t <account>.dkr.ecr.<region>.amazonaws.com/smart-parking-backend:latest ./backend` and repeat for the other services after `aws ecr get-login-password | docker login --username AWS --password-stdin <registry>`.
4. Create ECS task definitions with `PORT`, `JWT_SECRET`, `MYSQL_HOST`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `REDIS_URL`, and `AI_SERVICE_URL` from Secrets Manager. Never commit secrets.
5. Run the schema once from a private migration task: `mysql --host <rds-endpoint> --user parking -p smart_parking < database/schema.sql`.
6. Deploy backend and AI as ECS services; configure ALB target health checks for `/api/health` and `/health`. Serve the frontend behind the ALB or CloudFront/S3 if static hosting is preferred.
7. Add HTTPS with ACM, Route 53 DNS, CloudWatch logs, autoscaling, backups, and alarms. Verify login, reservation conflict handling, operator slot changes, and AI predictions through the public URL.
8. GitHub Actions should build, scan, push images, and update ECS only after tests pass. Use GitHub OIDC rather than long-lived AWS keys.
9. Cleanup: scale ECS to zero, delete services/load balancer, remove ECR images, snapshot/delete RDS, flush ElastiCache, and remove CloudFormation/Terraform state only after backups are confirmed.
