-- Fonction RPC appelée par cron_job/ping.sh via POST /rest/v1/rpc/ping.
-- À exécuter une fois sur la db.
--
-- Elle ne lit aucune table : son seul rôle est de générer une requête
-- authentifiée (clé publique) pour que la db ne soit pas mise en pause.

create or replace function public.ping()
returns text
language sql
stable
as $$
  select 'pong'::text;
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated, service_role;
