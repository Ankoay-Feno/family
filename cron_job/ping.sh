#!/bin/sh
# Web service minimal : sert /health sur $PORT et fait tourner un cron_job interne
# qui (1) pinge la db pour la garder active et (2) appelle une ou plusieurs URLs
# HTTPS pour garder des services gratuits réveillés.
#
# Variables :
#   DB_URL                 (requis)        base de l'API Supabase, ex. https://xxxx.supabase.co
#   DB_API_KEY             (requis)        clé publique de l'API Supabase
#   PING_URLS              (optionnel)     URLs HTTPS à appeler à chaque tick.
#                                          Séparateurs acceptés : virgule, espace, retour ligne.
#   KEEPALIVE_URL          (optionnel)     ancien nom, ajouté à PING_URLS si présent.
#   URL_PING_INTERVAL      (défaut 600)    période des appels PING_URLS, en secondes.
#   KEEPALIVE_INTERVAL     (ancien nom)    utilisé si URL_PING_INTERVAL est absent.
#   DB_PING_INTERVAL       (défaut 21600)  période du ping db, en secondes (6 h)
#   PORT                   (défaut 10000)  port d'écoute HTTP
#
# La fonction `ping` doit exister côté db : voir ping.sql.
# Pas de `set -e` : un curl en échec ne doit pas tuer la boucle.
set -u

DB_URL="${DB_URL:-${SUPABASE_URL:-}}"
DB_API_KEY="${DB_API_KEY:-${SUPABASE_PUBLISHABLE_KEY:-${SUPABASE_ANON_KEY:-}}}"
: "${DB_URL:?DB_URL manquante (ex. https://xxxx.supabase.co)}"
: "${DB_API_KEY:?DB_API_KEY manquante (clé publique de l'API)}"
PING_URLS="${PING_URLS:-}"
KEEPALIVE_URL="${KEEPALIVE_URL:-}"
URL_PING_INTERVAL="${URL_PING_INTERVAL:-${KEEPALIVE_INTERVAL:-600}}"
DB_PING_INTERVAL="${DB_PING_INTERVAL:-21600}"
PORT="${PORT:-10000}"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# --- serveur HTTP : health check + cible du keepalive ---------------------------
httpd -f -p "0.0.0.0:${PORT}" -h /www &
HTTPD_PID=$!
log "httpd en écoute sur :${PORT} (/health)"

cleanup() {
  log "arrêt demandé"
  kill "$HTTPD_PID" 2>/dev/null
  exit 0
}
trap cleanup TERM INT

# --- ping de la db --------------------------------------------------------------
# --fail : échec sur HTTP ≥ 400 ; --retry : quelques tentatives si réveil lent.
ping_db() {
  endpoint="${DB_URL%/}/rest/v1/rpc/ping"
  if curl --fail --silent --show-error --max-time 30 \
       --retry 3 --retry-delay 10 --retry-all-errors \
       -X POST "${endpoint}" -H "apikey: ${DB_API_KEY}"; then
    echo
    log "ping db OK"
    return 0
  fi
  log "ping db en ÉCHEC, nouvelle tentative au prochain tick"
  return 1
}

# --- ping des URLs : requêtes entrantes pour garder les services en marche ------
urls_to_ping() {
  printf '%s\n%s\n' "${PING_URLS}" "${KEEPALIVE_URL}" | tr ', ' '\n\n' | sed '/^[[:space:]]*$/d'
}

ping_urls() {
  urls="$(urls_to_ping)"
  if [ -z "${urls}" ]; then
    log "ping URLs ignoré (PING_URLS vide)"
    return 0
  fi
  i=0
  printf '%s\n' "${urls}" | while IFS= read -r url; do
    i=$((i + 1))
    code=$(curl --silent --max-time 30 --retry 2 --retry-delay 5 --retry-all-errors \
      -o /dev/null -w '%{http_code}' "${url}" 2>/dev/null)
    [ -n "${code}" ] || code=000
    case "${code}" in
      2*|3*) log "URL #${i} → HTTP ${code}" ;;
      *)     log "URL #${i} en ÉCHEC → HTTP ${code}" ;;
    esac
  done
}

# --- boucle principale ----------------------------------------------------------
next_db=0
while :; do
  if ! kill -0 "$HTTPD_PID" 2>/dev/null; then
    log "httpd arrêté de façon inattendue, sortie"
    exit 1
  fi
  now=$(date +%s)
  if [ "${now}" -ge "${next_db}" ]; then
    ping_db && next_db=$((now + DB_PING_INTERVAL))
  fi
  ping_urls
  # sleep en arrière-plan + wait : le trap TERM est pris en compte sans attendre.
  sleep "${URL_PING_INTERVAL}" & wait $!
done
