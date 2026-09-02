-- TIGER ERP // TEXTILE — gercek proje icin Supabase semasi
-- SQL Editor > New Query icine yapistirip RUN'a basin.
-- Bu dosya "IF NOT EXISTS" kullanir; profiles tablonuz zaten varsa veri kaybetmez.

create extension if not exists "uuid-ossp";

-- ============ Kullanici profilleri (rol + marka/musteri kodu) ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('master_admin','admin','staff','client')),
  brand_code text default 'NEW-BRAND',
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, brand_code)
  values (new.id, new.email, 'client', 'NEW-BRAND')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('master_admin','admin','staff')
  );
$$ language sql security definer stable;

-- ============ Uygulamanin tum verisi (models, bom_items, inventory, ...) ============
-- App.tsx bu tabloyu "key/value" olarak kullanir: her satir bir veri
-- kumesinin (orn. "models") TAMAMINI JSON dizisi olarak tutar.
create table if not exists app_state (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table app_state enable row level security;

-- profiles: herkes kendi profilini gorur, adminler herkesi gorur/yonetir
drop policy if exists "profiles_self_or_admin" on profiles;
create policy "profiles_self_or_admin" on profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_self_insert" on profiles;
create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);

-- app_state: giris yapan HERKES okuyabilir (uygulama zaten marka koduna
-- gore ekranda filtreliyor); SADECE admin/staff yazabilir.
drop policy if exists "app_state_read_all" on app_state;
create policy "app_state_read_all" on app_state
  for select using (auth.uid() is not null);

drop policy if exists "app_state_admin_write" on app_state;
create policy "app_state_admin_write" on app_state
  for insert with check (public.is_admin());

drop policy if exists "app_state_admin_update" on app_state;
create policy "app_state_admin_update" on app_state
  for update using (public.is_admin()) with check (public.is_admin());

-- Baslangic satirlarini olustur (yoksa) ki uygulama ilk acilista hata vermesin
insert into app_state (key, value) values
  ('models', '[]'), ('bom_items', '[]'), ('inventory', '[]'),
  ('logistics', '[]'), ('production', '[]'), ('financials', '[]'),
  ('fabric_color_archives', '[]'), ('financial_transactions', '[]'),
  ('custom_cost_lines', '[]'), ('profiles', '[]')
on conflict (key) do nothing;

-- ============ Bilinen admin hesaplarini admin yapin ============
-- NOT: Bu satirlar sadece o e-postalarla bir kullanici zaten kayit
-- olduysa isler calisir (once uygulamadan "Kayit Ol" ile giris yapilmali).
update profiles set role = 'master_admin', brand_code = 'TIGER-CORP'
  where email in ('celil@gmail.com', 'abdulrahmankashko3@gmail.com');
