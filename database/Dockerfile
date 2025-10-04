# syntax=docker/dockerfile:1
# Build a Postgres image using the classic builder so docker-compose v1 can
# recreate the container without hitting the Docker 27 `ContainerConfig` issue.
FROM postgres:14

# No additional build steps required; inheriting the upstream image while
# forcing a classic-builder rebuild is enough to restore the legacy metadata.
