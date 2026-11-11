-- Ejecutar en Supabase > SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  origen text not null check (origen in ('cliente','consultor')),
  estado text not null default 'recibido'
    check (estado in ('recibido','en_revision','analizando','analizado','propuesta_enviada','ganado','perdido')),
  empresa text not null,
  contacto_nombre text,
  contacto_email text,
  respuestas jsonb not null,
  notas_consultor text,
  tarifa_hora_usd numeric not null default 40,
  resultado jsonb,
  error_analisis text,
  analizado_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null
);

create index if not exists diagnosticos_created_idx on public.diagnosticos (created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists diagnosticos_touch on public.diagnosticos;
create trigger diagnosticos_touch before update on public.diagnosticos
for each row execute function public.touch_updated_at();

-- RLS: solo usuarios autenticados (consultores) leen/escriben.
-- El formulario público y el informe compartido usan la service role desde el servidor.
alter table public.diagnosticos enable row level security;

drop policy if exists "consultores_all" on public.diagnosticos;
create policy "consultores_all" on public.diagnosticos
  for all to authenticated using (true) with check (true);
