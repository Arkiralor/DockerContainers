# OpenSearch Service

## Usage

- Run with `docker-compose up -d`
- Default ports: 9200, 9600

## Custom Configuration

- Place your custom opensearch.yml in `config/opensearch.yml` and uncomment the relevant line in docker-compose.yml.

## Persistent Data

- Data is stored in the `opensearch_data` volume.

## Healthcheck

- Healthcheck is enabled for reliability.

## Troubleshooting

- Check logs with `docker-compose logs opensearch`.
