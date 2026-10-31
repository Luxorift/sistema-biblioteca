begin;

create table if not exists public.importaciones_excel (
  id uuid primary key default gen_random_uuid(),
  archivo_hash text not null unique check (archivo_hash ~ '^[a-f0-9]{64}$'),
  nombre_archivo text not null check (length(nombre_archivo) between 1 and 255),
  fecha timestamptz not null default now(),
  creado_por uuid not null default auth.uid() references auth.users(id),
  filas integer not null default 0,
  materiales_nuevos integer not null default 0,
  ejemplares_creados integer not null default 0
);
create table if not exists public.importacion_filas (
  id bigint generated always as identity primary key,
  importacion_id uuid not null references public.importaciones_excel(id),
  hoja text not null,
  fila integer not null check (fila > 0),
  material_id bigint not null references public.materiales(id),
  cantidad integer not null check (cantidad between 1 and 500),
  ubicacion_id bigint not null references public.ubicaciones(id),
  originales jsonb not null,
  unique(importacion_id, hoja, fila)
);
create table if not exists public.equivalencias_importacion (
  campo text not null check (campo in ('autor','editorial','tipo','categoria','ubicacion')),
  origen_clave text not null check (length(origen_clave) between 1 and 300),
  destino_id bigint not null,
  actualizado_por uuid not null default auth.uid() references auth.users(id),
  actualizado_en timestamptz not null default now(),
  primary key(campo, origen_clave)
);

alter table public.importaciones_excel enable row level security;
alter table public.importacion_filas enable row level security;
alter table public.equivalencias_importacion enable row level security;
drop policy if exists importaciones_leer on public.importaciones_excel;
create policy importaciones_leer on public.importaciones_excel for select to authenticated using (public.rol_actual() is not null);
drop policy if exists importaciones_crear on public.importaciones_excel;
create policy importaciones_crear on public.importaciones_excel for insert to authenticated with check (public.rol_actual() is not null and creado_por = auth.uid());
drop policy if exists importaciones_completar on public.importaciones_excel;
create policy importaciones_completar on public.importaciones_excel for update to authenticated using (public.rol_actual() is not null and creado_por = auth.uid()) with check (creado_por = auth.uid());
drop policy if exists importacion_filas_leer on public.importacion_filas;
create policy importacion_filas_leer on public.importacion_filas for select to authenticated using (public.rol_actual() is not null);
drop policy if exists importacion_filas_crear on public.importacion_filas;
create policy importacion_filas_crear on public.importacion_filas for insert to authenticated with check (
  public.rol_actual() is not null and exists(select 1 from public.importaciones_excel i where i.id=importacion_id and i.creado_por=auth.uid())
);
drop policy if exists equivalencias_leer on public.equivalencias_importacion;
create policy equivalencias_leer on public.equivalencias_importacion for select to authenticated using (public.rol_actual() is not null);
drop policy if exists equivalencias_crear on public.equivalencias_importacion;
create policy equivalencias_crear on public.equivalencias_importacion for insert to authenticated with check (public.rol_actual() is not null and actualizado_por=auth.uid());
drop policy if exists equivalencias_actualizar on public.equivalencias_importacion;
create policy equivalencias_actualizar on public.equivalencias_importacion for update to authenticated using (public.rol_actual() is not null) with check (actualizado_por=auth.uid());
grant select, insert, update on public.importaciones_excel, public.equivalencias_importacion to authenticated;
grant select, insert on public.importacion_filas to authenticated;
grant usage, select on sequence public.importacion_filas_id_seq to authenticated;

-- Lista cerrada de tablas. No renombra registros existentes durante una importación.
create or replace function public.resolver_catalogo_excel(p_campo text, p_nombre text)
returns bigint language plpgsql set search_path = public as $$
declare v_tabla text; v_id bigint;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  v_tabla := case p_campo when 'autor' then 'autores' when 'editorial' then 'editoriales' when 'tipo' then 'tipos_material' when 'categoria' then 'categorias' end;
  if v_tabla is null or nullif(public.normalizar_texto(p_nombre),'') is null or length(p_nombre)>200 then
    raise exception 'Revisa los nombres de los catálogos';
  end if;
  execute format('insert into public.%I(nombre) values($1) on conflict(nombre_norm) do update set nombre=%I.nombre returning id',v_tabla,v_tabla)
    into v_id using btrim(p_nombre);
  return v_id;
end $$;

create or replace function public.resolver_ubicacion_excel(p_nombre text)
returns bigint language plpgsql set search_path = public as $$
declare v_partes text[]; v_id bigint;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  v_partes := regexp_match(public.normalizar_texto(p_nombre),'^estante ([a-z]) nivel ([0-9]+)$');
  if v_partes is null then raise exception 'Revisa la ubicación: Estante A: Nivel 1'; end if;
  insert into public.ubicaciones(estante,nivel) values(upper(v_partes[1]),v_partes[2]::smallint)
    on conflict(estante,nivel) do update set estante=ubicaciones.estante returning id into v_id;
  return v_id;
end $$;

create or replace function public.contexto_importacion_excel()
returns jsonb language plpgsql stable set search_path = public as $$
declare v_catalogos jsonb; v_materiales jsonb; v_equivalencias jsonb;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  select jsonb_build_object(
    'autor', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by nombre) from autores),'[]'),
    'editorial', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by nombre) from editoriales),'[]'),
    'tipo', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by nombre) from tipos_material),'[]'),
    'categoria', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by nombre) from categorias),'[]'),
    'ubicacion', coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre','Estante '||estante||': Nivel '||nivel) order by estante,nivel) from ubicaciones),'[]')
  ) into v_catalogos;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'titulo',m.titulo,'editorial',e.nombre,'anio',m.anio_publicacion,'tipo',t.nombre,'categoria',c.nombre) order by m.id),'[]')
    into v_materiales from materiales m join tipos_material t on t.id=m.tipo_material_id left join editoriales e on e.id=m.editorial_id left join categorias c on c.id=m.categoria_id;
  select coalesce(jsonb_agg(jsonb_build_object('campo',e.campo,'origen_clave',e.origen_clave,'destino',c.nombre)),'[]') into v_equivalencias
    from equivalencias_importacion e join (
      select 'autor' as campo,id,nombre from autores union all select 'editorial',id,nombre from editoriales
      union all select 'tipo',id,nombre from tipos_material union all select 'categoria',id,nombre from categorias
      union all select 'ubicacion',id,'Estante '||estante||': Nivel '||nivel from ubicaciones
    ) c on c.campo=e.campo and c.id=e.destino_id;
  return jsonb_build_object('catalogos',v_catalogos,'materiales',v_materiales,'equivalencias',v_equivalencias,
    'importaciones',coalesce((select jsonb_agg(to_jsonb(i) order by i.fecha desc) from importaciones_excel i),'[]'));
end $$;

-- Toda la carga es una única transacción. El hash único evita duplicar incluso
-- si dos sesiones confirman a la vez o si se reintenta tras perder la conexión.
create or replace function public.importar_inventario_excel(p_hash text, p_nombre text, p_filas jsonb, p_equivalencias jsonb default '[]')
returns jsonb language plpgsql set search_path = public as $$
declare
  v_import uuid; v_anterior public.importaciones_excel; v_fila jsonb; v_eq jsonb;
  v_tipo bigint; v_categoria bigint; v_ubicacion bigint; v_material bigint; v_esperado bigint;
  v_editorial bigint; v_nuevos bigint[] := '{}'; v_existia boolean;
  v_cantidad integer; v_anio smallint; v_autores text[];
  v_filas integer := 0; v_copias integer := 0; v_destino bigint;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or nullif(btrim(p_nombre),'') is null or length(p_nombre)>255 then
    raise exception 'El archivo no tiene una identificación válida';
  end if;
  if jsonb_typeof(p_filas) is distinct from 'array' or jsonb_array_length(p_filas) not between 1 and 5000 then
    raise exception 'Importa entre 1 y 5.000 filas';
  end if;
  if jsonb_typeof(p_equivalencias) is distinct from 'array' or jsonb_array_length(p_equivalencias)>10000 then raise exception 'Revisa las equivalencias'; end if;
  insert into importaciones_excel(archivo_hash,nombre_archivo) values(p_hash,p_nombre)
    on conflict(archivo_hash) do nothing returning id into v_import;
  if v_import is null then
    select * into v_anterior from importaciones_excel where archivo_hash=p_hash;
    return jsonb_build_object('id',v_anterior.id,'filas',v_anterior.filas,'materiales_nuevos',v_anterior.materiales_nuevos,'ejemplares_creados',v_anterior.ejemplares_creados,'ya_importado',true);
  end if;
  for v_fila in select value from jsonb_array_elements(p_filas) loop
    if nullif(btrim(v_fila->>'titulo'),'') is null or length(v_fila->>'titulo')>300 then raise exception 'Revisa los títulos'; end if;
    v_cantidad := (v_fila->>'cantidad')::integer;
    if v_cantidad is null or v_cantidad not between 1 and 500 then raise exception 'Cada fila debe declarar entre 1 y 500 copias'; end if;
    v_copias := v_copias+v_cantidad;
    if v_copias>50000 then raise exception 'Importa hasta 50.000 copias por operación'; end if;
    v_anio := nullif(v_fila->>'anio','')::smallint;
    if v_anio is not null and v_anio not between 1400 and 2100 then raise exception 'Revisa el año de publicación'; end if;
    if jsonb_typeof(v_fila->'autores') is distinct from 'array' then raise exception 'Revisa los autores'; end if;
    select coalesce(array_agg(value),'{}') into v_autores from jsonb_array_elements_text(v_fila->'autores');
    if exists(select 1 from unnest(v_autores) a where length(a)>200 or nullif(normalizar_texto(a),'') is null) then raise exception 'Revisa los nombres de autores'; end if;
    v_tipo := resolver_catalogo_excel('tipo',v_fila->>'tipo');
    v_categoria := case when nullif(btrim(v_fila->>'categoria'),'') is not null then resolver_catalogo_excel('categoria',v_fila->>'categoria') else null end;
    v_ubicacion := resolver_ubicacion_excel('Estante '||(v_fila->>'estante')||': Nivel '||(v_fila->>'nivel'));
    v_editorial := case when nullif(btrim(v_fila->>'editorial'),'') is not null then resolver_catalogo_excel('editorial',v_fila->>'editorial') else null end;
    v_esperado := nullif(v_fila->>'material_existente_id','')::bigint;
    if v_esperado is not null then
      select id into v_material from materiales where id=v_esperado for update;
      if not found or not exists(select 1 from materiales where id=v_esperado and titulo_norm=normalizar_texto(v_fila->>'titulo') and editorial_id is not distinct from v_editorial and anio_publicacion is not distinct from v_anio) then
        raise exception 'El inventario cambió desde la revisión. Vuelve a analizar el archivo';
      end if;
      -- Las fichas existentes conservan sus metadatos y sus préstamos.
    else
      select material_id,ya_existia into v_material,v_existia from registrar_material(v_fila->>'titulo',v_tipo,v_categoria,v_fila->>'editorial',v_anio,v_autores);
      if v_existia and not (v_material=any(v_nuevos)) then raise exception 'El inventario cambió desde la revisión. Vuelve a analizar el archivo'; end if;
      if v_existia and (
        exists(select 1 from materiales where id=v_material and (tipo_material_id is distinct from v_tipo or categoria_id is distinct from v_categoria))
        or (select coalesce(array_agg(distinct normalizar_texto(a.nombre) order by normalizar_texto(a.nombre)),'{}') from material_autores ma join autores a on a.id=ma.autor_id where ma.material_id=v_material)
          is distinct from (select coalesce(array_agg(distinct normalizar_texto(a) order by normalizar_texto(a)),'{}') from unnest(v_autores) a)
      ) then raise exception 'Las filas de una misma ficha tienen metadatos diferentes; revisa sus autores, tipo y categoría'; end if;
      if not v_existia then v_nuevos := array_append(v_nuevos,v_material); end if;
    end if;
    perform agregar_ejemplares(v_material,v_cantidad,v_ubicacion);
    insert into importacion_filas(importacion_id,hoja,fila,material_id,cantidad,ubicacion_id,originales)
      values(v_import,v_fila->>'hoja',(v_fila->>'fila')::integer,v_material,v_cantidad,v_ubicacion,coalesce(v_fila->'originales','{}'));
    v_filas := v_filas+1;
  end loop;
  for v_eq in select value from jsonb_array_elements(p_equivalencias) loop
    if nullif(normalizar_texto(v_eq->>'origen'),'') is null then continue; end if;
    v_destino := case when v_eq->>'campo'='ubicacion' then resolver_ubicacion_excel(v_eq->>'destino') else resolver_catalogo_excel(v_eq->>'campo',v_eq->>'destino') end;
    insert into equivalencias_importacion(campo,origen_clave,destino_id)
      values(v_eq->>'campo',normalizar_texto(v_eq->>'origen'),v_destino)
      on conflict(campo,origen_clave) do update set destino_id=excluded.destino_id,actualizado_por=auth.uid(),actualizado_en=now();
  end loop;
  update importaciones_excel set filas=v_filas,materiales_nuevos=cardinality(v_nuevos),ejemplares_creados=v_copias where id=v_import;
  return jsonb_build_object('id',v_import,'filas',v_filas,'materiales_nuevos',cardinality(v_nuevos),'ejemplares_creados',v_copias,'ya_importado',false);
end $$;

-- Una sola consulta ofrece una instantánea consistente, sin truncar a 1.000 filas.
create or replace function public.exportar_biblioteca_excel(p_incluir_usuarios boolean default false)
returns jsonb language plpgsql stable set search_path = public as $$
declare v_resultado jsonb;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_incluir_usuarios and public.rol_actual()<>'admin' then raise exception 'Solo un administrador puede exportar los usuarios del sistema'; end if;
  select jsonb_build_object(
    'materiales',coalesce((select jsonb_agg(to_jsonb(m) order by m.id) from (
      select m.id,m.titulo,t.nombre as tipo,c.nombre as categoria,e.nombre as editorial,m.anio_publicacion as anio,m.notas,m.created_at as creado_en,m.updated_at as actualizado_en,
        coalesce((select string_agg(a.nombre,' / ' order by ma.orden,a.id) from material_autores ma join autores a on a.id=ma.autor_id where ma.material_id=m.id),'') as autores,
        (select count(*) from ejemplares x where x.material_id=m.id) as copias_totales,
        (select count(*) from ejemplares x where x.material_id=m.id and x.estado<>'baja') as copias_activas,
        (select count(*) from ejemplares x where x.material_id=m.id and x.estado='disponible') as disponibles
      from materiales m join tipos_material t on t.id=m.tipo_material_id left join categorias c on c.id=m.categoria_id left join editoriales e on e.id=m.editorial_id
    ) m),'[]'),
    'ejemplares',coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from (
      select e.id,e.codigo,e.material_id,m.titulo,e.estado,u.estante,u.nivel,e.observaciones,e.created_at as creado_en
      from ejemplares e join materiales m on m.id=e.material_id left join ubicaciones u on u.id=e.ubicacion_id
    ) e),'[]'),
    'personas',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from (
      select p.id,p.codigo,p.nombres,p.apellido_paterno,p.apellido_materno,p.dni,p.correo,t.nombre as tipo,p.activo,p.created_at as creado_en,
        (select count(*) from prestamos pr where pr.persona_id=p.id and pr.fecha_devolucion is null) as prestamos_pendientes
      from personas p join tipos_persona t on t.id=p.tipo_persona_id
    ) p),'[]'),
    'prestamos',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from (
      select pr.id,e.codigo as ejemplar,m.titulo,p.codigo as credencial,concat_ws(' ',p.nombres,p.apellido_paterno,p.apellido_materno) as persona,p.dni,
        pr.fecha_prestamo,pr.fecha_limite,pr.fecha_devolucion,pr.observaciones,pr.registrado_por,
        case when pr.fecha_limite is null then 0 else greatest(0,(coalesce(pr.fecha_devolucion,now()) at time zone 'America/Lima')::date-pr.fecha_limite) end as dias_atraso,
        case when pr.fecha_devolucion is not null then 'Devuelto' when pr.fecha_limite<(now() at time zone 'America/Lima')::date then 'Atrasado' else 'Pendiente' end as estado
      from prestamos pr join ejemplares e on e.id=pr.ejemplar_id join materiales m on m.id=e.material_id join personas p on p.id=pr.persona_id
    ) p),'[]'),
    'categorias',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by id) from categorias),'[]'),
    'tipos_material',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by id) from tipos_material),'[]'),
    'editoriales',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by id) from editoriales),'[]'),
    'autores',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by id) from autores),'[]'),
    'ubicaciones',coalesce((select jsonb_agg(jsonb_build_object('id',id,'estante',estante,'nivel',nivel) order by id) from ubicaciones),'[]'),
    'tipos_persona',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nombre',nombre) order by id) from tipos_persona),'[]'),
    'importaciones',coalesce((select jsonb_agg(to_jsonb(i) order by fecha) from importaciones_excel i),'[]'),
    'equivalencias',coalesce((select jsonb_agg(to_jsonb(e) order by campo,origen_clave) from equivalencias_importacion e),'[]'),
    'origen_importacion',coalesce((select jsonb_agg(to_jsonb(f) order by id) from importacion_filas f),'[]')
  ) into v_resultado;
  if p_incluir_usuarios then
    v_resultado := v_resultado || jsonb_build_object('usuarios',coalesce((select jsonb_agg(to_jsonb(p)) from perfiles p),'[]'));
  end if;
  return v_resultado;
end $$;

revoke all on function public.resolver_catalogo_excel(text,text),public.resolver_ubicacion_excel(text),public.contexto_importacion_excel(),public.importar_inventario_excel(text,text,jsonb,jsonb),public.exportar_biblioteca_excel(boolean) from public;
grant execute on function public.resolver_catalogo_excel(text,text),public.resolver_ubicacion_excel(text),public.contexto_importacion_excel(),public.importar_inventario_excel(text,text,jsonb,jsonb),public.exportar_biblioteca_excel(boolean) to authenticated;
notify pgrst,'reload schema';
commit;
