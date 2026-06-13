-- 1. Tabela de perfis (vinculada ao auth.users)
create table public.perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null,
  email     text not null,
  role      text not null check (role in ('gestor', 'vendedor')),
  criado_em timestamptz default now()
);

-- 2. Tabela de leads
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  vendedor_id  uuid not null references public.perfis(id) on delete set null,
  nome         text not null,
  telefone     text not null,
  placa        text not null,
  seguro       text check (seguro in ('sim', 'nao')),
  valor_seguro text,
  criado_em    timestamptz default now()
);

-- 3. Row Level Security
alter table public.perfis enable row level security;
alter table public.leads   enable row level security;

-- Perfis: cada um lê o próprio; gestor lê todos
create policy "leitura_propria" on public.perfis
  for select using (auth.uid() = id);

create policy "gestor_le_todos_perfis" on public.perfis
  for select using (
    exists (select 1 from public.perfis p where p.id = auth.uid() and p.role = 'gestor')
  );

-- Leads: vendedor vê só os seus; gestor vê todos
create policy "vendedor_ve_seus_leads" on public.leads
  for select using (vendedor_id = auth.uid());

create policy "gestor_ve_todos_leads" on public.leads
  for select using (
    exists (select 1 from public.perfis p where p.id = auth.uid() and p.role = 'gestor')
  );

create policy "vendedor_insere_lead" on public.leads
  for insert with check (vendedor_id = auth.uid());
