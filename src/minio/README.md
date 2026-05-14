# libreFS Service

**S3-compatible object storage for local development**

## Overview

libreFS is a community fork of MinIO's last open-source release, licensed under AGPL-3.0. It
provides a fully S3-compatible object storage server with a browser-based web console for bucket
management. libreFS is a drop-in replacement for MinIO: it supports the same S3 API, the same
environment variables, and the same admin interface.

This setup is designed for local development use, providing persistent storage, health monitoring,
and resource limits to prevent system issues.

## Prerequisites

- **Docker**: v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.0+ (included with Docker Desktop)

## Quick Start

```bash
# Using Make (recommended)
make start-minio

# Or using docker compose directly
cd src/minio
docker compose up -d

# Verify it's running
make status
# or
docker compose ps
```

Once started, access the web console at [http://localhost:9001](http://localhost:9001) and log in
with the default credentials.

## Configuration

### Default Credentials

| Parameter | Value |
|-----------|-------|
| **Root User** | `minioadmin` |
| **Root Password** | `minioadmin` |

These credentials also serve as the S3 access key and secret key for API access.

### Ports

| Port | Purpose |
|------|---------|
| **9000** | S3 API (used by applications to interact with storage) |
| **9001** | Web Console (browser-based admin UI for bucket management) |

### Environment Variables

See `example.env` for all available configuration options:

```bash
MINIO_ROOT_USER=minioadmin          # Root user / S3 access key
MINIO_ROOT_PASSWORD=minioadmin      # Root password / S3 secret key
LIBREFS_API_PORT=9000               # S3 API port
LIBREFS_CONSOLE_PORT=9001           # Web console port
```

Copy `example.env` to `.env` and adjust values as needed.

## Usage

### Creating a Bucket via Web Console

1. Open [http://localhost:9001](http://localhost:9001) in your browser.
2. Log in with `minioadmin` / `minioadmin`.
3. Navigate to "Buckets" and click "Create Bucket".
4. Enter a bucket name and confirm.

### Creating a Bucket via AWS CLI

```bash
aws --endpoint-url http://localhost:9000 \
    s3 mb s3://my-bucket
```

Make sure the AWS CLI is configured with the libreFS credentials:

```bash
aws configure
# AWS Access Key ID: minioadmin
# AWS Secret Access Key: minioadmin
# Default region name: us-east-1
# Default output format: json
```

### Uploading and Downloading Files

```bash
# Upload a file
aws --endpoint-url http://localhost:9000 \
    s3 cp myfile.txt s3://my-bucket/myfile.txt

# Download a file
aws --endpoint-url http://localhost:9000 \
    s3 cp s3://my-bucket/myfile.txt ./downloaded.txt

# List bucket contents
aws --endpoint-url http://localhost:9000 \
    s3 ls s3://my-bucket/
```

## Connecting from Applications

### Endpoint Configuration

| Parameter | Value |
|-----------|-------|
| **Endpoint URL** | `http://localhost:9000` |
| **Access Key** | `minioadmin` |
| **Secret Key** | `minioadmin` |
| **Region** | `us-east-1` (or any value; libreFS ignores it) |
| **Path Style** | `true` (required for non-AWS S3 endpoints) |

### Python (boto3)

```python
import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="http://localhost:9000",
    aws_access_key_id="minioadmin",
    aws_secret_access_key="minioadmin",
    region_name="us-east-1",
)

# Create a bucket
s3.create_bucket(Bucket="my-bucket")

# Upload a file
s3.upload_file("local-file.txt", "my-bucket", "remote-key.txt")

# Generate a presigned download URL (1 hour expiry)
url = s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": "my-bucket", "Key": "remote-key.txt"},
    ExpiresIn=3600,
)
print(url)
```

### Django (django-storages)

In your Django `settings.py`:

```python
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_S3_ENDPOINT_URL = "http://localhost:9000"
AWS_ACCESS_KEY_ID = "minioadmin"
AWS_SECRET_ACCESS_KEY = "minioadmin"
AWS_STORAGE_BUCKET_NAME = "my-bucket"
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_S3_ADDRESSING_STYLE = "path"
```

## Resource Limits

| Resource | Limit |
|----------|-------|
| **Memory** | 512 MB |
| **CPU** | 0.5 |
| **Memory Reserved** | 256 MB |

Adjust these in `docker-compose.yml` under `deploy.resources` if needed.

## Make Commands

```bash
make start-minio        # Start libreFS
make stop-minio         # Stop libreFS
make restart-minio      # Restart libreFS
make suspend-minio      # Stop and remove container
make logs-minio         # Follow libreFS logs
make shell-minio        # Open shell in libreFS container
```

## Health Check

The container includes a health check that verifies the S3 API is responsive:

```bash
curl -f http://localhost:9000/minio/health/live
```

This endpoint returns HTTP 200 when the server is healthy. The Docker health check runs every
30 seconds with a 10-second timeout and 5 retries.

## Data Persistence

Object data is stored in the `librefs_data` Docker volume, which persists across container
restarts. To verify the volume exists:

```bash
docker volume inspect minio_librefs_data
```

## Troubleshooting

### Port Conflicts

If ports 9000 or 9001 are already in use:

```bash
# Check what is using the port
lsof -i :9000
lsof -i :9001
```

Stop the conflicting process or modify the port mappings in `docker-compose.yml`.

### Container Won't Start

```bash
# Check container logs
make logs-minio

# Check container status
docker ps -a | grep librefs
```

### Health Check Failing

If the container starts but the health check fails:

```bash
# Check if the S3 API is reachable
curl -v http://localhost:9000/minio/health/live

# Check container resource usage
docker stats librefs --no-stream
```

### Data Not Persisting

Verify the Docker volume exists and is mounted:

```bash
docker volume ls | grep librefs
docker inspect librefs | grep -A5 Mounts
```
