# cron_job : ping quotidien de la db pour éviter sa mise en pause
# (les instances gratuites sont suspendues après 7 jours sans requête).
#
# Réglages du cron_job :
#   Runtime         : Docker
#   Dockerfile Path : ./cron_job/Dockerfile
#   Docker Context  : ./cron_job
#   Schedule        : 0 6 * * *   (tous les jours à 06:00 UTC)
#   Env vars        : DB_URL, DB_API_KEY (voir ping.sh)
#
# Test local :
#   docker build -t db-ping cron_job
#   docker run --rm -e DB_URL=https://xxxx.example.com -e DB_API_KEY=... db-ping

FROM curlimages/curl:8.22.0

COPY ping.sh /ping.sh

# L'image tourne déjà en utilisateur non-root ; on passe le script à /bin/sh
# pour ne pas dépendre du bit d'exécution ni de BuildKit (--chmod).
ENTRYPOINT ["/bin/sh", "/ping.sh"]
