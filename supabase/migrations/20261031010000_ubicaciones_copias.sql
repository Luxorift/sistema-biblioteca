-- Aplicar después de 20261031000000_consistencia_biblioteca.sql.
-- Conserva las copias antiguas sin ubicación: su ubicación física debe confirmarse.
begin;

create or replace function public.validar_ubicacion_ejemplar()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.ubicacion_id is null then
    if tg_op = 'INSERT' then
      raise exception 'Indica la ubicación de cada copia nueva';
    elsif old.ubicacion_id is not null then
      raise exception 'No se puede quitar la ubicación de una copia; elige su nueva ubicación';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_ubicacion_ejemplar on public.ejemplares;
create trigger trg_ubicacion_ejemplar before insert or update on public.ejemplares
for each row execute function public.validar_ubicacion_ejemplar();

create or replace function public.agregar_ejemplares_distribuidos(
  p_material_id bigint, p_ubicaciones bigint[]
)
returns setof public.ejemplares language plpgsql set search_path = public as $$
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_ubicaciones is null or cardinality(p_ubicaciones) not between 1 and 500
    or array_ndims(p_ubicaciones) <> 1 then
    raise exception 'Indica entre 1 y 500 copias';
  end if;
  if array_position(p_ubicaciones, null) is not null then
    raise exception 'Indica la ubicación de cada copia nueva';
  end if;
  -- Una sola inserción: si una ubicación no existe, no se crea ninguna copia.
  return query insert into public.ejemplares(material_id, ubicacion_id)
    select p_material_id, ubicacion from unnest(p_ubicaciones) as u(ubicacion)
    returning *;
end $$;

-- Mantener la RPC anterior para los clientes que agregan un lote en un solo lugar.
create or replace function public.agregar_ejemplares(
  p_material_id bigint, p_cantidad integer, p_ubicacion_id bigint default null
)
returns setof public.ejemplares language plpgsql set search_path = public as $$
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  if p_cantidad is null or p_cantidad not between 1 and 500 then
    raise exception 'Cantidad fuera de rango (1-500)';
  end if;
  if p_ubicacion_id is null then raise exception 'Indica la ubicación de cada copia nueva'; end if;
  return query select * from public.agregar_ejemplares_distribuidos(
    p_material_id, array_fill(p_ubicacion_id, array[p_cantidad])
  );
end $$;

-- Reutiliza la edición transaccional ya existente. Las copias se insertan primero
-- con sus ubicaciones y todo se revierte si después falla la edición de la ficha.
create or replace function public.actualizar_material_con_ubicaciones(
  p_material_id bigint, p_titulo text, p_tipo_material_id bigint,
  p_categoria_id bigint, p_editorial text, p_anio smallint, p_autores text[],
  p_cantidad_total integer, p_cantidad_disponibles integer, p_ubicaciones_nuevas bigint[]
)
returns void language plpgsql set search_path = public as $$
declare v_actual integer; v_nuevas integer;
begin
  if public.rol_actual() is null then raise exception 'Sin permiso'; end if;
  perform 1 from public.materiales where id = p_material_id for update;
  if not found then raise exception 'Material no encontrado'; end if;
  perform id from public.ejemplares where material_id = p_material_id order by id for update;
  select count(*) into v_actual from public.ejemplares
    where material_id = p_material_id and estado <> 'baja';
  v_nuevas := greatest(0, p_cantidad_total - v_actual);
  if coalesce(cardinality(p_ubicaciones_nuevas), 0) <> v_nuevas then
    raise exception 'La cantidad de copias cambió o faltan ubicaciones; actualiza el material y revisa cada copia nueva';
  end if;
  if v_nuevas > 0 then
    perform public.agregar_ejemplares_distribuidos(p_material_id, p_ubicaciones_nuevas);
  end if;
  perform public.actualizar_material(
    p_material_id, p_titulo, p_tipo_material_id, p_categoria_id, p_editorial,
    p_anio, p_autores, p_cantidad_total, p_cantidad_disponibles
  );
end $$;

revoke all on function public.agregar_ejemplares_distribuidos(bigint,bigint[]) from public;
revoke all on function public.actualizar_material_con_ubicaciones(bigint,text,bigint,bigint,text,smallint,text[],integer,integer,bigint[]) from public;
grant execute on function public.agregar_ejemplares_distribuidos(bigint,bigint[]) to authenticated;
grant execute on function public.actualizar_material_con_ubicaciones(bigint,text,bigint,bigint,text,smallint,text[],integer,integer,bigint[]) to authenticated;
notify pgrst, 'reload schema';
commit;
