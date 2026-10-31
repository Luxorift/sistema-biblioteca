import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

// Ejecutar el handler real sin red ni claves de Supabase.
const source = (
  await readFile(
    new URL('../supabase/functions/crear-usuario/index.ts', import.meta.url),
    'utf8',
  )
).replace(/^import .*\r?\n/gm, '')
const javascript = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText

function handler({ perfilError = false, limpiezaError = false, rol = 'admin' } = {}) {
  let callback
  const llamadas = []
  const perfil = {
    select: () => perfil,
    eq: () => perfil,
    single: async () => ({ data: { rol, activo: true }, error: null }),
  }
  const escritura = {
    upsert: () => escritura,
    select: () => escritura,
    single: async () => ({
      data: perfilError ? null : { id: 'nuevo', nombre: 'Ana', rol: 'bibliotecario' },
      error: perfilError ? { message: 'Error simulado' } : null,
    }),
  }
  const llamador = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin' } }, error: null }) },
    from: () => perfil,
  }
  const admin = {
    auth: {
      admin: {
        createUser: async (input) => {
          llamadas.push(['crear', input])
          return { data: { user: { id: 'nuevo' } }, error: null }
        },
        deleteUser: async (id) => {
          llamadas.push(['eliminar', id])
          return { error: limpiezaError ? { message: 'Error simulado' } : null }
        },
      },
    },
    from: () => escritura,
  }
  vm.runInNewContext(javascript, {
    serve: (fn) => {
      callback = fn
    },
    createClient: (_url, key) => (key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : llamador),
    Deno: { env: { get: (name) => name } },
    Request,
    Response,
    console: { error: () => {} },
  })
  return {
    llamadas,
    enviar: (body) =>
      callback(
        new Request('https://example.test', {
          method: 'POST',
          headers: { Authorization: 'Bearer prueba', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ),
  }
}
const input = {
  email: 'ana@example.test',
  password: ' clave con espacios ',
  nombre: 'Ana',
  rol: 'bibliotecario',
}

test('crear usuario conserva exactamente la contraseña', async () => {
  const mock = handler()
  assert.equal((await mock.enviar(input)).status, 200)
  assert.equal(mock.llamadas[0][1].password, input.password)
})
test('si falla el perfil, elimina la cuenta creada en Auth', async () => {
  const mock = handler({ perfilError: true })
  const respuesta = await mock.enviar(input)
  assert.equal(respuesta.status, 500)
  assert.deepEqual(mock.llamadas[1], ['eliminar', 'nuevo'])
  assert.match((await respuesta.json()).error, /cuenta se revirtió/)
})
test('si también falla la compensación, informa que la cuenta requiere revisión', async () => {
  const mock = handler({ perfilError: true, limpiezaError: true })
  assert.match((await (await mock.enviar(input)).json()).error, /revisar la cuenta/)
})
test('un bibliotecario no puede crear cuentas', async () => {
  const mock = handler({ rol: 'bibliotecario' })
  assert.equal((await mock.enviar(input)).status, 403)
  assert.equal(mock.llamadas.length, 0)
})
test('JSON con tipos incorrectos devuelve 400 sin crear cuentas', async () => {
  const mock = handler()
  for (const body of [null, [], { ...input, nombre: 123 }, { ...input, password: {} }]) {
    assert.equal((await mock.enviar(body)).status, 400)
  }
  assert.equal(mock.llamadas.length, 0)
})
