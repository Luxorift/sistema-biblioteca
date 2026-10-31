import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'
import { fechaBiblioteca, diasEntreFechas, instantePrestamo } from '../src/lib/fechas.ts'

const db = new PGlite({ extensions: { pg_trgm, unaccent } })
const admin = '00000000-0000-0000-0000-000000000001'
const migration = await readFile(
  new URL(
    '../supabase/migrations/20261031000000_consistencia_biblioteca.sql',
    import.meta.url,
  ),
  'utf8',
)
before(async () => {
  await db.exec(`
    create schema auth; create schema extensions;
    create role authenticated; create role anon;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `)
  await db.exec(
    await readFile(
      new URL(
        '../supabase/migrations/20261007000000_esquema_inicial.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  )
  // Comprobar también la asignación de credenciales a datos anteriores a la migración.
  await db.exec(`insert into tipos_persona(nombre) values('Anterior');
    insert into personas(tipo_persona_id,nombres,apellido_paterno,dni)
    values(1,'Persona','Existente','87654321');`)
  await db.exec(migration)
  assert.equal(
    (await db.query('select codigo from personas')).rows[0].codigo,
    'PER-000001',
  )
  await db.exec(`insert into auth.users values ('${admin}');
    insert into public.perfiles(id,nombre,rol) values ('${admin}','Admin','admin');
    select set_config('request.jwt.claim.sub','${admin}',false);`)
})
beforeEach(async () => {
  await db.exec(`reset role;
    truncate public.prestamos, public.ejemplares, public.material_autores, public.materiales,
      public.autores, public.editoriales, public.personas, public.tipos_persona,
      public.tipos_material restart identity cascade;
    insert into public.tipos_material(nombre) values ('Libro');
    insert into public.tipos_persona(nombre) values ('Estudiante');
    insert into public.materiales(titulo,tipo_material_id) values ('Original',1);
    insert into public.ejemplares(material_id) values (1),(1);
    insert into public.autores(nombre) values ('García');
    insert into public.material_autores(material_id,autor_id) values(1,1);
    insert into public.personas(tipo_persona_id,nombres,apellido_paterno,dni)
      values(1,'Ana','Pérez','12345678');
    set role authenticated;`)
})
after(async () => {
  await db.close()
})

const prestar = (copia = 1) =>
  db.query(
    `insert into public.prestamos(ejemplar_id,persona_id,fecha_prestamo)
  values ($1,1,((now() at time zone 'America/Lima')::date + time '12:00') at time zone 'America/Lima') returning id`,
    [copia],
  )
const editar = (total, disponibles, autores = ['Garcia']) =>
  db.query(
    `select public.actualizar_material(1,'Modificado',1,null,'Editorial Águila',2020::smallint,$1::text[],$2,$3)`,
    [autores, total, disponibles],
  )

test('préstamo y devolución sincronizan el ejemplar; una segunda devolución falla', async () => {
  await prestar()
  assert.equal(
    (await db.query('select estado from ejemplares where id=1')).rows[0].estado,
    'prestado',
  )
  await assert.rejects(prestar(), /no está disponible/)
  await db.query(
    `select public.devolver_prestamo(1,(now() at time zone 'America/Lima')::date)`,
  )
  assert.equal(
    (await db.query('select estado from ejemplares where id=1')).rows[0].estado,
    'disponible',
  )
  await assert.rejects(
    db.query(
      `select public.devolver_prestamo(1,(now() at time zone 'America/Lima')::date)`,
    ),
    /ya fue devuelto/,
  )
  await prestar()
})

test('la base impide alterar el estado, borrar o reasignar un préstamo abierto', async () => {
  await prestar()
  for (const estado of ['disponible', 'perdido', 'en_reparacion', 'baja']) {
    await assert.rejects(
      db.query('update ejemplares set estado=$1 where id=1', [estado]),
      /debe coincidir/,
    )
  }
  await assert.rejects(
    db.query('delete from prestamos where id=1'),
    /no se pueden eliminar/,
  )
  await assert.rejects(
    db.query('update prestamos set ejemplar_id=2 where id=1'),
    /identidad/,
  )
  await assert.rejects(
    db.query("update ejemplares set estado='prestado' where id=2"),
    /debe coincidir/,
  )
  assert.equal(
    (await db.query('select estado from ejemplares where id=1')).rows[0].estado,
    'prestado',
  )
})

test('no se presta a una persona inactiva ni se desactiva con préstamos abiertos', async () => {
  await db.query('update personas set activo=false where id=1')
  await assert.rejects(prestar(), /no está activa/)
  await db.query('update personas set activo=true where id=1')
  await prestar()
  await assert.rejects(
    db.query('update personas set activo=false where id=1'),
    /préstamos pendientes/,
  )
})

test('el lote de préstamos revierte completo si una copia no está disponible', async () => {
  await db.query("update ejemplares set estado='en_reparacion' where id=2")
  await assert.rejects(
    db.query(`insert into prestamos(ejemplar_id,persona_id) values(1,1),(2,1)`),
    /no está disponible/,
  )
  assert.equal((await db.query('select count(*)::int as n from prestamos')).rows[0].n, 0)
  assert.equal(
    (await db.query('select estado from ejemplares where id=1')).rows[0].estado,
    'disponible',
  )
})

test('la base valida fechas futuras, vencimiento y devoluciones anteriores', async () => {
  await assert.rejects(
    db.query(`insert into prestamos(ejemplar_id,persona_id,fecha_prestamo)
    values(1,1,now()+interval '2 days')`),
    /no puede ser futura/,
  )
  await assert.rejects(
    db.query(`insert into prestamos(ejemplar_id,persona_id,fecha_limite)
    values(1,1,current_date-10)`),
    /anterior al préstamo/,
  )
  const prestamoId = (await prestar()).rows[0].id
  await assert.rejects(
    db.query(`select devolver_prestamo($1,current_date-10)`, [prestamoId]),
    /entre el préstamo y hoy/,
  )
  await assert.rejects(
    db.query(`select devolver_prestamo($1,current_date+10)`, [prestamoId]),
    /entre el préstamo y hoy/,
  )
  await db.query(
    `select devolver_prestamo($1,(now() at time zone 'America/Lima')::date)`,
    [prestamoId],
  )
  await assert.rejects(
    db.query('update prestamos set fecha_devolucion=null where id=$1', [prestamoId]),
    /no se puede modificar/,
  )
})

test('el rol bibliotecario puede operar pero no administrar perfiles', async () => {
  await db.exec(
    `reset role; update perfiles set rol='bibliotecario' where id='${admin}'; set role authenticated;`,
  )
  try {
    await editar(2, 2)
    await prestar()
    await db.query(
      `select devolver_prestamo(1,(now() at time zone 'America/Lima')::date)`,
    )
    const { rows } = await db.query(
      `update perfiles set rol='admin' where id=$1 returning id`,
      [admin],
    )
    assert.equal(rows.length, 0)
  } finally {
    await db.exec(
      `reset role; update perfiles set rol='admin' where id='${admin}'; set role authenticated;`,
    )
  }
})

test('editar reutiliza autores/editoriales normalizados y ajusta cantidades', async () => {
  await editar(3, 2, ['Garcia', 'GARCÍA'])
  assert.equal((await db.query('select count(*)::int as n from autores')).rows[0].n, 1)
  assert.equal(
    (await db.query('select count(*)::int as n from material_autores')).rows[0].n,
    1,
  )
  await editar(2, 1)
  const { rows } = await db.query(
    `select estado,count(*)::int as n from ejemplares group by estado`,
  )
  assert.deepEqual(Object.fromEntries(rows.map((r) => [r.estado, r.n])), {
    baja: 1,
    disponible: 1,
    en_reparacion: 1,
  })
})

test('un fallo al ajustar copias revierte título, editorial y autores', async () => {
  await db.query("update ejemplares set estado='perdido' where id=2")
  await assert.rejects(editar(2, 2, ['Otro autor']), /disponibles_invalidos/)
  assert.equal(
    (await db.query('select titulo from materiales where id=1')).rows[0].titulo,
    'Original',
  )
  assert.equal(
    (await db.query('select count(*)::int as n from editoriales')).rows[0].n,
    0,
  )
  assert.equal((await db.query('select nombre from autores')).rows[0].nombre, 'García')
  assert.equal(
    (await db.query('select autor_id from material_autores')).rows[0].autor_id,
    1,
  )
  await prestar()
  await assert.rejects(editar(0, 0), /prestados_bloquean/)
})

test('busca personas fuera de las primeras 100 y pagina con filtros y conteos', async () => {
  await db.query(`insert into personas(tipo_persona_id,nombres,apellido_paterno,dni)
    select 1,'Persona '||n,'Apellido',lpad((20000000+n)::text,8,'0') from generate_series(1,130) n`)
  const buscar = async (texto = '', pagina = 0) =>
    (
      await db.query(`select buscar_personas($1,null,null,null,$2,25) as resultado`, [
        texto,
        pagina,
      ])
    ).rows[0].resultado
  assert.equal((await buscar()).total, 131)
  assert.equal((await buscar('', 5)).personas.length, 6)
  assert.equal((await buscar('20000130')).personas[0].nombres, 'Persona 130')
  await prestar()
  assert.equal((await buscar('Perez')).personas[0].prestamos_activos, 1)
  assert.equal((await buscar('', 99)).total, 131)
})

test('RLS y funciones bloquean a un usuario sin perfil y al rol anónimo', async () => {
  await db.query(
    "select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)",
  )
  assert.equal((await db.query('select * from materiales')).rows.length, 0)
  await assert.rejects(editar(2, 2), /Sin permiso/)
  await assert.rejects(db.query('select buscar_personas()'), /Sin permiso/)
  await assert.rejects(
    db.query("select consultar_credencial('PER-000001')"),
    /Sin permiso/,
  )
  await db.exec('reset role; set role anon;')
  await assert.rejects(db.query('select buscar_personas()'), /permission denied/)
  await assert.rejects(
    db.query("select consultar_credencial('PER-000001')"),
    /permission denied/,
  )
  await db.exec('reset role;')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin])
})

const consultar = async (codigo) =>
  (await db.query('select consultar_credencial($1) as resultado', [codigo])).rows[0]
    .resultado

test('las credenciales se generan, son únicas y permanecen estables al editar la persona', async () => {
  await db.query(`insert into personas(tipo_persona_id,nombres,apellido_paterno,dni)
    values(1,'Luis','Díaz','23456789')`)
  const codigos = (await db.query('select codigo from personas order by id')).rows.map(
    (p) => p.codigo,
  )
  assert.deepEqual(codigos, ['PER-000001', 'PER-000002'])
  await db.query("update personas set nombres='Ana María' where id=1")
  assert.equal((await consultar('PER-000001')).persona.nombres, 'Ana María')
  await assert.rejects(
    db.query("update personas set codigo='PER-999999' where id=1"),
    /DEFAULT/,
  )
  await assert.rejects(db.query('update personas set id=999 where id=1'), /DEFAULT/)
  await assert.rejects(
    db.query('update personas set id=DEFAULT where id=1'),
    /identificador/,
  )
  await db.query(`insert into personas(id,tipo_persona_id,nombres,apellido_paterno,dni)
    overriding system value values(1000000,1,'Millón','Prueba','34567890')`)
  assert.equal((await consultar('PER-1000000')).persona.id, 1000000)
})

test('el código se puede escanear o digitar y no se confunde con un libro o DNI', async () => {
  const resultado = await consultar('  per-000001\r\n')
  assert.equal(resultado.persona.id, 1)
  assert.deepEqual(resultado.resumen, {
    prestamos_pendientes: 0,
    prestamos_atrasados: 0,
    max_dias_atraso: 0,
  })
  assert.deepEqual(resultado.prestamos_pendientes, [])
  for (const codigo of ['BIB-000001', '12345678', 'PER-999999', '', null]) {
    assert.equal(await consultar(codigo), null)
  }
  const buscada = (await db.query("select buscar_personas('PER-000001') as resultado"))
    .rows[0].resultado
  assert.equal(buscada.personas[0].codigo, 'PER-000001')
})

test('la credencial muestra préstamos pendientes, atrasos por día y excluye los devueltos', async () => {
  await db.query('insert into ejemplares(material_id) values(1),(1)')
  await db.query(`insert into prestamos(ejemplar_id,persona_id,fecha_prestamo,fecha_limite) values
    (1,1,now()-interval '3 days',(now() at time zone 'America/Lima')::date-2),
    (2,1,now()-interval '3 days',(now() at time zone 'America/Lima')::date),
    (3,1,now()-interval '3 days',null),
    (4,1,now()-interval '3 days',(now() at time zone 'America/Lima')::date-1)`)
  await db.query("select devolver_prestamo(4,(now() at time zone 'America/Lima')::date)")
  const resultado = await consultar('PER-000001')
  assert.deepEqual(resultado.resumen, {
    prestamos_pendientes: 3,
    prestamos_atrasados: 1,
    max_dias_atraso: 2,
  })
  assert.deepEqual(
    resultado.prestamos_pendientes.map((p) => [
      p.ejemplar_id,
      p.dias_atraso,
      p.esta_atrasado,
    ]),
    [
      [1, 2, true],
      [2, 0, false],
      [3, 0, false],
    ],
  )
  assert.equal(resultado.prestamos_pendientes[0].titulo, 'Original')
  assert.equal(resultado.prestamos_pendientes[0].prestamo_id, 1)
  // La consulta no modifica préstamos ni devuelve libros por el hecho de escanear.
  assert.equal((await consultar('PER-000001')).resumen.prestamos_pendientes, 3)
})

test('una credencial inactiva se reconoce para informar al bibliotecario', async () => {
  await db.query('update personas set activo=false where id=1')
  const resultado = await consultar('PER-000001')
  assert.equal(resultado.persona.activo, false)
  await assert.rejects(prestar(), /no está activa/)
})

test('la migración se puede volver a aplicar', async () => {
  await db.exec('reset role;')
  await db.exec(migration)
})

test('los días y atrasos usan el calendario de Lima', () => {
  assert.equal(fechaBiblioteca('2026-11-01T02:00:00Z'), '2026-10-31')
  assert.equal(fechaBiblioteca('2026-11-01T05:00:00Z'), '2026-11-01')
  assert.equal(fechaBiblioteca('2026-10-31'), '2026-10-31')
  assert.equal(diasEntreFechas('2026-10-31', fechaBiblioteca('2026-11-01T04:59:59Z')), 0)
  assert.equal(diasEntreFechas('2026-10-31', fechaBiblioteca('2026-11-01T05:00:00Z')), 1)
  assert.equal(instantePrestamo('2026-10-31'), '2026-10-31T12:00:00-05:00')
})
