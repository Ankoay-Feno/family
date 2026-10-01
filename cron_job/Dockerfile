# Web service minimal (plan gratuit) : garde la db active et réveille plusieurs URLs.
#   - sert /health sur $PORT (health check de la plateforme)
#   - cron_job interne (ping.sh) : ping de la db toutes les DB_PING_INTERVAL s,
#     appel des URLs de PING_URLS toutes les URL_PING_INTERVAL s
#
# Réglages du service :
#   Runtime           : Docker
#   Dockerfile Path   : ./cron_job/Dockerfile
#   Docker Context    : ./cron_job
#   Health Check Path : /health
#   Env vars          : DB_URL, DB_API_KEY, PING_URLS (voir ping.sh)
#
# Test local :
#   docker build -t db-ping cron_job
#   docker run --rm -p 10000:10000 -e DB_URL=https://xxxx.supabase.co -e DB_API_KEY=... \
#     -e PING_URLS=http://127.0.0.1:10000/health db-ping

FROM alpine:3.22

# busybox-extras fournit httpd ; l'image tourne en utilisateur non-root.
RUN apk add --no-cache curl busybox-extras \
 && adduser -D -H app

COPY ping.sh /ping.sh
COPY www /www

ENV PORT=10000
EXPOSE 10000
USER app

# Script passé à /bin/sh : pas de dépendance au bit d'exécution ni à BuildKit (--chmod).
ENTRYPOINT ["/bin/sh", "/ping.sh"]
