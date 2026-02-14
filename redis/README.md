# Redis Service

## Usage

- Run with `docker-compose up -d`
- Default port: 6379

## Custom Configuration

- Place your custom redis.conf in `config/redis.conf` and uncomment the relevant line in docker-compose.yml.

## Persistent Data

- Data is stored in the `redis_data` volume.

## Healthcheck

- Healthcheck is enabled for reliability.

## Troubleshooting

- Check logs with `docker-compose logs redis`.
