-- =====================================================================
-- Sistema de inventario de biblioteca - Esquema para Supabase (PostgreSQL 15+)
-- Basado en: inventario_final_optimizada.xlsx
-- Sin datos iniciales: los catálogos y materiales se cargan desde el frontend.
-- Pensado para el proyecto con "Automatically expose new tables" DESMARCADO.
-- =====================================================================

-- ---------- 0. Extensiones y utilidades ----------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- Normaliza texto para comparar: minúsculas, sin tildes, sin signos ni espacios dobles.
-- "Economía  Política 5° " y "economia politica 5" dan la misma clave.
create or replace function public.normalizar_texto(t text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public
as $$
  select btrim(regexp_replace(lower(unaccent(coalesce(t, ''))), '[^a-z0-9]+', ' ', 'g'));
$$;

-- ---------- 1. Usuarios del sistema (admin y bibliotecario) ----------
create type public.rol_app as enum ('admin', 'bibliotecario');

create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  rol        public.rol_app not null default 'bibliotecario',
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Rol del usuario autenticado (null si no tiene perfil activo)
create or replace function public.rol_actual()
returns public.rol_app
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid() and activo;
$$;

-- ---------- 2. Catálogos editables por el bibliotecario ----------
create table public.categorias (          -- las 13 hojas del Excel
  id          bigint generated always as identity primary key,
  nombre      text not null check (btrim(nombre) <> ''),
  nombre_norm text generated always as (public.normalizar_texto(nombre)) stored unique
);

create table public.tipos_material (      -- libro, enciclopedia, obra, fábula...
  id          bigint generated always as identity primary key,
  nombre      text not null check (btrim(nombre) <> ''),
  nombre_norm text generated always as (public.normalizar_texto(nombre)) stored unique
);

create table public.editoriales (
  id          bigint generated always as identity primary key,
  nombre      text not null check (btrim(nombre) <> ''),
  nombre_norm text generated always as (public.normalizar_texto(nombre)) stored unique
);

create table public.autores (             -- personas o instituciones (MINEDU, SANTILLANA...)
  id          bigint generated always as identity primary key,
  nombre      text not null check (btrim(nombre) <> ''),
  nombre_norm text generated always as (public.normalizar_texto(nombre)) stored unique
);

create table public.ubicaciones (         -- "Estante B: Nivel 3" => estante 'B', nivel 3
  id      bigint generated always as identity primary key,
  estante text     not null check (estante ~ '^[A-Z]$'),
  nivel   smallint not null check (nivel > 0),
  unique (estante, nivel)
);

-- ---------- 3. Materiales (la "ficha" del título) ----------
create table public.materiales (
  id               bigint generated always as identity primary key,
  titulo           text   not null check (btrim(titulo) <> ''),
  titulo_norm      text generated always as (public.normalizar_texto(titulo)) stored,
  tipo_material_id bigint not null references public.tipos_material (id),
  categoria_id     bigint references public.categorias (id),
  editorial_id     bigint references public.editoriales (id),
  anio_publicacion smallint check (anio_publicacion between 1400 and 2100),
  notas            text,
  created_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references auth.users (id),
  updated_at       timestamptz not null default now()
);

-- ANTIDUPLICADOS: mismo título (sin importar mayúsculas/tildes/espacios)
-- + misma editorial + mismo año = el mismo material. Los NULL cuentan como iguales.
create unique index materiales_unico
  on public.materiales (titulo_norm, editorial_id, anio_publicacion) nulls not distinct;

-- Para sugerir "¿quisiste decir...?" con títulos parecidos
create index materiales_titulo_trgm
  on public.materiales using gin (titulo_norm extensions.gin_trgm_ops);

create table public.material_autores (
  material_id bigint not null references public.materiales (id) on delete cascade,
  autor_id    bigint not null references public.autores (id),
  orden       smallint not null default 1,
  primary key (material_id, autor_id)
);

-- ---------- 4. Ejemplares físicos (cada uno con su código de barras / QR) ----------
create sequence public.seq_codigo_ejemplar;

create type public.estado_ejemplar as enum
  ('disponible', 'prestado', 'en_reparacion', 'perdido', 'baja');

create table public.ejemplares (
  id            bigint generated always as identity primary key,
  material_id   bigint not null references public.materiales (id) on delete restrict,
  codigo        text   not null unique
                default ('BIB-' || lpad(nextval('public.seq_codigo_ejemplar')::text, 6, '0')),
  ubicacion_id  bigint references public.ubicaciones (id),
  estado        public.estado_ejemplar not null default 'disponible',
  observaciones text,
  created_at    timestamptz not null default now(),
  created_by    uuid default auth.uid() references auth.users (id)
);
create index ejemplares_material_idx on public.ejemplares (material_id);

-- ---------- 5. Personas que reciben préstamos (NO inician sesión) ----------
create table public.tipos_persona (
  id          bigint generated always as identity primary key,
  nombre      text not null check (btrim(nombre) <> ''),
  nombre_norm text generated always as (public.normalizar_texto(nombre)) stored unique
);

create table public.personas (
  id               bigint generated always as identity primary key,
  tipo_persona_id  bigint not null references public.tipos_persona (id),
  nombres          text not null check (btrim(nombres) <> ''),
  apellido_paterno text not null check (btrim(apellido_paterno) <> ''),
  apellido_materno text,
  dni              text not null unique check (dni ~ '^[0-9]{8}$'),
  correo           text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references auth.users (id)
);
create index personas_apellidos_idx
  on public.personas (public.normalizar_texto(apellido_paterno || ' ' || coalesce(apellido_materno, '')));

-- ---------- 6. Préstamos ----------
create table public.prestamos (
  id               bigint generated always as identity primary key,
  ejemplar_id      bigint not null references public.ejemplares (id),
  persona_id       bigint not null references public.personas (id),
  fecha_prestamo   timestamptz not null default now(),
  fecha_limite     date,
  fecha_devolucion timestamptz,
  registrado_por   uuid default auth.uid() references auth.users (id),
  observaciones    text,
  check (fecha_devolucion is null or fecha_devolucion >= fecha_prestamo)
);

-- Un ejemplar solo puede tener UN préstamo abierto a la vez
create unique index prestamos_un_abierto_por_ejemplar
  on public.prestamos (ejemplar_id) where fecha_devolucion is null;
create index prestamos_persona_idx on public.prestamos (persona_id);

-- Mantiene ejemplares.estado sincronizado con los préstamos
create or replace function public.prestamo_sincroniza_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.ejemplares set estado = 'prestado'
     where id = new.ejemplar_id and estado = 'disponible';
    if not found then
      raise exception 'El ejemplar no está disponible para préstamo';
    end if;
  elsif old.fecha_devolucion is null and new.fecha_devolucion is not null then
    update public.ejemplares set estado = 'disponible'
     where id = new.ejemplar_id and estado = 'prestado';
  end if;
  return new;
end;
$$;

create trigger trg_prestamo_estado
  after insert or update on public.prestamos
  for each row execute function public.prestamo_sincroniza_estado();

-- ---------- 7. Funciones para la interfaz web ----------

-- Materiales con título parecido (para avisar al bibliotecario antes de crear)
create or replace function public.buscar_similares(p_titulo text, p_umbral real default 0.45)
returns table (id bigint, titulo text, editorial text, anio_publicacion smallint, similitud real)
language sql
stable
set search_path = public, extensions
as $$
  select m.id, m.titulo, e.nombre, m.anio_publicacion,
         similarity(m.titulo_norm, normalizar_texto(p_titulo))
    from materiales m
    left join editoriales e on e.id = m.editorial_id
   where similarity(m.titulo_norm, normalizar_texto(p_titulo)) >= p_umbral
   order by 5 desc
   limit 10;
$$;

-- Registra un material; si ya existe NO lo duplica y devuelve el existente.
create or replace function public.registrar_material(
  p_titulo           text,
  p_tipo_material_id bigint,
  p_categoria_id     bigint   default null,
  p_editorial        text     default null,
  p_anio             smallint default null,
  p_autores          text[]   default '{}'
)
returns table (material_id bigint, ya_existia boolean)
language plpgsql
set search_path = public
as $$
declare
  v_editorial_id bigint;
  v_material_id  bigint;
  v_autor        text;
  v_autor_id     bigint;
  v_orden        smallint := 0;
begin
  if public.rol_actual() is null then
    raise exception 'Sin permiso';
  end if;

  if p_editorial is not null and btrim(p_editorial) <> '' then
    insert into editoriales (nombre) values (btrim(p_editorial)) on conflict do nothing;
    select id into v_editorial_id
      from editoriales where nombre_norm = normalizar_texto(p_editorial);
  end if;

  select m.id into v_material_id
    from materiales m
   where m.titulo_norm = normalizar_texto(p_titulo)
     and m.editorial_id is not distinct from v_editorial_id
     and m.anio_publicacion is not distinct from p_anio;

  if found then
    return query select v_material_id, true;
    return;
  end if;

  begin
    insert into materiales (titulo, tipo_material_id, categoria_id, editorial_id, anio_publicacion)
    values (btrim(p_titulo), p_tipo_material_id, p_categoria_id, v_editorial_id, p_anio)
    returning id into v_material_id;
  exception when unique_violation then   -- otro usuario lo creó justo ahora
    select m.id into v_material_id
      from materiales m
     where m.titulo_norm = normalizar_texto(p_titulo)
       and m.editorial_id is not distinct from v_editorial_id
       and m.anio_publicacion is not distinct from p_anio;
    return query select v_material_id, true;
    return;
  end;

  foreach v_autor in array coalesce(p_autores, '{}') loop
    continue when btrim(v_autor) = '';
    insert into autores (nombre) values (btrim(v_autor)) on conflict do nothing;
    select id into v_autor_id from autores where nombre_norm = normalizar_texto(v_autor);
    v_orden := v_orden + 1;
    insert into material_autores (material_id, autor_id, orden)
    values (v_material_id, v_autor_id, v_orden) on conflict do nothing;
  end loop;

  return query select v_material_id, false;
end;
$$;

-- Crea N ejemplares (cada uno con su código único para imprimir)
create or replace function public.agregar_ejemplares(
  p_material_id  bigint,
  p_cantidad     int,
  p_ubicacion_id bigint default null
)
returns setof public.ejemplares
language plpgsql
set search_path = public
as $$
begin
  if public.rol_actual() is null then
    raise exception 'Sin permiso';
  end if;
  if p_cantidad < 1 or p_cantidad > 500 then
    raise exception 'Cantidad fuera de rango (1-500)';
  end if;

  return query
    insert into ejemplares (material_id, ubicacion_id)
    select p_material_id, p_ubicacion_id from generate_series(1, p_cantidad)
    returning *;
end;
$$;

-- ---------- 8. Seguridad (RLS) ----------
alter table public.perfiles enable row level security;

create policy perfiles_ver on public.perfiles for select to authenticated
  using (id = auth.uid() or public.rol_actual() = 'admin');
create policy perfiles_admin on public.perfiles for all to authenticated
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

do $$
declare t text;
begin
  foreach t in array array[
    'categorias','tipos_material','editoriales','autores','ubicaciones',
    'materiales','material_autores','ejemplares',
    'tipos_persona','personas','prestamos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy personal_biblioteca on public.%I for all to authenticated
         using (public.rol_actual() is not null)
         with check (public.rol_actual() is not null)', t);
  end loop;
end $$;

-- ---------- 9. Permisos para la Data API (supabase-js) ----------
-- Necesarios porque "Automatically expose new tables" está desmarcado.
-- Solo el rol authenticated; el rol anónimo no recibe nada.
grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;   -- unaccent / pg_trgm (en Supabase ya suele estar concedido)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ---------- 10. Primer administrador (ejecutar UNA vez, a mano) ----------
-- 1) Crea tu usuario en Supabase: Authentication > Users > Add user.
-- 2) Copia su UUID y ejecuta (sin los guiones iniciales):
--
--   insert into public.perfiles (id, nombre, rol)
--   values ('PEGA-AQUI-EL-UUID', 'Tu nombre', 'admin');
--
-- Después crea el usuario del bibliotecario igual, con rol 'bibliotecario'.
-- Sin un perfil activo, RLS bloquea todo (por diseño).
