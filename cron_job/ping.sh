#!/bin/sh
# Appelle la fonction RPC `ping` de la db pour la garder active.
#
# Variables attendues (à définir dans le cron_job, jamais en dur ici) :
#   DB_URL      URL de base de l'API de la db, ex. https://xxxx.example.com
#   DB_API_KEY  clé publique de l'API
#
# La fonction `ping` doit exister côté db : voir ping.sql.
set -eu

: "${DB_URL:?DB_URL manquante (ex. https://xxxx.example.com)}"
: "${DB_API_KEY:?DB_API_KEY manquante (clé publique de l'API)}"

endpoint="${DB_URL%/}/rest/v1/rpc/ping"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] POST ${endpoint}"

# --fail : code de sortie ≠ 0 sur HTTP ≥ 400 → le run du cron_job est marqué en échec.
# --retry : quelques tentatives en cas de réveil lent ou d'erreur passagère.
curl --fail --silent --show-error \
  --max-time 30 \
  --retry 3 --retry-delay 10 --retry-all-errors \
  -X POST "${endpoint}" \
  -H "apikey: ${DB_API_KEY}"

echo
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ping OK"
