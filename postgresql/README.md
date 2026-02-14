# PostgreSQL Service

## Usage

- Run with `docker-compose up -d`
- Default port: 5432

## Custom Configuration

- Place your custom postgresql.conf in `config/postgresql.conf` and uncomment the relevant line in docker-compose.yml.

## Initialization Scripts

- Place SQL scripts in `initdb.d/` to initialize schema/data.

## Persistent Data

- Data is stored in the `postgres_data` volume.

## Healthcheck

- Healthcheck is enabled for reliability.

## Troubleshooting

- Check logs with `docker-compose logs postgres`.
