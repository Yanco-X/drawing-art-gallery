-- The account the web app connects as: rows only, no schema changes, and
-- the users table read-only. Run once per database as the account that owns
-- the tables (sketchyart locally, postgres on Railway), after they exist:
--
--   alembic upgrade head
--   cat scripts/app_role.sql | docker compose exec -T db psql -U sketchyart -d sketchyart
--
-- Then give it a password from psql, which sends the server a hash and keeps
-- the value out of the log and the shell history. Alphanumeric, so the URL
-- needs no escaping:
--
--   \password gallery_app
--
-- The default privileges cover tables later migrations create, as long as
-- migrations keep running as the owner account (ADMIN_DATABASE_URL).

CREATE ROLE gallery_app LOGIN;
ALTER ROLE gallery_app SET statement_timeout = '30s';

GRANT USAGE ON SCHEMA public TO gallery_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gallery_app;

-- Only `flask set-owner` writes users, and it runs as the owner account.
REVOKE INSERT, UPDATE, DELETE ON users FROM gallery_app;
REVOKE ALL ON alembic_version FROM gallery_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gallery_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO gallery_app;
