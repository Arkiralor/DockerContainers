# Redis Service

## Single Redis Instance

### Usage

- Run with `docker-compose up -d`
- Default port: 6379

### Custom Configuration

- Place your custom redis.conf in `config/redis.conf` and uncomment the relevant line in docker-compose.yml.

### Persistent Data

- Data is stored in the `redis_data` volume.

### Healthcheck

- Healthcheck is enabled for reliability.

### Troubleshooting

- Check logs with `docker-compose logs redis`.

## Multiple Redis Instances

### Usage

- Run all 5 instances: `docker-compose -f docker-compose.multi-redis.yml up -d`
- Run specific instances: `docker-compose -f docker-compose.multi-redis.yml up -d caching celery_base_queues`
- Stop all instances: `docker-compose -f docker-compose.multi-redis.yml down`

### Connection Details

- **caching**: localhost:6379 (General caching)
- **celery_base_queues**: localhost:6380 (Basic Celery task queues)
- **celery_advanced_queues**: localhost:6381 (Advanced/priority Celery queues)
- **multipurpose**: localhost:6382 (Multi-purpose operations)
- **miscellaneous**: localhost:6383 (Miscellaneous tasks)

### Custom Configuration

- Place custom config files in `config/` directory (caching.conf, celery_base_queues.conf, etc.)
- Uncomment the relevant volume mount lines in docker-compose.multi-redis.yml

### Persistent Data

- Each instance has its own volume: `caching_data`, `celery_base_queues_data`, `celery_advanced_queues_data`, `multipurpose_data`, `miscellaneous_data`

### Troubleshooting

- Check logs for specific instance: `docker-compose -f docker-compose.multi-redis.yml logs caching`
- Check logs for all instances: `docker-compose -f docker-compose.multi-redis.yml logs`

### Notes

- The multi-Redis setup runs completely independently of the single instance setup
- You can run both setups simultaneously if needed
- Each Redis instance runs in master mode by default
