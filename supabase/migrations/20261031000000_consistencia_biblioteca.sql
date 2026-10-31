-- Ejecutar DESPUÉS del esquema inicial. No elimina datos ni cuentas.
begin;

-- Credenciales para TODAS las personas. El código no contiene el DNI y su prefijo
-- lo distingue del BIB- de los ejemplares. Se completa también para filas existentes.
-- Derivarlo del ID evita duplicados y conserva el código al reimprimir la credencial.
-- greatest evita truncar el número cuando el ID supera los seis dígitos.
alter table public.personas add column if not exists codigo text
  generated always as ('PER-' || lpad(id::text, greatest(6, length(id::text)), '0')) stored;
alter table public.personas alter column codigo set not null;
create unique index if not exists personas_codigo_unico on public.personas(codigo);

create or replace function public.proteger_identificador_persona()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is distinct from old.id then
    raise exception 'No se puede cambiar el identificador de una persona con credencial';
  end if;
  return new;
end $$;
drop trigger if exists trg_identificador_persona on public.personas;
create trigger trg_identificador_persona before update on public.personas
for each row execute function public.proteger_identificador_persona();

-- No permitir préstamos duplicados, incluso si faltaba el índice en el proyecto remoto.
create unique index if not exists prestamos_un_abierto_por_ejemplar
  on public.prestamos(ejemplar_id) where fecha_devolucion is null;

-- Reparar estados anteriores tomando los préstamos abiertos como fuente de verdad.
update public.ejemplares e set estado = 'prestado'
where exists (select 1 from public.prestamos p where p.ejemplar_id = e.id and p.fecha_devolucion is null)
  and e.estado <> 'prestado';
update public.ejemplares e set estado = 'disponible'
where estado = 'prestado' and not exists (
  select 1 from public.prestamos p where p.ejemplar_id = e.id and p.fecha_devolucion is null
);

create or replace function public.validar_prestamo()
returns trigger language plpgsql set search_path = public as $$
declare v_activo boolean; v_estado public.estado_ejemplar;
begin
  if tg_op = 'DELETE' then
    raise exception 'Los préstamos forman parte del historial y no se pueden eliminar';
  end if;
  if tg_op = 'UPDATE' then
    if (new.ejemplar_id, new.persona_id, new.fecha_prestamo, new.registrado_por)
       is distinct from (old.ejemplar_id, old.persona_id, old.fecha_prestamo, old.registrado_por) then
      raise exception 'No se puede cambiar la identidad de un préstamo registrado';
    end if;
    if old.fecha_devolucion is not null and new is distinct from old then
      raise exception 'Un préstamo devuelto no se puede modificar';
    end if;
  else
    if new.fecha_devolucion is not null then
      raise exception 'Un préstamo nuevo debe estar pendiente';
    end if;
    -- Bloquear la persona evita prestar mientras otra sesión la desactiva.
    select activo into v_activo from public.personas where id = new.persona_id for update;
    if not coalesce(v_activo, false) then raise exception 'La persona no está activa'; end if;
    select estado into v_estado from public.ejemplares where id = new.ejemplar_id for update;
    if v_estado is distinct from 'disponible'::public.estado_ejemplar then
      raise exception 'El ejemplar no está disponible para préstamo';
    end if;
  end if;
  if new.fecha_prestamo is null or (new.fecha_prestamo at time zone 'America/Lima')::date > (now() at time zone 'America/Lima')::date then
    raise exception 'La fecha de préstamo no puede ser futura';
  end if;
  if new.fecha_limite < (new.fecha_prestamo at time zone 'America/Lima')::date then
    raise exception 'La fecha límite no puede ser anterior al préstamo';
  end if;
  if new.fecha_devolucion is not null and (
    new.fecha_devolucion < new.fecha_prestamo or
    (new.fecha_devolucion at time zone 'America/Lima')::date > (now() at time zone 'America/Lima')::date
  ) then raise exception 'Fecha de devolución inválida'; end if;
  return new;
end $$;
drop trigger if exists trg_validar_prestamo on public.prestamos;
create trigger trg_validar_prestamo before insert or update or delete on public.prestamos
for each row execute function public.validar_prestamo();

create or replace function public.prestamo_sincroniza_estado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.ejemplares set estado = 'prestado'
    where id = new.ejemplar_id and estado = 'disponible';
    if not found then raise exception 'El ejemplar no está disponible para préstamo'; end if;
  elsif old.fecha_devolucion is null and new.fecha_devolucion is not null then
    update public.ejemplares set estado = 'disponible' where id = new.ejemplar_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_prestamo_estado on public.prestamos;
create trigger trg_prestamo_estado after insert or update on public.prestamos
for each row execute function public.prestamo_sincroniza_estado();

-- Revisar el estado FINAL de la transacción permite los cambios del trigger anterior,
-- pero rechaza cambiar manualmente el estado sin registrar préstamo/devolución.
create or replace function public.comprobar_estado_ejemplar()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_estado public.estado_ejemplar; v_abierto boolean;
begin
  v_id := new.id;
  select estado into v_estado from public.ejemplares where id = v_id;
  if not found then return null; end if;
  select exists(select 1 from public.prestamos where ejemplar_id = v_id and fecha_devolucion is null) into v_abierto;
  if (v_estado = 'prestado') <> v_abierto then
    raise exception 'El estado del ejemplar debe coincidir con sus préstamos abiertos';
  end if;
  return null;
end $$;
drop trigger if exists trg_consistencia_ejemplar on public.ejemplares;
create constraint trigger trg_consistencia_ejemplar after insert or update on public.ejemplares
deferrable initially deferred for each row execute function public.comprobar_estado_ejemplar();

create or replace function public.validar_persona_activa()
returns trigger language plpgsql set search_path = public as $$
begin
  if not new.activo and old.activo and exists (
    select 1 from public.prestamos where persona_id = new.id and fecha_devolucion is null
  ) then raise exception 'La persona tiene préstamos pendientes'; end if;
  return new;
end $$;
drop trigger if exists trg_persona_activa on public.personas;
create trigger trg_persona_activa before update on public.personas
for each row execute function public.validar_persona_activa();

create or replace function public.devolver_prestamo(p_prestamo_id bigint, p_fecha date)
returns bigint language plpgsql set search_path = public as $$
declare v_prestamo public.prestamos;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  select * into v_prestamo from public.prestamos where id = p_prestamo_id for update;
  if not found or v_prestamo.fecha_devolucion is not null then
    raise exception 'El préstamo ya fue devuelto o no está disponible';
  end if;
  if p_fecha is null or p_fecha < (v_prestamo.fecha_prestamo at time zone 'America/Lima')::date
    or p_fecha > (now() at time zone 'America/Lima')::date then
    raise exception 'La fecha de devolución debe estar entre el préstamo y hoy';
  end if;
  update public.prestamos set fecha_devolucion = greatest(
    (p_fecha + time '12:00') at time zone 'America/Lima', v_prestamo.fecha_prestamo
  ) where id = p_prestamo_id;
  return p_prestamo_id;
end $$;

create or replace function public.actualizar_material(
  p_material_id bigint, p_titulo text, p_tipo_material_id bigint,
  p_categoria_id bigint, p_editorial text, p_anio smallint, p_autores text[],
  p_cantidad_total integer, p_cantidad_disponibles integer
)
returns void language plpgsql set search_path = public as $$
declare
  v_editorial bigint; v_autor bigint; v_nombre text; v_orden smallint := 0;
  v_total integer; v_prestados integer; v_disponibles integer; v_reparacion integer;
  v_cambio integer; v_filas integer;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_cantidad_total is null or p_cantidad_disponibles is null or
     p_cantidad_total < 0 or p_cantidad_disponibles < 0 then
    raise exception 'disponibles_invalidos';
  end if;
  perform 1 from public.materiales where id = p_material_id for update;
  if not found then raise exception 'Material no encontrado'; end if;
  perform id from public.ejemplares where material_id = p_material_id order by id for update;
  select count(*), count(*) filter(where estado = 'prestado') into v_total, v_prestados
    from public.ejemplares where material_id = p_material_id and estado <> 'baja';
  if p_cantidad_total < v_prestados then raise exception 'prestados_bloquean'; end if;
  if p_cantidad_disponibles > p_cantidad_total - v_prestados then
    raise exception 'disponibles_invalidos';
  end if;
  if nullif(btrim(p_editorial), '') is not null then
    insert into public.editoriales(nombre) values(btrim(p_editorial))
      on conflict(nombre_norm) do update set nombre = editoriales.nombre returning id into v_editorial;
  end if;
  update public.materiales set titulo = btrim(p_titulo), tipo_material_id = p_tipo_material_id,
    categoria_id = p_categoria_id, editorial_id = v_editorial, anio_publicacion = p_anio,
    updated_at = now() where id = p_material_id;
  delete from public.material_autores where material_id = p_material_id;
  foreach v_nombre in array coalesce(p_autores, '{}'::text[]) loop
    continue when nullif(btrim(v_nombre), '') is null;
    insert into public.autores(nombre) values(btrim(v_nombre))
      on conflict(nombre_norm) do update set nombre = autores.nombre returning id into v_autor;
    v_orden := v_orden + 1;
    insert into public.material_autores(material_id, autor_id, orden)
      values(p_material_id, v_autor, v_orden) on conflict do nothing;
  end loop;
  if p_cantidad_total > v_total then
    if p_cantidad_total - v_total > 500 then raise exception 'Cantidad fuera de rango (1-500)'; end if;
    perform public.agregar_ejemplares(p_material_id, p_cantidad_total - v_total, null);
  elsif p_cantidad_total < v_total then
    v_cambio := v_total - p_cantidad_total;
    update public.ejemplares set estado = 'baja' where id in (
      select id from public.ejemplares where material_id = p_material_id
        and estado in ('disponible', 'en_reparacion') order by id limit v_cambio
    );
    get diagnostics v_filas = row_count;
    if v_filas <> v_cambio then raise exception 'no_reducir_total'; end if;
  end if;
  select count(*) filter(where estado = 'disponible'), count(*) filter(where estado = 'en_reparacion')
    into v_disponibles, v_reparacion from public.ejemplares where material_id = p_material_id;
  if p_cantidad_disponibles > v_disponibles then
    v_cambio := p_cantidad_disponibles - v_disponibles;
    if v_cambio > v_reparacion then raise exception 'disponibles_invalidos'; end if;
    update public.ejemplares set estado = 'disponible' where id in (
      select id from public.ejemplares where material_id = p_material_id
      and estado = 'en_reparacion' order by id limit v_cambio
    );
  elsif p_cantidad_disponibles < v_disponibles then
    update public.ejemplares set estado = 'en_reparacion' where id in (
      select id from public.ejemplares where material_id = p_material_id
      and estado = 'disponible' order by id limit (v_disponibles - p_cantidad_disponibles)
    );
  end if;
end $$;

-- Búsqueda y paginación en servidor. La búsqueda trata %, _ y comas como texto.
create or replace function public.buscar_personas(
  p_buscar text default '', p_tipo bigint default null, p_activo boolean default null,
  p_correo boolean default null, p_pagina integer default 0, p_tamano integer default 25
)
returns jsonb language plpgsql stable set search_path = public as $$
declare v_resultado jsonb;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_pagina is null or p_pagina < 0 or p_tamano is null or p_tamano < 1 or p_tamano > 100 then
    raise exception 'Paginación inválida';
  end if;
  with filtradas as (
    select p.id, p.codigo, p.tipo_persona_id, p.nombres, p.apellido_paterno, p.apellido_materno,
      p.dni, p.correo, p.activo, t.nombre as tipo_persona,
      (select count(*) from public.prestamos pr where pr.persona_id = p.id and pr.fecha_devolucion is null) as prestamos_activos
    from public.personas p join public.tipos_persona t on t.id = p.tipo_persona_id
    where (p_tipo is null or p.tipo_persona_id = p_tipo)
      and (p_activo is null or p.activo = p_activo)
      and (p_correo is null or (nullif(btrim(p.correo), '') is not null) = p_correo)
      and position(public.normalizar_texto(coalesce(p_buscar, '')) in
        public.normalizar_texto(concat_ws(' ', p.codigo, p.nombres, p.apellido_paterno, p.apellido_materno, p.dni, p.correo))) > 0
  ), pagina as (
    select * from filtradas order by apellido_paterno, apellido_materno, nombres, id
    limit p_tamano offset (p_pagina::bigint * p_tamano)
  ) select jsonb_build_object('total', (select count(*) from filtradas),
    'personas', coalesce((select jsonb_agg(to_jsonb(pagina)) from pagina), '[]'::jsonb)) into v_resultado;
  return v_resultado;
end $$;

-- Consulta exacta por código escaneado o digitado, incluyendo credenciales inactivas.
-- Solo consulta: escanear nunca registra un préstamo ni una devolución automáticamente.
-- El préstamo_id permite usar devolver_prestamo tras la confirmación del bibliotecario.
create or replace function public.consultar_credencial(p_codigo text)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_persona public.personas;
  v_tipo text;
  v_hoy date := (now() at time zone 'America/Lima')::date;
  v_codigo text := upper(btrim(coalesce(p_codigo, ''), E' \t\r\n'));
  v_resultado jsonb;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  select * into v_persona from public.personas where codigo = v_codigo;
  if not found then return null; end if;
  select nombre into v_tipo from public.tipos_persona where id = v_persona.tipo_persona_id;
  with pendientes as (
    select p.id as prestamo_id, e.id as ejemplar_id, e.codigo as codigo_ejemplar,
      m.id as material_id, m.titulo,
      (p.fecha_prestamo at time zone 'America/Lima')::date as fecha_prestamo,
      p.fecha_limite,
      coalesce(p.fecha_limite < v_hoy, false) as esta_atrasado,
      case when p.fecha_limite is null then 0 else greatest(0, v_hoy - p.fecha_limite) end as dias_atraso
    from public.prestamos p
    join public.ejemplares e on e.id = p.ejemplar_id
    join public.materiales m on m.id = e.material_id
    where p.persona_id = v_persona.id and p.fecha_devolucion is null
  ) select jsonb_build_object(
    'persona', jsonb_build_object(
      'id', v_persona.id, 'codigo', v_persona.codigo,
      'nombres', v_persona.nombres, 'apellido_paterno', v_persona.apellido_paterno,
      'apellido_materno', v_persona.apellido_materno, 'dni', v_persona.dni,
      'tipo_persona_id', v_persona.tipo_persona_id, 'tipo_persona', v_tipo,
      'activo', v_persona.activo
    ),
    'resumen', jsonb_build_object(
      'prestamos_pendientes', count(*),
      'prestamos_atrasados', count(*) filter(where esta_atrasado),
      'max_dias_atraso', coalesce(max(dias_atraso), 0)
    ),
    'prestamos_pendientes', coalesce(
      jsonb_agg(to_jsonb(pendientes) order by fecha_limite nulls last, prestamo_id), '[]'::jsonb
    )
  ) into v_resultado from pendientes;
  return v_resultado;
end $$;

revoke all on function public.actualizar_material(bigint,text,bigint,bigint,text,smallint,text[],integer,integer) from public;
revoke all on function public.devolver_prestamo(bigint,date) from public;
revoke all on function public.buscar_personas(text,bigint,boolean,boolean,integer,integer) from public;
revoke all on function public.consultar_credencial(text) from public;
grant execute on function public.actualizar_material(bigint,text,bigint,bigint,text,smallint,text[],integer,integer) to authenticated;
grant execute on function public.devolver_prestamo(bigint,date) to authenticated;
grant execute on function public.buscar_personas(text,bigint,boolean,boolean,integer,integer) to authenticated;
grant execute on function public.consultar_credencial(text) to authenticated;
notify pgrst, 'reload schema';
commit;
