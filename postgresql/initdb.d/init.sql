-- Example initialization script for PostgreSQL
-- Place additional .sql files in this directory to initialize schema/data

CREATE TABLE IF NOT EXISTS example (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
