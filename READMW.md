# DockerContainers

This repository contains ready-to-use Docker Compose configurations for popular open-source services:

- **OpenSearch**: Search and analytics engine
- **PostgreSQL**: Relational database
- **Redis**: In-memory data store

## Structure

- `opensearch/` — OpenSearch Compose setup
- `postgresql/` — PostgreSQL Compose setup
- `redis/` — Redis Compose setup

Each service folder includes:

- `docker-compose.yml`: Main Compose file
- `config/`: Custom configuration files
- `README.md`: Service-specific instructions

## Usage

1. Clone this repository:

   ```bash
   git clone https://github.com/Arkiralor/DockerContainers.git
   cd DockerContainers
   ```

2. Start a service (example for PostgreSQL):

   ```bash
   cd postgresql
   docker-compose up -d
   ```

3. Stop a service:

   ```bash
   docker-compose down
   ```

## Customization

Edit the config files in each service folder to adjust settings as needed.

## License

See LICENSE.md for details. This project uses a copyleft license.

## Contributions

Pull requests and issues are welcome!
