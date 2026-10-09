FROM postgis/postgis:16-3.4

# Copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=5s --timeout=5s --retries=10 \
  CMD pg_isready -U ${POSTGRES_USER:-tript_user} -d ${POSTGRES_DB:-tript_dhara} || exit 1
