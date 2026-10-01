# Dockhand stack

Create a Git stack in Dockhand with:

- Repository: `https://github.com/farhouse/appointment_os.git`
- Branch: `main`
- Compose file: `deploy/dockhand/compose.yml`

Copy the variables from `.env.example` into the stack's Environment panel and
replace the three placeholder secrets. Mark `POSTGRES_PASSWORD`, `JWT_SECRET`,
and `JWT_REFRESH_SECRET` as secrets. Use URL-safe values; for example, generate
each one with `openssl rand -hex 32`.

If the GHCR package is private, configure `ghcr.io` in Dockhand's registry
credentials before deploying. Otherwise, make the package public in GitHub.

After deployment, open `http://<docker-host>:<APP_PORT>/setup` to create the
initial owner account.
