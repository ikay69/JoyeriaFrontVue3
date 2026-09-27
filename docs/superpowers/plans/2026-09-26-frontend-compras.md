# Frontend del módulo de Compras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construir el módulo de Compras del front —listar, dar de alta, ver el detalle, anular, gestionar cuotas e imprimir el comprobante— sobre los endpoints que el backend ya tiene terminados.

**Architecture:** patrón List + Form del proyecto, con una ruptura deliberada: una compra no se edita, así que el segundo destino es una pantalla de **detalle** de solo lectura desde la que se anula y se gestionan las cuotas. Options API en todo, `v-table` cruda, SweetAlert2 como único canal de mensajes. Se agregan dos piezas nuevas: un store Pinia de caché de catálogos y un generador de PDF.

**Tech Stack:** Vue 3.5 (Options API), Vuetify 3.7, Pinia 2.3, vue-router 4.5, axios 1.7, SweetAlert2 11, Vite 6. Se instalan `jspdf` y `jspdf-autotable`.

**Spec:** `docs/superpowers/specs/2026-09-26-frontend-compras-design.md`

---

## Cómo se verifica cada tarea — léelo antes de empezar

**Este proyecto no tiene framework de pruebas ni linter.** `package.json` sólo trae `dev`, `build` y `preview`, y el spec §14 mantiene esa decisión: agregar Vitest sería un cambio de alcance que nadie aprobó. Así que el ciclo de cada tarea **no es rojo-verde-refactor**, y este plan no finge que lo sea. Es:

1. **`npm run build`** — la puerta automática. Vite/Rollup falla con un error de sintaxis, un import roto, un componente no registrado o una referencia a un archivo que no existe. Es lo único que corre sin humano.
2. **Comprobación manual guiada** — cada tarea trae una lista de «haz esto / debe pasar esto», con entradas exactas y resultados exactos. **La ejecuta el usuario**: el navegador de este entorno es Edge y no hay automatización de por medio. Quien implemente debe **pedirle los clics y esperar el resultado**, no darlo por bueno.
3. **Commit** sólo después de que el usuario confirme la lista.

**Consecuencia que hay que tener presente:** sin corredor de pruebas, nada detecta automáticamente que la tarea 6 rompió algo de la tarea 3. Por eso los puntos marcados **[REGRESIÓN]** en las listas manuales se repiten en las tareas posteriores que tocan el mismo código. No los saltes por haberlos visto pasar antes.

**Requisito previo:** el backend levantado y `.env` con `VITE_API_BASE_URL` apuntando a él (hoy `http://localhost:3000/api`). El `.env` no está versionado; si falta, esa variable es la única que hace falta.

**Datos de prueba:** para las tareas 1 y 2 hace falta que existan compras. Si la base está vacía, crearlas con la colección `docs/compras.postman_collection.json` del repo del backend (46 peticiones verificadas contra el servidor real) antes de mirar el grid.

---

## Global Constraints

Todas las tareas heredan esto. Los valores están copiados del spec y de `docs/endpoints.md` del backend; no se deducen ni se redondean.

- **Options API.** No hay un solo `<script setup>` en el proyecto y este módulo no lo introduce.
- **`v-table` cruda**, nunca `v-data-table`: se paginan 50 registros del servidor y el ordenamiento en cliente induciría a error.
- **SweetAlert2 es el único canal de mensajes.** No hay snackbars ni toasts.
- **50 registros por página**, escrito a mano: `totalPaginas() { return Math.max(1, Math.ceil(this.cantData / 50)) }`.
- **Manejo de error único:** `error.response?.data?.msg || '<texto propio>'` dentro de `Swal.fire('Error', mensaje, 'error')`, con `finally` que apaga el `cargando`. El backend siempre manda `{ msg }`.
- **`$refs.form.validate()` es asíncrono y devuelve `{ valid }`**, no un booleano.
- **`Estado` llega como `1`/`0`, no booleano.** `compraEstado === 1` es activa, `0` es anulada.
- **Alias del backend, verbatim.** Listado: `compraId`, `compraFecha`, `compraTerceroId`, `compraTerceroTipoDoc`, `compraTerceroNumeroDoc`, `compraTercero`, `compraDocumentoSoporte`, `compraTipoCompra`, `compraFechaCompromiso`, `compraNumeroCuotas`, `compraSubtotal`, `compraDescuento`, `compraCancelado`, `compraSaldo`, `compraEstado`. Detalle añade `compraValorCuota`, `compraMotivoAnulacion`, `compraFechaAnulacion`, `compraUsuarioAnulador`. Líneas: `detArticuloId`, `detArticuloNombre`, `detBodegaId`, `detBodegaNombre`, `detCantidad`, `detCostoUnidad`. Cuotas: `cuoId`, `cuoNumCuota`, `cuoValorCuota`, `cuoFechaPago`, `cuoEstado`. **No se adivinan.**
- **`getactivasbodega` devuelve `{ Id, Nombre }`; `getactivaspropiedad` devuelve `{ Id, Nombre, TipoDato }`.** Sin prefijo.
- **Topes que el backend valida:** `NumeroDocumentoSoporte` 50 · `textoFiltro` del listado 100 · `MotivoAnulacion` 5 a 300 · nombre de artículo 150 · descripción 300 · valor de propiedad 150 · 200 líneas por compra.
- **`TipoCompra` acepta exactamente `'CONTADO'` y `'CREDITO'`.** `POR_ABONO` no existe en Compras.
- **Nunca se valida `NumeroCuotas × ValorCuota` contra el saldo**, ni como aviso. El backend tiene una prueba cuyo propósito es fijar que esa validación no existe.
- **Nombre de archivo del service en `camelCase`:** `compraService.js`. Dos archivos del proyecto rompen la convención y en un build de Linux un import con la caja equivocada falla.

---

## Review Focus

Cinco formas de romper esto que el spec implica pero que ninguna comprobación descubre por su cuenta. Cada una tiene su comprobación asignada a la tarea que es dueña del código, en la lista manual de esa tarea.

1. **Los `v-text-field` devuelven cadenas, no números.** `Number.isInteger('3')` es `false`, así que un `NumeroCuotas` tecleado llega como `'3'` y el backend responde «El número de cuotas debe ser un entero mayor o igual a 1» sobre un formulario que se ve correcto. Todo campo numérico va con `v-model.number` y además se coerciona con `Number()` al armar el payload. → Tarea 5.
2. **`idTercero: null` rompe el listado entero.** `clearable` de Vuetify pone `null`, y el backend responde `400 Tercero invalido` con `null` o con un negativo: sólo `0` o ausente significan «todos». Limpiar el filtro de tercero debe dejar `0`. → Tarea 2.
3. **`http.delete(url, payload)` manda la petición sin cuerpo.** Axios espera el cuerpo de un DELETE en `{ data: payload }`; escrito de la forma intuitiva, `deleteCuota` falla con un 400 que parece del backend. → Tarea 1 (el código) y Tarea 7 (la comprobación en vivo).
4. **El saldo en coma flotante muestra basura.** `620000 - 0 - 619999.99` da `0.010000000046566129`, y el usuario ve eso en pantalla aunque el envío pase. Subtotal y saldo se redondean a dos decimales antes de mostrarse y antes de compararse contra la tolerancia de un centavo. → Tarea 3.
5. **Una línea sin artículo llega al backend y tumba toda la compra.** Agregar una línea y llenar cantidad y costo sin elegir artículo produce un payload sin `idArticulo` ni `ArticuloNuevo`; el backend responde 400 y el usuario pierde el formulario completo. Se rechaza en el front, señalando **cuál** fila. → Tarea 3.

---

## Estructura de archivos

### Nuevos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `src/services/compraService.js` | siete llamadas HTTP, sin lógica | 1 |
| `src/views/Compras/ComprasList.vue` | grid: filtros, tabla, paginado, acciones | 1, 2, 8 |
| `src/stores/catalogos.js` | caché de bodegas y propiedades por empresa | 3 |
| `src/views/Compras/CompraForm.vue` | alta de la compra | 3, 4, 5 |
| `src/views/Compras/ArticuloNuevoDialog.vue` | alta de artículo embebida en una línea | 4 |
| `src/views/Compras/CompraDetalle.vue` | detalle de lectura, anular, cuotas | 6, 7, 8 |
| `src/utils/compraPdf.js` | arma y guarda el comprobante | 8 |

### Modificados

| Archivo | Cambio | Tarea |
|---|---|---|
| `src/router/index.js` | la ruta `compras` se reemplaza por tres | 1 |
| `src/layouts/MainLayout.vue` | `:to` a `ComprasList` y quitar `bg-red text-white` | 1 |
| `src/views/Compras/Compras.vue` | se elimina (era el `EnConstruccion`) | 1 |
| `package.json` | `jspdf` y `jspdf-autotable` | 8 |

`CompraForm.vue` se construye en tres tareas y es el archivo más grande del módulo. `ArticuloNuevoDialog` sale aparte desde el principio —tiene su propio selector de producto, su tabla de propiedades y su validación— para que `CompraForm` no acabe siendo ilegible.

---

## Task 1: Service, rutas y grid que lista

Deliverable: entrar a Compras desde el menú y ver las compras de la empresa, ordenadas por fecha descendente, con paginado.

**Files:**
- Create: `src/services/compraService.js`
- Create: `src/views/Compras/ComprasList.vue`
- Modify: `src/router/index.js:208-209`
- Modify: `src/layouts/MainLayout.vue:97`
- Delete: `src/views/Compras/Compras.vue`

**Interfaces:**
- Consumes: `@/services/http` (instancia de axios), `@/stores/auth` (`useAuthStore`, `empresaSeleccionada`).
- Produces: `compraService` con `getAll`, `getById`, `create`, `anular`, `createCuota`, `updateCuota`, `deleteCuota`, todos `(payload) => Promise<AxiosResponse>`. Rutas con nombre `ComprasList`, `CompraNueva`, `CompraDetalle`.

- [ ] **Step 1: Crear `src/services/compraService.js`**

```js
import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, idTercero, fechaInicio, fechaFin }
    return http.post('/compra/getallcompra', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idCompra }
    return http.post('/compra/getidcompra', payload)
  },
  create(payload) {
    // payload: { idEmpresa, idTercero, TipoCompra, NumeroDocumentoSoporte, ValorDescuento,
    //            ValorEfectivo, ValorTransaccion, FechaCompromiso, NumeroCuotas, ValorCuota,
    //            Cuotas, Articulos }
    return http.post('/compra/newcompra', payload)
  },
  anular(payload) {
    // payload: { idEmpresa, idCompra, MotivoAnulacion }
    return http.put('/compra/anularcompra', payload)
  },
  createCuota(payload) {
    // payload: { idEmpresa, idCompra, NumCuota, ValorCuota, FechaPago, Estado }
    return http.post('/compra/newcompracuota', payload)
  },
  updateCuota(payload) {
    // payload: { idEmpresa, idCuota, NumCuota, ValorCuota, FechaPago, Estado }
    return http.put('/compra/updatecompracuota', payload)
  },
  deleteCuota(payload) {
    // payload: { idEmpresa, idCuota }
    // OJO: axios manda el cuerpo de un DELETE en la propiedad `data` de la config, NO como
    // segundo argumento. Escrito http.delete(url, payload) la peticion sale SIN cuerpo y el
    // backend responde 400 por idCuota faltante, que parece un error del servidor y no lo es.
    return http.delete('/compra/deletecompracuota', { data: payload })
  }
}
```

- [ ] **Step 2: Crear `src/views/Compras/ComprasList.vue`**

Versión mínima: sin los filtros completos (tarea 2) y sin el botón de PDF (tarea 8). Arranca con `campoOrdenar: 5` y `orden: 'DESC'` porque **`campoOrdenar` es obligatorio**: sin él la ruta responde `400 Campo de orden invalido`.

```vue
<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">Compras</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$router.push({ name: 'CompraNueva' })">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4">
      <div style="overflow-x: auto;">
        <v-table density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Documento</th>
              <th>Tercero</th>
              <th>Tipo</th>
              <th class="text-end">Subtotal</th>
              <th class="text-end">Descuento</th>
              <th class="text-end">Cancelado</th>
              <th class="text-end">Saldo</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!compras.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="com in compras" :key="com.compraId">
              <td>{{ formatearFecha(com.compraFecha) }}</td>
              <td>{{ com.compraDocumentoSoporte || '-' }}</td>
              <td>
                {{ com.compraTercero }}
                <div class="text-caption text-medium-emphasis">
                  {{ com.compraTerceroTipoDoc || '' }} {{ com.compraTerceroNumeroDoc || '' }}
                </div>
              </td>
              <td>{{ com.compraTipoCompra }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraSubtotal) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraDescuento) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraCancelado) }}</td>
              <td class="text-end">{{ formatearMoneda(com.compraSaldo) }}</td>
              <td class="text-center">
                <v-chip :color="com.compraEstado === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ com.compraEstado === 1 ? 'Activa' : 'Anulada' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Ver detalle"
                  @click="irDetalle(com)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">Anterior</v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">Siguiente</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ComprasList',

  data() {
    return {
      cargando: false,
      compras: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        // campoOrdenar es OBLIGATORIO: sin el, getallcompra responde 400. Arranca en 5
        // (FechaCreacion) con DESC para mostrar lo ultimo comprado primero.
        campoOrdenar: 5,
        orden: 'DESC'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  created() {
    this.consultar()
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await compraService.getAll({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina
        })
        this.compras = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las compras'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    irDetalle(com) {
      this.$router.push({
        name: 'CompraDetalle',
        params: { EmpId: this.idEmpresa, ComId: com.compraId }
      })
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    }
  }
}
</script>
```

- [ ] **Step 3: Reemplazar la ruta de Compras en `src/router/index.js`**

Busca esta línea (está bajo el comentario `// Compras`):

```js
      { path: 'compras', name: 'Compras', component: () => import('@/views/Compras/Compras.vue') },
```

y déjala así:

```js
      { path: 'compras', name: 'ComprasList', component: () => import('@/views/Compras/ComprasList.vue') },
      { path: 'compras/nueva', name: 'CompraNueva', component: () => import('@/views/Compras/CompraForm.vue') },
      {
        path: 'compras/:EmpId/:ComId/detalle',
        name: 'CompraDetalle',
        component: () => import('@/views/Compras/CompraDetalle.vue'),
        props: true
      },
```

**`CompraForm.vue` y `CompraDetalle.vue` todavía no existen.** Los imports son dinámicos (`() => import(...)`), así que `npm run build` **no** falla por eso: Rollup sólo avisa al resolver el chunk. Para que el build pase limpio en esta tarea, créalos como cascarones de cuatro líneas y llénalos en las tareas 3 y 6:

`src/views/Compras/CompraForm.vue`:
```vue
<template>
  <v-container fluid class="pa-6"><h1 class="text-h5">Nueva compra</h1></v-container>
</template>

<script>
export default { name: 'CompraForm' }
</script>
```

`src/views/Compras/CompraDetalle.vue`:
```vue
<template>
  <v-container fluid class="pa-6"><h1 class="text-h5">Detalle de la compra</h1></v-container>
</template>

<script>
export default { name: 'CompraDetalle' }
</script>
```

- [ ] **Step 4: Apuntar el menú a la ruta nueva en `src/layouts/MainLayout.vue`**

La entrada de Compras apunta hoy a `name: 'Compras'`, que **acaba de dejar de existir**: sin este cambio el enlace del menú no resuelve. Busca:

```html
          <v-list-item :to="{ name: 'Compras' }" title="Compras" class="bg-red text-white"/>
```

y déjala así — sin el `class`, que es el semáforo de «pantalla pendiente»:

```html
          <v-list-item :to="{ name: 'ComprasList' }" title="Compras" />
```

- [ ] **Step 5: Borrar el `EnConstruccion`**

```bash
rm src/views/Compras/Compras.vue
```

Ya nadie lo importa: la ruta que lo usaba se reemplazó en el paso 3. Si el build falla aquí, quedó una referencia suelta — búscala con `grep -rn "Compras/Compras.vue" src/`.

- [ ] **Step 6: Correr el build**

Run: `npm run build`
Expected: termina sin errores. Un fallo aquí es casi siempre un import mal escrito o una etiqueta sin cerrar en el `.vue` nuevo.

- [ ] **Step 7: Comprobación manual — pídela al usuario y espera su respuesta**

Con `npm run dev` y el backend levantado:

1. El menú **Compras → Compras** ya no está en rojo y abre la pantalla. → antes era `EnConstruccion`.
2. La tabla lista compras de la empresa seleccionada, **la más reciente arriba**.
3. Si hay más de 50 compras, *Siguiente* trae la página 2 y el contador dice «Página 2 de N».
4. Una compra anulada (si hay) sale con chip **rojo «Anulada»**; una activa, verde «Activa». → `compraEstado` es `1`/`0`, no «pagada/pendiente».
5. Cambiar de empresa en la barra superior y volver a entrar: lista las de la empresa nueva.
6. El lápiz navega a `/compras/<EmpId>/<ComId>/detalle` y muestra el cascarón «Detalle de la compra». Todavía no hay contenido: es la tarea 6.

Si la base no tiene compras, la tabla debe decir «No hay registros para mostrar» — no quedarse en blanco ni lanzar error.

- [ ] **Step 8: Commit**

```bash
git add src/services/compraService.js src/views/Compras/ComprasList.vue src/views/Compras/CompraForm.vue src/views/Compras/CompraDetalle.vue src/router/index.js src/layouts/MainLayout.vue
git rm src/views/Compras/Compras.vue
git commit -m "feat(compras): service, rutas y listado de compras"
```

**Commitea sólo estos archivos.** El árbol de trabajo tiene el módulo de Vendedores sin rastrear y 29 archivos que `git status` marca como modificados por ruido de CRLF (`core.autocrlf` en `true`). No uses `git add -A` en ninguna tarea de este plan, y no hagas `git checkout --` masivo para «limpiar».

---

## Task 2: Filtros completos del grid

Deliverable: los cinco campos de orden en los dos sentidos, búsqueda por texto, filtro por tercero y rango de fechas, todo conservando el paginado.

**Files:**
- Modify: `src/views/Compras/ComprasList.vue`

**Interfaces:**
- Consumes: `compraService.getAll` (tarea 1); `@/views/Terceros/TercerosSeleccionar.vue` con su contrato ya existente: `v-model` para la visibilidad, `:id-empresa` obligatorio, `@seleccionar` que emite `{ Id, identificacion, Nombre, Celular }`.
- Produces: nada que otras tareas consuman.

- [ ] **Step 1: Agregar la tarjeta de filtros al template**

Va **antes** del `div` con `overflow-x: auto`, dentro de la misma `v-card`:

```html
      <v-row dense align="center" class="mb-2">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar"
            maxlength="100"
            :disabled="filtros.campoOrdenar === 5"
            :hint="filtros.campoOrdenar === 5 ? 'No aplica al ordenar por fecha de creación' : ''"
            persistent-hint
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Ordenar por"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select
            v-model="filtros.orden"
            :items="opcionesOrden"
            item-title="texto"
            item-value="valor"
            label="Orden"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <div class="d-flex ga-1 align-center">
            <v-btn icon="mdi-account-search" variant="tonal" size="small" @click="dialogTercero = true" />
            <v-text-field
              :model-value="terceroSeleccionado ? terceroSeleccionado.Nombre : ''"
              label="Tercero"
              placeholder="Todos"
              readonly
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-btn
              v-if="terceroSeleccionado"
              icon="mdi-close"
              variant="text"
              size="small"
              title="Quitar el filtro de tercero"
              @click="limpiarTercero"
            />
          </div>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mb-2">
        <v-col cols="6" sm="3">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Desde"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Hasta"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="2">
          <v-btn color="primary" variant="tonal" block @click="consultar">Consultar</v-btn>
        </v-col>
      </v-row>
```

Y al final del template, dentro del `v-container` pero fuera de la `v-card`:

```html
    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />
```

- [ ] **Step 2: Ampliar el `data` y registrar el componente**

Importa el selector junto a los otros imports:

```js
import TercerosSeleccionar from '@/views/Terceros/TercerosSeleccionar.vue'
```

y decláralo:

```js
  components: { TercerosSeleccionar },
```

El bloque `filtros` de `data` pasa a:

```js
      dialogTercero: false,
      terceroSeleccionado: null,
      filtros: {
        textoFiltro: '',
        // campoOrdenar es OBLIGATORIO: sin el, getallcompra responde 400. Arranca en 5
        // (FechaCreacion) con DESC para mostrar lo ultimo comprado primero.
        campoOrdenar: 5,
        orden: 'DESC',
        // 0 significa "todos los terceros". NUNCA null: el backend responde 400 con null y con
        // cualquier negativo. No existe el caso -1 ("sin tercero") de Ventas, porque
        // Compras.TerceroId es NOT NULL.
        idTercero: 0,
        fechaInicio: null,
        fechaFin: null
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Documento soporte' },
        { valor: 2, texto: 'Tipo doc. tercero' },
        { valor: 3, texto: 'N° doc. tercero' },
        { valor: 4, texto: 'Nombre del tercero' },
        { valor: 5, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ]
```

- [ ] **Step 3: Mandar los filtros en `buscar` y agregar los dos métodos del tercero**

El cuerpo de la llamada pasa a:

```js
        const { data } = await compraService.getAll({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          // `|| 0` cubre el null que deja el clearable y el undefined inicial: el backend
          // responde 400 Tercero invalido con null, y 0 es "todos".
          idTercero: this.filtros.idTercero || 0,
          // ausente, vacio o null es "sin cota por ese lado", y las dos cotas son
          // independientes: se puede mandar solo una.
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null
        })
```

Y dos métodos nuevos:

```js
    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
      this.filtros.idTercero = tercero.Id
      this.consultar()
    },

    limpiarTercero() {
      this.terceroSeleccionado = null
      // 0, no null: null es 400 Tercero invalido.
      this.filtros.idTercero = 0
      this.consultar()
    },
```

- [ ] **Step 4: Correr el build**

Run: `npm run build`
Expected: termina sin errores. Si falla con «Failed to resolve import», revisa la ruta de `TercerosSeleccionar` — vive en `views/Terceros/`, no en `components/`.

- [ ] **Step 5: Comprobación manual — pídela al usuario y espera su respuesta**

1. **Ordenar por cada uno de los cinco campos**, en ASC y en DESC, y confirmar que la tabla cambia de orden en los diez casos.
2. Con *Ordenar por* = **Fecha de creación**, la caja **Buscar queda deshabilitada** y muestra el hint «No aplica al ordenar por fecha de creación». → el backend ignora `textoFiltro` con `campoOrdenar: 5`, y el usuario tiene que saberlo.
3. Con *Ordenar por* = **Nombre del tercero** y un texto que exista, la tabla filtra. Con un texto que no exista: «No hay registros para mostrar».
4. **[REVIEW FOCUS 2]** Elegir un tercero con la lupa → filtra. Pulsar la **X** → vuelve a listar **todas** las compras, **sin error**. Si aparece un Swal con «Tercero invalido», el filtro quedó en `null` en vez de `0`: es exactamente el fallo que este punto busca.
5. Rango de fechas: sólo *Desde* → de esa fecha en adelante. Sólo *Hasta* → hasta esa fecha. Las dos con **la misma fecha** → las compras de ese día completo. → ambas cotas son inclusivas y una fecha sin hora cubre el día entero.
6. El rango **sigue aplicando** con *Ordenar por* = Fecha de creación. → a diferencia de `textoFiltro`, el rango no se desactiva.
7. Poner un filtro, ir a la página 2, y volver a pulsar **Consultar**: vuelve a la **página 1**. Pulsar *Siguiente*: conserva los filtros. → `consultar()` resetea; `irPagina()` no.
8. Una fecha imposible como `2026-02-31`, si el `type="date"` la deja escribir: sale el Swal con el mensaje del backend, no una pantalla roja.

- [ ] **Step 6: Commit**

```bash
git add src/views/Compras/ComprasList.vue
git commit -m "feat(compras): filtros completos del listado"
```

---

## Task 3: Alta de compra de CONTADO con artículos existentes

Deliverable: registrar una compra de contado completa —tercero, dinero y líneas con artículos que ya existen— y verla aparecer en el grid.

Es la tarea más grande del plan. Incluye el store de caché porque el combo de bodega lo necesita y sin él la tabla de artículos no funciona.

**Files:**
- Create: `src/stores/catalogos.js`
- Modify: `src/views/Compras/CompraForm.vue` (hoy es el cascarón de la tarea 1)

**Interfaces:**
- Consumes: `compraService.create` (tarea 1); `@/services/bodegaService` (`getActivas({ idEmpresa })` → `data.data` = `[{ Id, Nombre }]`); `@/views/Terceros/TercerosSeleccionar.vue`; `@/views/Inventario/Articulos/ArticulosSeleccionar.vue` (`v-model`, `:id-empresa`, `@seleccionar` que emite el registro completo: `artId`, `artSKU`, `artNombre`, `artPropiedades`, `artCategoria`, `artTipoProducto`).
- Produces: `useCatalogosStore` con `getBodegas(idEmpresa)`, `getPropiedades(idEmpresa)` e `invalidar(idEmpresa)`; las tres devuelven/operan sobre arreglos y `getBodegas`/`getPropiedades` son `async` y devuelven el arreglo. La tarea 4 consume `getPropiedades`.

- [ ] **Step 1: Crear `src/stores/catalogos.js`**

```js
import { defineStore } from 'pinia'
import bodegaService from '@/services/bodegaService'
import propiedadService from '@/services/propiedadService'

// Cache de los dos catalogos que Compras usa en combos.
//
// Indexado por empresa a proposito: bodegas y propiedades son POR empresa, y sin el indice,
// cambiar de empresa en la barra superior dejaria el combo mostrando las de la anterior. Eso no
// falla de forma visible: guarda la linea contra una bodega ajena.
//
// NO se persiste en localStorage, a diferencia del store auth: la sesion tiene que sobrevivir a
// un F5, una lista de bodegas no. Recargar la pagina ES la invalidacion natural. Para el caso de
// la bodega recien creada en su propia pantalla esta `invalidar`, que el formulario expone en un
// boton de refrescar.
export const useCatalogosStore = defineStore('catalogos', {
  state: () => ({
    bodegas: {},
    propiedades: {}
  }),

  actions: {
    async getBodegas(idEmpresa) {
      if (this.bodegas[idEmpresa]) return this.bodegas[idEmpresa]
      const { data } = await bodegaService.getActivas({ idEmpresa })
      this.bodegas[idEmpresa] = data.data || []
      return this.bodegas[idEmpresa]
    },

    async getPropiedades(idEmpresa) {
      if (this.propiedades[idEmpresa]) return this.propiedades[idEmpresa]
      const { data } = await propiedadService.getActivas({ idEmpresa })
      this.propiedades[idEmpresa] = data.data || []
      return this.propiedades[idEmpresa]
    },

    invalidar(idEmpresa) {
      delete this.bodegas[idEmpresa]
      delete this.propiedades[idEmpresa]
    }
  }
})
```

- [ ] **Step 2: Escribir `src/views/Compras/CompraForm.vue` completo (versión CONTADO)**

Reemplaza el cascarón entero. El bloque de crédito llega en la tarea 5 y el `book-plus` en la tarea 4; por eso el icono de la columna 2 ya está en la tabla pero deshabilitado con un `title` que lo dice.

```vue
<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-1">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Nueva compra</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una compra no se puede editar después de guardarla: sólo anularse.
        </p>
      </div>
    </div>

    <v-card class="pa-6 mt-4" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <div class="mb-1 text-subtitle-2">Tercero</div>
        <div class="d-flex ga-2 mb-2">
          <v-btn icon="mdi-arrow-right" variant="tonal" @click="dialogTercero = true" />
          <v-text-field
            :model-value="terceroSeleccionado ? terceroSeleccionado.Nombre : ''"
            readonly
            placeholder="Seleccione un tercero"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Identificación"
              :model-value="terceroSeleccionado ? terceroSeleccionado.identificacion : ''"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Celular"
              :model-value="terceroSeleccionado ? terceroSeleccionado.Celular : ''"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="documentoSoporte"
              label="Documento soporte"
              maxlength="50"
              counter="50"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="mb-1 text-subtitle-2">Tipo de compra</div>
        <v-radio-group v-model="tipoCompra" inline hide-details class="mb-4">
          <v-radio label="Contado" value="CONTADO" />
          <v-radio label="Crédito" value="CREDITO" />
        </v-radio-group>

        <v-row dense>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              label="Subtotal"
              :model-value="formatearMoneda(subtotal)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model.number="descuento"
              label="Descuento"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-text-field
              v-model.number="efectivo"
              label="Pago en efectivo"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model.number="transaccion"
              label="Pago en transacción"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              label="Saldo"
              :model-value="formatearMoneda(saldo)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">Artículos comprados</span>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis">{{ lineas.length }} / 200</span>
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              title="Volver a pedir las bodegas (si acabas de crear una)"
              @click="refrescarBodegas"
            />
          </div>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact" class="mb-2">
            <thead>
              <tr>
                <th style="min-width: 160px">Bodega</th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th class="text-center" style="width: 48px"></th>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 110px">Cantidad</th>
                <th style="min-width: 130px">Costo unidad</th>
                <th class="text-end" style="min-width: 120px">Costo total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="8" class="text-center py-6 text-medium-emphasis">
                  Agregue al menos una línea
                </td>
              </tr>
              <tr v-for="(fila, i) in lineas" :key="i">
                <td>
                  <v-select
                    v-model="fila.idBodega"
                    :items="bodegas"
                    item-title="Nombre"
                    item-value="Id"
                    placeholder="Bodega"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-book-plus"
                    size="small"
                    variant="text"
                    disabled
                    title="Dar de alta un artículo nuevo (pendiente)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="text"
                    color="primary"
                    title="Elegir un artículo existente"
                    @click="abrirSelectorArticulo(i)"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    title="Quitar esta línea"
                    @click="quitarLinea(i)"
                  />
                </td>
                <td>
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <span v-else class="text-medium-emphasis">Sin artículo</span>
                  <div v-if="fila.articuloSKU" class="text-caption text-medium-emphasis">
                    {{ fila.articuloSKU }}
                  </div>
                </td>
                <td>
                  <v-text-field
                    v-model.number="fila.Cantidad"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="fila.CostoUnidad"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>
                <td class="text-end">{{ formatearMoneda(totalLinea(fila)) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-plus"
          :disabled="lineas.length >= 200"
          class="mb-4"
          @click="agregarLinea"
        >
          Agregar línea
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-content-save" :loading="guardando" type="submit">
            Guardar
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />

    <ArticulosSeleccionar
      v-model="dialogArticulo"
      :id-empresa="idEmpresa"
      @seleccionar="onArticuloSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'
import TercerosSeleccionar from '@/views/Terceros/TercerosSeleccionar.vue'
import ArticulosSeleccionar from '@/views/Inventario/Articulos/ArticulosSeleccionar.vue'
import { useAuthStore } from '@/stores/auth'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'CompraForm',

  components: { TercerosSeleccionar, ArticulosSeleccionar },

  data() {
    return {
      dialogTercero: false,
      dialogArticulo: false,
      // fila para la que se abrio el selector de articulo: sin esto, el @seleccionar no sabria
      // a que linea pertenece el articulo elegido.
      filaActiva: null,

      terceroSeleccionado: null,
      documentoSoporte: '',
      tipoCompra: 'CONTADO',
      descuento: 0,
      efectivo: 0,
      transaccion: 0,

      lineas: [],
      bodegas: [],
      guardando: false
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    catalogosStore() {
      return useCatalogosStore()
    },
    idEmpresa() {
      // No hay modo edicion en este formulario, asi que no hay que leer $route.params.EmpId:
      // una compra nunca se edita. El detalle si lo lee, porque alli SI importa.
      return this.authStore.empresaSeleccionada
    },

    subtotal() {
      const total = this.lineas.reduce((acc, fila) => acc + this.totalLinea(fila), 0)
      return this.redondear(total)
    },

    saldo() {
      return this.redondear(
        this.subtotal -
          (Number(this.descuento) || 0) -
          (Number(this.efectivo) || 0) -
          (Number(this.transaccion) || 0)
      )
    }
  },

  created() {
    this.cargarBodegas()
    this.agregarLinea()
  },

  methods: {
    // Se redondea a dos decimales antes de mostrar Y antes de comparar. Sin esto,
    // 620000 - 0 - 619999.99 da 0.010000000046566129 y el usuario ve eso en el campo Saldo.
    redondear(valor) {
      return Math.round((Number(valor) || 0) * 100) / 100
    },

    totalLinea(fila) {
      return this.redondear((Number(fila.Cantidad) || 0) * (Number(fila.CostoUnidad) || 0))
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    async cargarBodegas() {
      try {
        this.bodegas = await this.catalogosStore.getBodegas(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de bodegas'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    async refrescarBodegas() {
      this.catalogosStore.invalidar(this.idEmpresa)
      await this.cargarBodegas()
    },

    onTerceroSeleccionado(tercero) {
      this.terceroSeleccionado = tercero
    },

    agregarLinea() {
      this.lineas.push({
        idBodega: null,
        idArticulo: null,
        articuloNombre: '',
        articuloSKU: '',
        articuloNuevo: null,
        Cantidad: 1,
        CostoUnidad: 0
      })
    },

    quitarLinea(index) {
      this.lineas.splice(index, 1)
    },

    abrirSelectorArticulo(index) {
      this.filaActiva = index
      this.dialogArticulo = true
    },

    onArticuloSeleccionado(art) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      fila.idArticulo = art.artId
      fila.articuloNombre = art.artNombre
      fila.articuloSKU = art.artSKU
      // Cada linea trae idArticulo O ArticuloNuevo, nunca ambos: el backend responde 400 con las
      // dos cosas y con ninguna. Elegir un articulo existente descarta el articulo nuevo de ESTA
      // fila.
      fila.articuloNuevo = null
      this.filaActiva = null
    },

    // Devuelve un mensaje de error, o null si las lineas estan bien.
    validarLineas() {
      if (!this.lineas.length) return 'Debe registrar al menos un artículo'
      if (this.lineas.length > 200) return 'La compra no puede tener más de 200 líneas'

      for (let i = 0; i < this.lineas.length; i++) {
        const fila = this.lineas[i]
        const numero = i + 1
        if (!fila.idBodega) return `Elija la bodega de la línea ${numero}`
        // Sin esta guarda el payload sale sin idArticulo ni ArticuloNuevo, el backend responde
        // 400 y el usuario pierde el formulario entero sin saber que fila era.
        if (!fila.idArticulo && !fila.articuloNuevo) {
          return `Elija el artículo de la línea ${numero}`
        }
        if (!(Number(fila.Cantidad) > 0)) return `La cantidad de la línea ${numero} debe ser mayor a cero`
        if (!(Number(fila.CostoUnidad) > 0)) return `El costo de la línea ${numero} debe ser mayor a cero`
      }
      return null
    },

    // Devuelve un mensaje de error, o null si la cabecera esta bien. Espejo de las reglas del
    // backend, para no gastar un viaje en un error evitable.
    validarCabecera() {
      if (!this.idEmpresa) return 'Seleccione una empresa en la barra superior'
      if (!this.terceroSeleccionado) return 'Seleccione el tercero de la compra'

      const vDescuento = Number(this.descuento) || 0
      if (vDescuento < 0) return 'El descuento no puede ser negativo'
      if (vDescuento > this.subtotal) return 'El descuento no puede superar el subtotal'

      const cancelado = (Number(this.efectivo) || 0) + (Number(this.transaccion) || 0)

      if (this.tipoCompra === 'CONTADO') {
        if (cancelado <= 0) return 'Debe registrar algún valor cancelado (efectivo o transacción)'
        // Misma tolerancia de un centavo que usa el backend: si el saldo cabe dentro del ruido
        // de redondeo, la compra quedo pagada.
        if (Math.abs(this.saldo) > 0.01) {
          return 'El valor cancelado debe cubrir exactamente el total de la compra de contado'
        }
      }
      return null
    },

    armarArticulos() {
      return this.lineas.map((fila) => {
        const linea = {
          idBodega: Number(fila.idBodega),
          Cantidad: Number(fila.Cantidad),
          CostoUnidad: Number(fila.CostoUnidad)
        }
        if (fila.articuloNuevo) {
          linea.ArticuloNuevo = fila.articuloNuevo
        } else {
          linea.idArticulo = Number(fila.idArticulo)
        }
        return linea
      })
    },

    async confirmar() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const errorCabecera = this.validarCabecera()
      if (errorCabecera) {
        Swal.fire('Atención', errorCabecera, 'warning')
        return
      }

      const errorLineas = this.validarLineas()
      if (errorLineas) {
        Swal.fire('Atención', errorLineas, 'warning')
        return
      }

      const payload = {
        idEmpresa: this.idEmpresa,
        idTercero: this.terceroSeleccionado.Id,
        TipoCompra: this.tipoCompra,
        NumeroDocumentoSoporte: this.documentoSoporte.trim() || null,
        ValorDescuento: Number(this.descuento) || 0,
        ValorEfectivo: Number(this.efectivo) || 0,
        ValorTransaccion: Number(this.transaccion) || 0,
        Articulos: this.armarArticulos()
      }

      this.guardando = true
      try {
        const { data } = await compraService.create(payload)
        await Swal.fire('Éxito', data.msg || 'Compra registrada', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
```

- [ ] **Step 3: Correr el build**

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 4: Comprobación manual — pídela al usuario y espera su respuesta**

1. **Camino feliz:** elegir tercero → se llenan nombre, identificación y celular. Agregar una línea, elegir bodega, elegir artículo con `+`, cantidad `2`, costo `10000` → Costo total `$ 20.000` y **Subtotal `$ 20.000`**. Poner efectivo `20000` → **Saldo `$ 0`**. Guardar → «Compra registrada», vuelve al grid y **la compra aparece arriba**.
2. **[REVIEW FOCUS 4]** Costo unidad `619999.99`, cantidad `1`, efectivo `620000`: el campo **Saldo muestra `-$ 0,01`**, no `-0.010000000046566129`. Guardar: el backend **acepta** (cabe en la tolerancia de un centavo).
3. **[REVIEW FOCUS 5]** Agregar una línea, elegir bodega, cantidad y costo, **sin elegir artículo**, y guardar → Swal «Elija el artículo de la línea 1». **No debe salir un error del backend**, y el formulario debe quedar intacto.
4. **Contado que no cuadra:** subtotal `20000`, efectivo `15000` → Guardar → «El valor cancelado debe cubrir exactamente el total de la compra de contado».
5. **Contado sin pago:** efectivo y transacción en `0` → «Debe registrar algún valor cancelado (efectivo o transacción)».
6. **Descuento mayor al subtotal** → «El descuento no puede superar el subtotal».
7. **Sin tercero** → «Seleccione el tercero de la compra». **Sin líneas** (borrar la única con la caneca) → «Debe registrar al menos un artículo».
8. **Dos líneas** con artículos distintos: el subtotal es la suma de las dos, y se actualiza al cambiar cualquier cantidad o costo.
9. El combo de **bodega** lista las bodegas activas de la empresa. Cambiar de empresa en la barra superior, volver a entrar al formulario: **lista las de la empresa nueva**. → es la razón de que la caché esté indexada por empresa.
10. Crear una bodega en su pantalla, volver a Compras → Nueva, pulsar el **`mdi-refresh`** → la bodega nueva aparece en el combo.
11. El contador dice `1 / 200`, `2 / 200`… y al llegar a 200 el botón *Agregar línea* queda deshabilitado.
12. Elegir **Crédito** en el radio: por ahora no aparece nada nuevo (es la tarea 5) y guardar responde el 400 del backend. Es lo esperado en esta tarea.

- [ ] **Step 5: Commit**

```bash
git add src/stores/catalogos.js src/views/Compras/CompraForm.vue
git commit -m "feat(compras): alta de compra de contado y cache de catalogos"
```

---

## Task 4: Artículo nuevo dentro de una línea

Deliverable: registrar una compra en la que una línea da de alta una joya que no existía en el catálogo.

**Files:**
- Create: `src/views/Compras/ArticuloNuevoDialog.vue`
- Modify: `src/views/Compras/CompraForm.vue`

**Interfaces:**
- Consumes: `useCatalogosStore.getPropiedades(idEmpresa)` (tarea 3) → `[{ Id, Nombre, TipoDato }]`; `@/services/productoService` (`getActivas({ idEmpresa, campoOrdenar, orden, pagina, textoFiltro })` → `data.data` con `proId`, `proNombre`, `TipoProductoNombre`, `CategoriaNombre`, `UnidadMedidaNombre`).
- Produces: componente con props `modelValue` (Boolean), `idEmpresa` (Number|String, requerido) y `valorInicial` (Object|null); emite `update:modelValue` y `guardar` con `{ idProducto, Nombre, Descripcion, Propiedades: [{ idPropiedad, Valor }] }` — exactamente la forma que `newcompra` espera en `ArticuloNuevo`.

- [ ] **Step 1: Crear `src/views/Compras/ArticuloNuevoDialog.vue`**

```vue
<template>
  <v-dialog v-model="dialogVisible" max-width="900" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Artículo nuevo</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <p class="text-caption text-medium-emphasis mb-4">
          El artículo nace sin precio de venta y marcado como no vendible: la compra sólo registra
          el costo. El precio se fija después, en la pantalla de Artículos, cuando la pieza ya fue
          avaluada.
        </p>

        <div class="mb-1 text-subtitle-2">Producto</div>
        <div class="d-flex ga-2 mb-4">
          <v-btn icon="mdi-arrow-right" variant="tonal" @click="abrirDialogProducto" />
          <v-text-field
            :model-value="productoSeleccionado ? productoSeleccionado.proNombre : ''"
            readonly
            placeholder="Seleccione un producto"
            variant="outlined"
            density="comfortable"
            hide-details
            class="flex-grow-1"
          />
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Tipo de producto"
              :model-value="productoSeleccionado ? productoSeleccionado.TipoProductoNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Categoría"
              :model-value="productoSeleccionado ? productoSeleccionado.CategoriaNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              label="Unidad medida"
              :model-value="productoSeleccionado ? productoSeleccionado.UnidadMedidaNombre : ''"
              readonly variant="outlined" density="comfortable" hide-details
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="nombre"
          label="Nombre del artículo"
          maxlength="150"
          counter="150"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="300"
          counter="300"
          rows="3"
          variant="outlined"
          class="mb-2"
        />

        <div class="d-flex align-center justify-space-between mt-2 mb-2">
          <span class="text-subtitle-2">Propiedades</span>
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            title="Volver a pedir las propiedades (si acabas de crear una)"
            @click="refrescarPropiedades"
          />
        </div>

        <v-table density="compact" class="mb-2">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo valor</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!propiedades.length">
              <td colspan="4" class="text-center py-4 text-medium-emphasis">
                Sin propiedades
              </td>
            </tr>
            <tr v-for="(fila, i) in propiedades" :key="i">
              <td style="min-width: 180px">
                <v-select
                  v-model="fila.idPropiedad"
                  :items="propiedadesDisponibles"
                  item-title="Nombre"
                  item-value="Id"
                  placeholder="Seleccione una propiedad"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="onCambioPropiedad(fila)"
                />
              </td>
              <td style="min-width: 130px">
                <v-text-field
                  :model-value="fila.tipoDato"
                  readonly variant="outlined" density="compact" hide-details
                />
              </td>
              <td style="min-width: 140px">
                <v-text-field
                  v-model="fila.valor"
                  placeholder="Ingrese el valor"
                  maxlength="150"
                  variant="outlined" density="compact" hide-details
                />
              </td>
              <td class="text-center">
                <v-btn icon="mdi-delete" size="small" variant="text" @click="quitarPropiedad(i)" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-btn variant="outlined" prepend-icon="mdi-plus" @click="agregarPropiedad">
          Agregar propiedad
        </v-btn>

        <div class="d-flex justify-end ga-2 mt-6">
          <v-btn variant="outlined" @click="cerrar">Cancelar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-content-save" @click="guardar">Guardar</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogProducto" max-width="900">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">Seleccionar producto</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogProducto = false" />
        </div>

        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="productosFiltros.textoFiltro"
              label="Buscar"
              maxlength="150"
              clearable density="compact" variant="outlined" hide-details
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-select
              v-model="productosFiltros.campoOrdenar"
              :items="productosOpcionesCampoOrdenar"
              item-title="texto" item-value="valor" label="Ordenar por"
              density="compact" variant="outlined" hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-btn color="primary" variant="tonal" block @click="buscarProductos(1)">
              Consultar
            </v-btn>
          </v-col>
        </v-row>

        <v-table density="compact">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Tipo de producto</th>
              <th>Categoría</th>
              <th>Unidad de medida</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargandoProductos">
              <td colspan="5" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!productos.length">
              <td colspan="5" class="text-center py-6 text-medium-emphasis">
                No hay productos para mostrar
              </td>
            </tr>
            <tr v-for="prod in productos" :key="prod.proId">
              <td class="text-center">
                <v-btn
                  icon="mdi-check-circle-outline" size="small" variant="text" color="primary"
                  @click="seleccionarProducto(prod)"
                />
              </td>
              <td>{{ prod.proNombre }}</td>
              <td>{{ prod.TipoProductoNombre }}</td>
              <td>{{ prod.CategoriaNombre }}</td>
              <td>{{ prod.UnidadMedidaNombre }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="productosPagina > 1" variant="outlined" @click="buscarProductos(productosPagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ productosPagina }} de {{ totalPaginasProductos }}</span>
          <v-btn v-if="productosPagina < totalPaginasProductos" variant="outlined" @click="buscarProductos(productosPagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import productoService from '@/services/productoService'
import { useCatalogosStore } from '@/stores/catalogos'

export default {
  name: 'ArticuloNuevoDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], required: true },
    // lo ya escrito para esta linea, para poder reabrir y corregir en vez de empezar de cero
    valorInicial: { type: Object, default: null }
  },

  emits: ['update:modelValue', 'guardar'],

  data() {
    return {
      productoSeleccionado: null,
      nombre: '',
      descripcion: '',
      propiedades: [],
      propiedadesDisponibles: [],

      dialogProducto: false,
      productos: [],
      cargandoProductos: false,
      productosCantData: 0,
      productosPagina: 1,
      productosFiltros: { textoFiltro: '', campoOrdenar: 1, orden: 'ASC' },
      productosOpcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Fecha de creación' }
      ]
    }
  },

  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(valor) {
        this.$emit('update:modelValue', valor)
      }
    },
    totalPaginasProductos() {
      return Math.max(1, Math.ceil(this.productosCantData / 50))
    },
    catalogosStore() {
      return useCatalogosStore()
    }
  },

  watch: {
    modelValue(visible) {
      if (!visible) return
      this.cargarPropiedadesDisponibles()
      this.restaurar()
    }
  },

  methods: {
    // Al abrir se reconstruye el formulario con lo que la fila ya tenia. `valorInicial` guarda
    // idProducto pero no el nombre del producto: por eso se conserva aparte en _producto.
    restaurar() {
      const inicial = this.valorInicial
      if (!inicial) {
        this.productoSeleccionado = null
        this.nombre = ''
        this.descripcion = ''
        this.propiedades = []
        return
      }
      this.productoSeleccionado = inicial._producto || null
      this.nombre = inicial.Nombre || ''
      this.descripcion = inicial.Descripcion || ''
      this.propiedades = (inicial.Propiedades || []).map((p) => {
        const encontrada = this.propiedadesDisponibles.find((d) => d.Id === p.idPropiedad)
        return {
          idPropiedad: p.idPropiedad,
          tipoDato: encontrada ? encontrada.TipoDato : '',
          valor: p.Valor
        }
      })
    },

    async cargarPropiedadesDisponibles() {
      try {
        this.propiedadesDisponibles = await this.catalogosStore.getPropiedades(this.idEmpresa)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de propiedades'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    async refrescarPropiedades() {
      this.catalogosStore.invalidar(this.idEmpresa)
      await this.cargarPropiedadesDisponibles()
    },

    abrirDialogProducto() {
      this.dialogProducto = true
      this.buscarProductos(1)
    },

    async buscarProductos(pagina) {
      this.cargandoProductos = true
      try {
        const { data } = await productoService.getActivas({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.productosFiltros.campoOrdenar,
          orden: this.productosFiltros.orden,
          pagina,
          textoFiltro: this.productosFiltros.textoFiltro || ''
        })
        this.productos = data.data || []
        this.productosCantData = data.cantData || 0
        this.productosPagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los productos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoProductos = false
      }
    },

    seleccionarProducto(prod) {
      this.productoSeleccionado = {
        proId: prod.proId,
        proNombre: prod.proNombre,
        TipoProductoNombre: prod.TipoProductoNombre,
        CategoriaNombre: prod.CategoriaNombre,
        UnidadMedidaNombre: prod.UnidadMedidaNombre
      }
      this.dialogProducto = false
    },

    agregarPropiedad() {
      this.propiedades.push({ idPropiedad: null, tipoDato: '', valor: '' })
    },

    quitarPropiedad(index) {
      this.propiedades.splice(index, 1)
    },

    onCambioPropiedad(fila) {
      const encontrada = this.propiedadesDisponibles.find((p) => p.Id === fila.idPropiedad)
      fila.tipoDato = encontrada ? encontrada.TipoDato : ''
    },

    guardar() {
      if (!this.productoSeleccionado) {
        Swal.fire('Atención', 'Seleccione el producto del artículo nuevo', 'warning')
        return
      }
      const vNombre = String(this.nombre || '').trim()
      if (!vNombre) {
        Swal.fire('Atención', 'El nombre del artículo no puede estar vacío', 'warning')
        return
      }

      const propiedadesEnviar = this.propiedades
        .filter((fila) => fila.idPropiedad && String(fila.valor || '').trim() !== '')
        .map((fila) => ({ idPropiedad: fila.idPropiedad, Valor: String(fila.valor).trim() }))

      this.$emit('guardar', {
        idProducto: this.productoSeleccionado.proId,
        // el backend lo pasa a mayusculas igual; mandarlo ya normalizado evita que la tabla del
        // formulario muestre algo distinto de lo que se va a guardar.
        Nombre: vNombre.toUpperCase(),
        Descripcion: String(this.descripcion || '').trim() || null,
        Propiedades: propiedadesEnviar,
        // no viaja al backend: es para poder reabrir el dialogo mostrando el producto elegido
        _producto: this.productoSeleccionado
      })
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
```

- [ ] **Step 2: Conectarlo en `CompraForm.vue` — template**

Habilita el `book-plus` de la tabla. Reemplaza el botón deshabilitado:

```html
                <td class="text-center">
                  <v-btn
                    icon="mdi-book-plus"
                    size="small"
                    variant="text"
                    disabled
                    title="Dar de alta un artículo nuevo (pendiente)"
                  />
                </td>
```

por:

```html
                <td class="text-center">
                  <v-btn
                    icon="mdi-book-plus"
                    size="small"
                    variant="text"
                    color="secondary"
                    title="Dar de alta un artículo nuevo"
                    @click="abrirArticuloNuevo(i)"
                  />
                </td>
```

En la columna «Artículo», marca los nuevos con un chip. Reemplaza:

```html
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
```

por:

```html
                  <span v-if="fila.articuloNombre">{{ fila.articuloNombre }}</span>
                  <v-chip v-if="fila.articuloNuevo" size="x-small" color="secondary" variant="tonal" class="ml-1">
                    Nuevo
                  </v-chip>
```

Y agrega el diálogo junto a los otros dos, al final del `v-container`:

```html
    <ArticuloNuevoDialog
      v-model="dialogArticuloNuevo"
      :id-empresa="idEmpresa"
      :valor-inicial="filaActiva !== null ? lineas[filaActiva].articuloNuevo : null"
      @guardar="onArticuloNuevoGuardado"
    />
```

- [ ] **Step 3: Conectarlo en `CompraForm.vue` — script**

Import y registro:

```js
import ArticuloNuevoDialog from '@/views/Compras/ArticuloNuevoDialog.vue'
```

```js
  components: { TercerosSeleccionar, ArticulosSeleccionar, ArticuloNuevoDialog },
```

En `data`, junto a `dialogArticulo`:

```js
      dialogArticuloNuevo: false,
```

Dos métodos nuevos:

```js
    abrirArticuloNuevo(index) {
      this.filaActiva = index
      this.dialogArticuloNuevo = true
    },

    onArticuloNuevoGuardado(articuloNuevo) {
      if (this.filaActiva === null) return
      const fila = this.lineas[this.filaActiva]
      fila.articuloNuevo = articuloNuevo
      fila.articuloNombre = articuloNuevo.Nombre
      fila.articuloSKU = ''
      // Cada linea trae idArticulo O ArticuloNuevo, nunca ambos: el backend responde 400 con las
      // dos cosas. Dar de alta un articulo descarta el existente de ESTA fila.
      fila.idArticulo = null
      this.filaActiva = null
    },
```

- [ ] **Step 4: Quitar `_producto` del payload**

`_producto` es de uso interno del diálogo y **no pertenece al contrato**: el backend no lo valida, pero mandar campos que no existen en el contrato es la clase de ruido que confunde a quien lea la petición en seis meses. En `armarArticulos`, cambia:

```js
        if (fila.articuloNuevo) {
          linea.ArticuloNuevo = fila.articuloNuevo
        } else {
```

por:

```js
        if (fila.articuloNuevo) {
          // `_producto` es solo para poder reabrir el dialogo: no viaja al backend.
          const { _producto, ...articuloNuevo } = fila.articuloNuevo
          linea.ArticuloNuevo = articuloNuevo
        } else {
```

- [ ] **Step 5: Correr el build**

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 6: Comprobación manual — pídela al usuario y espera su respuesta**

1. Agregar una línea, elegir bodega, pulsar **`book-plus`** → se abre el diálogo con el aviso de que el artículo nace sin precio y no vendible.
2. Elegir producto → se llenan tipo de producto, categoría y unidad de medida. Escribir nombre, descripción y una propiedad con su valor. Guardar → el diálogo cierra y la columna **Artículo** muestra el nombre **en mayúsculas** con el chip **«Nuevo»**.
3. Poner cantidad `1`, costo `180000`, efectivo `180000`, guardar → «Compra registrada».
4. Ir a **Inventario → Artículos** y buscar ese nombre: el artículo **existe**, sin precio de venta y **no vendible**.
5. **Volver a abrir** el `book-plus` de una fila que ya tiene artículo nuevo → el diálogo muestra el producto, el nombre, la descripción y las propiedades ya escritas. → es el `valorInicial`.
6. **[REGRESIÓN de la regla XOR]** En una fila con artículo nuevo, pulsar `+` y elegir un artículo existente → el chip «Nuevo» **desaparece** y queda el existente. Y al revés: en una fila con existente, dar de alta uno nuevo → aparece el chip y el existente se descarta. **Nunca deben quedar los dos.**
7. Guardar sin elegir producto → «Seleccione el producto del artículo nuevo». Con producto pero sin nombre → «El nombre del artículo no puede estar vacío».
8. Una propiedad elegida **sin valor** se descarta en silencio al guardar y la compra pasa. → el backend rechaza un valor vacío, así que no se envía.
9. Una compra con **dos líneas: una con artículo existente y una con artículo nuevo**, en la misma petición → se registra.
10. **[REGRESIÓN tarea 3]** El camino feliz de contado sigue funcionando: subtotal y saldo se actualizan y una compra que cuadra se guarda.

- [ ] **Step 7: Commit**

```bash
git add src/views/Compras/ArticuloNuevoDialog.vue src/views/Compras/CompraForm.vue
git commit -m "feat(compras): alta de articulo nuevo dentro de una linea"
```

---

## Task 5: Compra a CREDITO

Deliverable: registrar los tres escenarios de crédito —una cuota, varias iguales, varias distintas— con la cabecera y el desglose enviados como el backend los espera.

**Files:**
- Modify: `src/views/Compras/CompraForm.vue`

**Interfaces:**
- Consumes: todo lo de las tareas 3 y 4.
- Produces: nada que otras tareas consuman.

- [ ] **Step 1: Agregar el bloque de crédito al template**

Va **después** de la `v-row` del dinero y **antes** del `v-divider` que abre «Artículos comprados»:

```html
        <template v-if="esCredito">
          <v-divider class="my-4" />
          <div class="mb-2 text-subtitle-2">Condiciones del crédito</div>

          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="fechaCompromiso"
                label="Fecha de compromiso"
                type="date"
                :disabled="fechaCompromisoDeshabilitada"
                :hint="fechaCompromisoDeshabilitada
                  ? 'Con más de una cuota las fechas se registran en la tabla'
                  : 'Obligatoria cuando hay una sola cuota'"
                persistent-hint
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="numeroCuotas"
                label="Número de cuotas"
                type="number"
                min="1"
                step="1"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="valorCuota"
                label="Valor de la cuota"
                type="number"
                min="0"
                step="0.01"
                :disabled="cuotasEditadas"
                :hint="cuotasEditadas ? 'Las cuotas tienen valores distintos' : ''"
                persistent-hint
                variant="outlined"
                density="comfortable"
                @update:model-value="sembrarCuotas"
              />
              <v-btn
                v-if="cuotasEditadas"
                variant="text"
                size="small"
                prepend-icon="mdi-undo"
                class="mt-1"
                @click="volverAValorUnico"
              >
                Volver a un valor único
              </v-btn>
            </v-col>
          </v-row>

          <template v-if="cuotas.length">
            <div class="mt-2 mb-2 text-subtitle-2">Detalle de las cuotas</div>
            <p class="text-caption text-medium-emphasis mb-2">
              Las cuotas las calcula el proveedor con su propio interés: aquí sólo se transcriben.
              Es normal que sumen más que el saldo.
            </p>
            <v-table density="compact" class="mb-4">
              <thead>
                <tr>
                  <th style="width: 80px">N°</th>
                  <th style="min-width: 150px">Valor</th>
                  <th style="min-width: 170px">Fecha de pago</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuota in cuotas" :key="cuota.NumCuota">
                  <td>{{ cuota.NumCuota }}</td>
                  <td>
                    <v-text-field
                      v-model.number="cuota.ValorCuota"
                      type="number"
                      min="0"
                      step="0.01"
                      variant="outlined"
                      density="compact"
                      hide-details
                      @update:model-value="onValorFilaEditado"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="cuota.FechaPago"
                      type="date"
                      clearable
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </template>
```

- [ ] **Step 2: Ampliar `data`**

Junto a `transaccion`:

```js
      fechaCompromiso: null,
      numeroCuotas: 1,
      valorCuota: null,
      cuotas: [],
      // true en cuanto el usuario edita el valor de UNA fila: a partir de ahi la cabecera deja de
      // ser "el valor comun" y se manda ValorCuota: null con el desglose (escenario 3).
      cuotasEditadas: false,
```

- [ ] **Step 3: Agregar los dos computed y los watchers**

Dentro de `computed`:

```js
    esCredito() {
      return this.tipoCompra === 'CREDITO'
    },

    // El backend DESCARTA FechaCompromiso cuando NumeroCuotas > 1: con varias cuotas las fechas
    // son de las cuotas y viven en CompraCuotas. Dejarla editable seria dejar al usuario
    // escribiendo una fecha que nunca se guarda.
    fechaCompromisoDeshabilitada() {
      return Number(this.numeroCuotas) > 1
    },
```

Y un bloque `watch` nuevo, entre `computed` y `created`:

```js
  watch: {
    tipoCompra(valor) {
      if (valor === 'CONTADO') {
        // una compra de contado no guarda datos de financiacion: se limpian para que no viajen
        // restos de un cambio de opinion.
        this.fechaCompromiso = null
        this.numeroCuotas = 1
        this.valorCuota = null
        this.cuotas = []
        this.cuotasEditadas = false
      } else {
        this.sincronizarCuotas()
      }
    },

    numeroCuotas() {
      this.sincronizarCuotas()
    }
  },
```

- [ ] **Step 4: Agregar los cuatro métodos de las cuotas**

```js
    // La tabla existe solo con mas de una cuota: con una sola, el monto y la fecha son datos de
    // la cabecera y no justifican una tabla.
    sincronizarCuotas() {
      const cantidad = Number(this.numeroCuotas)
      if (!Number.isInteger(cantidad) || cantidad < 2) {
        this.cuotas = []
        this.cuotasEditadas = false
        return
      }

      const anteriores = this.cuotas
      this.cuotas = Array.from({ length: cantidad }, (unused, i) => {
        const previa = anteriores[i]
        if (previa) return previa
        return {
          NumCuota: i + 1,
          ValorCuota: this.cuotasEditadas ? null : this.valorCuota,
          FechaPago: null
        }
      })
    },

    // El valor de la cabecera es "el valor comun": al escribirlo, siembra todas las filas.
    sembrarCuotas() {
      if (this.cuotasEditadas) return
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = this.valorCuota
      })
    },

    // Editar el valor de UNA fila significa que las cuotas no son iguales: la cabecera se vacia y
    // se deshabilita, y el envio pasa al escenario 3.
    onValorFilaEditado() {
      if (this.cuotasEditadas) return
      this.cuotasEditadas = true
      this.valorCuota = null
    },

    // La salida del estado anterior. Sin esto, un valor cambiado por error deja al usuario
    // encerrado en el escenario 3 y obligado a reescribir las N filas a mano.
    volverAValorUnico() {
      this.cuotasEditadas = false
      this.valorCuota = null
      this.cuotas.forEach((cuota) => {
        cuota.ValorCuota = null
      })
    },
```

- [ ] **Step 5: Agregar `armarCredito`**

Es la traducción de la pantalla al contrato. La tabla del spec §5.5, en código:

```js
    // Traduce el estado de la pantalla a los cuatro campos de credito del payload.
    //
    // Con NumeroCuotas > 1 el backend descarta FechaCompromiso, asi que se manda null en vez de
    // arrastrar un valor que se va a ignorar.
    //
    // La regla que parece arbitraria y no lo es: validarCuotasCompra exige ValorCuota > 0 en CADA
    // fila del desglose. Una fila que solo lleva fecha se rechazaria con "El valor de la cuota
    // debe ser mayor a cero", asi que una fila se envia con su valor sembrado o no se envia.
    armarCredito() {
      const numeroCuotas = Number(this.numeroCuotas)

      // Escenario 1: una cuota, un monto, fecha obligatoria en la cabecera.
      if (numeroCuotas === 1) {
        return {
          FechaCompromiso: this.fechaCompromiso || null,
          NumeroCuotas: numeroCuotas,
          ValorCuota: Number(this.valorCuota),
          Cuotas: null
        }
      }

      // Escenario 3: valores distintos. La cabecera va NULL y el desglose lleva todas las filas.
      if (this.cuotasEditadas) {
        return {
          FechaCompromiso: null,
          NumeroCuotas: numeroCuotas,
          ValorCuota: null,
          Cuotas: this.cuotas.map((cuota) => ({
            NumCuota: cuota.NumCuota,
            ValorCuota: Number(cuota.ValorCuota),
            FechaPago: cuota.FechaPago || null
          }))
        }
      }

      // Escenario 2: mismo valor. Solo se envian las filas CON fecha, con el valor de la
      // cabecera. Sin ninguna fecha, el desglose no se envia y el valor vive solo en la cabecera.
      const conFecha = this.cuotas.filter((cuota) => cuota.FechaPago)
      return {
        FechaCompromiso: null,
        NumeroCuotas: numeroCuotas,
        ValorCuota: Number(this.valorCuota),
        Cuotas: conFecha.length
          ? conFecha.map((cuota) => ({
              NumCuota: cuota.NumCuota,
              ValorCuota: Number(this.valorCuota),
              FechaPago: cuota.FechaPago
            }))
          : null
      }
    },
```

- [ ] **Step 6: Extender `validarCabecera` con las reglas del crédito**

Justo antes del `return null` final, dentro de `validarCabecera`:

```js
      if (this.tipoCompra === 'CREDITO') {
        // Espejo de la del contado, del otro lado: alla el saldo debe ser cero, aca positivo.
        if (!(this.saldo > 0.01)) {
          return 'Una compra a crédito debe quedar con saldo pendiente; use CONTADO'
        }

        const numeroCuotas = Number(this.numeroCuotas)
        // Number.isInteger('3') es false, y un v-text-field puede entregar cadena: de ahi el
        // Number() antes de comprobar. Tambien atrapa un 3.5 tecleado a mano.
        if (!Number.isInteger(numeroCuotas) || numeroCuotas < 1) {
          return 'El número de cuotas debe ser un entero mayor o igual a 1'
        }
        if (numeroCuotas === 1 && !this.fechaCompromiso) {
          return 'La fecha de pago es obligatoria cuando hay una sola cuota'
        }

        const credito = this.armarCredito()
        if (!credito.Cuotas && !(Number(credito.ValorCuota) > 0)) {
          return 'El valor de la cuota es obligatorio cuando no se detallan las cuotas'
        }
        if (credito.Cuotas && credito.Cuotas.some((cuota) => !(Number(cuota.ValorCuota) > 0))) {
          return 'El valor de cada cuota debe ser mayor a cero'
        }
      }
```

**Lo que NO se agrega aquí, y es deliberado:** ninguna comprobación de que `numeroCuotas × valorCuota` se parezca al saldo. Con interés del proveedor, las cuotas tienen que sumar más. Ni como aviso.

- [ ] **Step 7: Mandar los campos de crédito en `confirmar`**

Después de construir `payload` y antes del `this.guardando = true`:

```js
      if (this.esCredito) {
        const credito = this.armarCredito()
        payload.FechaCompromiso = credito.FechaCompromiso
        payload.NumeroCuotas = credito.NumeroCuotas
        payload.ValorCuota = credito.ValorCuota
        // `Cuotas` es opcional: solo se manda si hay desglose que mandar.
        if (credito.Cuotas) payload.Cuotas = credito.Cuotas
      }
```

Con CONTADO no se toca nada: los cuatro campos de crédito simplemente no viajan.

- [ ] **Step 8: Correr el build**

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 9: Comprobación manual — pídela al usuario y espera su respuesta**

Para todas: subtotal `1.000.000` en líneas y efectivo `200.000`, de modo que el saldo sea `800.000`.

1. Elegir **Crédito** → aparece «Condiciones del crédito» con los tres campos en una fila. Elegir **Contado** → desaparece.
2. **Escenario 1:** `Número de cuotas` = `1`. La fecha de compromiso está **habilitada** con el hint «Obligatoria cuando hay una sola cuota», y **no hay tabla**. Guardar sin fecha → «La fecha de pago es obligatoria cuando hay una sola cuota». Con fecha y valor `900000` → se registra.
3. `Número de cuotas` = `3` → la fecha de compromiso queda **deshabilitada** con el hint «Con más de una cuota las fechas se registran en la tabla», y aparece la **tabla con 3 filas** numeradas 1, 2, 3.
4. **Escenario 2 sin fechas:** `Valor de la cuota` = `300000` → las tres filas se **siembran** con 300.000. Guardar. Abrir el detalle: `compraValorCuota` es **300.000** y **no hay cuotas registradas**.
5. **Escenario 2 con fechas:** lo mismo, pero poniendo fecha a las tres filas. Guardar. En el detalle: `compraValorCuota` **300.000** y **las tres cuotas** con su fecha y valor.
6. **Escenario 3:** con las filas sembradas en 300.000, cambiar la fila 2 a `100000` → el campo **Valor de la cuota se vacía y se deshabilita**, con el hint «Las cuotas tienen valores distintos» y el botón *Volver a un valor único*. Guardar. En el detalle: `compraValorCuota` en **vacío/null** y **el desglose completo**.
7. **La salida:** desde el estado anterior, pulsar *Volver a un valor único* → la cabecera se **re-habilita**, las filas se vacían, y escribir `250000` las vuelve a sembrar. → sin esto el usuario quedaba encerrado.
8. **Crédito que no debe ser crédito:** efectivo `1.000.000` (saldo `0`) → «Una compra a crédito debe quedar con saldo pendiente; use CONTADO».
9. `Número de cuotas` = `3` **sin valor en la cabecera y sin tocar la tabla** → «El valor de la cuota es obligatorio cuando no se detallan las cuotas».
10. **[REVIEW FOCUS 1]** `Número de cuotas` tecleado a mano como `3`: la compra **se registra**. Si sale «El número de cuotas debe ser un entero mayor o igual a 1», el valor llegó como cadena `'3'` y falta el `Number()` — es el fallo que este punto busca. Probar también `3.5` → debe rechazarse con ese mismo mensaje.
11. **Cuotas que suman más que el saldo:** saldo `800.000` con 3 cuotas de `400.000` (total 1.200.000) → **se registra sin ninguna advertencia**. → es correcto: el interés del proveedor va por fuera.
12. Cambiar de **Crédito** a **Contado** y guardar una compra de contado: no viaja ningún resto de los campos de crédito y se registra.
13. **[REGRESIÓN tareas 3 y 4]** El camino feliz de contado y la línea con artículo nuevo siguen funcionando.

- [ ] **Step 10: Commit**

```bash
git add src/views/Compras/CompraForm.vue
git commit -m "feat(compras): condiciones de credito y detalle de cuotas en el alta"
```

---

## Task 6: Detalle de la compra y anulación

Deliverable: el lápiz del grid abre la compra completa —cabecera, líneas y cuotas— y permite anularla con motivo.

**Files:**
- Modify: `src/views/Compras/CompraDetalle.vue` (hoy es el cascarón de la tarea 1)

**Interfaces:**
- Consumes: `compraService.getById`, `compraService.anular` (tarea 1).
- Produces: `cargar()` recarga la pantalla completa; la tarea 7 la llama tras cada operación de cuota. `compra`, `lineas` y `cuotas` en `data`; la tarea 8 los pasa al generador de PDF.

- [ ] **Step 1: Escribir `src/views/Compras/CompraDetalle.vue` completo**

Reemplaza el cascarón. La tabla de cuotas es de lectura en esta tarea; el CRUD llega en la 7.

```vue
<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Compra {{ compra ? '#' + compra.compraId : '' }}
          <v-chip
            v-if="compra"
            :color="esActiva ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActiva ? 'Activa' : 'Anulada' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una compra no se edita: la única operación correctiva es anularla.
        </p>
      </div>
      <v-btn
        v-if="compra && esActiva"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular compra
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="compra">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cabecera</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha</div>
            <div>{{ formatearFecha(compra.compraFecha) }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Documento soporte</div>
            <div>{{ compra.compraDocumentoSoporte || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Tipo de compra</div>
            <div>{{ compra.compraTipoCompra }}</div>
          </v-col>
          <v-col cols="12" sm="8">
            <div class="text-caption text-medium-emphasis">Tercero</div>
            <div>
              {{ compra.compraTercero }}
              <span class="text-medium-emphasis">
                ({{ compra.compraTerceroTipoDoc || '' }} {{ compra.compraTerceroNumeroDoc || '' }})
              </span>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Subtotal</div>
            <div>{{ formatearMoneda(compra.compraSubtotal) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Descuento</div>
            <div>{{ formatearMoneda(compra.compraDescuento) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Cancelado</div>
            <div>{{ formatearMoneda(compra.compraCancelado) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Saldo</div>
            <div class="font-weight-medium">{{ formatearMoneda(compra.compraSaldo) }}</div>
          </v-col>
        </v-row>

        <template v-if="esCredito">
          <v-divider class="my-4" />
          <v-row dense>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Número de cuotas</div>
              <div>{{ compra.compraNumeroCuotas ?? '-' }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Valor de la cuota</div>
              <div>
                {{ compra.compraValorCuota === null || compra.compraValorCuota === undefined
                  ? 'Valores distintos (ver detalle)'
                  : formatearMoneda(compra.compraValorCuota) }}
              </div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Fecha de compromiso</div>
              <div>{{ compra.compraFechaCompromiso ? formatearFecha(compra.compraFechaCompromiso) : '-' }}</div>
            </v-col>
          </v-row>
        </template>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Artículos comprados</div>
        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Bodega</th>
                <th class="text-end">Cantidad</th>
                <th class="text-end">Costo unidad</th>
                <th class="text-end">Costo total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!lineas.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  Esta compra no tiene líneas
                </td>
              </tr>
              <tr v-for="(linea, i) in lineas" :key="i">
                <td>{{ linea.detArticuloNombre }}</td>
                <td>{{ linea.detBodegaNombre }}</td>
                <td class="text-end">{{ linea.detCantidad }}</td>
                <td class="text-end">{{ formatearMoneda(linea.detCostoUnidad) }}</td>
                <td class="text-end">{{ formatearMoneda(totalLinea(linea)) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card>

      <v-card v-if="esCredito" class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cuotas</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 80px">N°</th>
              <th class="text-end">Valor</th>
              <th>Fecha de pago</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!cuotas.length">
              <td colspan="4" class="text-center py-6 text-medium-emphasis">
                No hay cuotas registradas
              </td>
            </tr>
            <tr v-for="cuota in cuotas" :key="cuota.cuoId">
              <td>{{ cuota.cuoNumCuota }}</td>
              <td class="text-end">{{ formatearMoneda(cuota.cuoValorCuota) }}</td>
              <td>{{ cuota.cuoFechaPago ? formatearFecha(cuota.cuoFechaPago) : '-' }}</td>
              <td class="text-center">
                <v-chip
                  :color="cuota.cuoEstado === 'CANCELADA' ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ etiquetaEstadoCuota(cuota.cuoEstado) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">
          Marcar una cuota como pagada no mueve caja ni recalcula el saldo de la compra: es un
          registro informativo. El movimiento de caja llegará con el módulo de Abonos.
        </p>
      </v-card>

      <v-card v-if="!esActiva" class="pa-6 mb-4" elevation="1" color="error" variant="tonal">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="text-caption">Motivo</div>
            <div>{{ compra.compraMotivoAnulacion || '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Fecha</div>
            <div>{{ compra.compraFechaAnulacion ? formatearFecha(compra.compraFechaAnulacion) : '-' }}</div>
          </v-col>
          <v-col cols="12" sm="3">
            <div class="text-caption">Anulada por</div>
            <div>{{ compra.compraUsuarioAnulador || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import compraService from '@/services/compraService'

export default {
  name: 'CompraDetalle',

  data() {
    return {
      cargando: false,
      anulando: false,
      compra: null,
      lineas: [],
      cuotas: []
    }
  },

  computed: {
    // La empresa sale de la URL, NO del store. Si el usuario cambia de empresa en la barra
    // superior con el detalle abierto, anularcompra y las cuotas tienen que seguir apuntando a
    // la compra correcta. Por eso el :EmpId de la ruta no es decorativo.
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    idCompra() {
      return Number(this.$route.params.ComId)
    },
    esActiva() {
      // compraEstado es 1 activa / 0 anulada. No es "pagada/pendiente".
      return this.compra?.compraEstado === 1
    },
    esCredito() {
      return this.compra?.compraTipoCompra === 'CREDITO'
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await compraService.getById({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra
        })
        this.compra = data.data
        this.lineas = data.data.lineas || []
        this.cuotas = data.data.cuotas || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la compra'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async anular() {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular esta compra?',
        // Decirlo aqui no es cortesia: sin esto el usuario supone que el inventario se corrige
        // solo, y no se corrige.
        html:
          '<p style="text-align:left">Anular <b>no revierte el inventario ni la caja</b>. Sólo marca la compra ' +
          'y guarda el motivo, quién anuló y cuándo. El ajuste de existencias es manual, por el ' +
          'módulo de Ajustes.</p>' +
          '<p style="text-align:left">Escriba el motivo (entre 5 y 300 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 300 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        // Se valida aqui para no gastar un viaje en un 400 evitable: el backend exige lo mismo.
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 5) return 'El motivo debe tener al menos 5 caracteres'
          if (texto.length > 300) return 'El motivo no puede superar los 300 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulando = true
      try {
        const { data } = await compraService.anular({
          idEmpresa: this.idEmpresa,
          idCompra: this.idCompra,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Compra anulada', 'success')
        // Se recarga en vez de parchear el estado local: una llamada, y la pantalla se
        // reconfigura sola (chip rojo, boton fuera, tarjeta de anulacion).
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    // cuoEstado 'CANCELADA' significa PAGADA (sentido coloquial de "cancelar una cuota"), mientras
    // compraEstado 0 significa ANULADA. Son opuestos con nombres parecidos y en la misma
    // pantalla, asi que el front traduce: al backend siguen viajando PENDIENTE y CANCELADA.
    etiquetaEstadoCuota(estado) {
      return estado === 'CANCELADA' ? 'Pagada' : 'Pendiente'
    },

    totalLinea(linea) {
      const total = (Number(linea.detCantidad) || 0) * (Number(linea.detCostoUnidad) || 0)
      return Math.round(total * 100) / 100
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (Number.isNaN(numero)) return valor
      return `$ ${numero.toLocaleString('es-CO')}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    }
  }
}
</script>
```

- [ ] **Step 2: Correr el build**

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 3: Comprobación manual — pídela al usuario y espera su respuesta**

1. El lápiz de una compra de **contado** abre el detalle: cabecera con tercero y dinero, tabla de líneas con nombre de artículo y bodega, **sin tarjeta de cuotas** y sin tarjeta de anulación.
2. El detalle de una compra a **crédito** con cuotas: se ve el número de cuotas, el valor de cuota y la tabla de cuotas.
3. Una compra del **escenario 3** muestra en «Valor de la cuota» el texto **«Valores distintos (ver detalle)»** en vez de un vacío. → `compraValorCuota` viene `null`.
4. Una cuota con `cuoEstado = 'CANCELADA'` sale con chip verde **«Pagada»**, no «Cancelada» ni «Anulada». Una `PENDIENTE`, chip gris «Pendiente». → es el vocabulario cruzado: en la misma pantalla «anulada» significa otra cosa.
5. Debajo de la tabla de cuotas está el aviso de que marcarlas pagadas no mueve caja.
6. **Anular:** el diálogo dice que **no revierte inventario ni caja**. Un motivo de 3 caracteres → «El motivo debe tener al menos 5 caracteres», **sin llamar al backend**. Cancelar → no pasa nada.
7. Anular con un motivo válido → «Compra anulada», y la pantalla queda: **chip rojo**, botón *Anular* **fuera**, tarjeta de **Anulación** con motivo, fecha y usuario.
8. Volver al grid: esa compra sale con chip rojo **«Anulada»**.
9. Intentar anular **una compra ya anulada**: el botón no existe. (Si se fuerza por URL, el backend responde 400 y sale el Swal con su mensaje.)
10. **[REVIEW FOCUS — empresa desde la URL]** Abrir el detalle de una compra, **cambiar de empresa en la barra superior** sin salir de la pantalla, y anular. Debe anular **esa** compra, no responder «no existe o es de otra empresa». → si falla, `idEmpresa` se está leyendo del store en vez de `$route.params.EmpId`.
11. Una compra de otra empresa por URL manipulada → Swal con el mensaje del backend y vuelve atrás, sin pantalla en blanco.

- [ ] **Step 4: Commit**

```bash
git add src/views/Compras/CompraDetalle.vue
git commit -m "feat(compras): detalle de la compra y anulacion"
```

---

## Task 7: CRUD de cuotas en el detalle

Deliverable: agregar, editar y borrar cuotas de una compra a crédito activa.

**Files:**
- Modify: `src/views/Compras/CompraDetalle.vue`

**Interfaces:**
- Consumes: `compraService.createCuota`, `updateCuota`, `deleteCuota` (tarea 1); `cargar()` (tarea 6).
- Produces: nada que otras tareas consuman.

- [ ] **Step 1: Agregar los botones a la tarjeta de cuotas**

En el encabezado de la tarjeta de cuotas, reemplaza:

```html
        <div class="text-subtitle-2 mb-3">Cuotas</div>
```

por:

```html
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2">Cuotas</span>
          <v-btn
            v-if="esActiva && numerosCuotaDisponibles.length"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            @click="abrirCuotaNueva"
          >
            Agregar cuota
          </v-btn>
        </div>
```

Agrega la columna de acciones a la cabecera de esa tabla, después de `Estado`:

```html
              <th v-if="esActiva" class="text-center" style="width: 100px">Acciones</th>
```

Y a cada fila, después de la celda del chip:

```html
              <td v-if="esActiva" class="text-center">
                <v-btn
                  icon="mdi-pencil" size="small" variant="text"
                  title="Editar esta cuota" @click="abrirCuotaEdicion(cuota)"
                />
                <v-btn
                  icon="mdi-delete" size="small" variant="text"
                  title="Borrar esta cuota" @click="borrarCuota(cuota)"
                />
              </td>
```

En la fila del estado vacío, el `colspan` pasa a depender de la columna de acciones:

```html
            <tr v-if="!cuotas.length">
              <td :colspan="esActiva ? 5 : 4" class="text-center py-6 text-medium-emphasis">
                No hay cuotas registradas
              </td>
            </tr>
```

**Los botones no se muestran si la compra está anulada** porque los tres endpoints responden 400 sobre una compra anulada: congela sus cuotas. La lectura sigue funcionando.

- [ ] **Step 2: Agregar el diálogo de cuota al final del template**

Dentro del `v-container`, después del último `v-card`:

```html
    <v-dialog v-model="dialogCuota" max-width="520">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-h6">{{ cuotaEnEdicion ? 'Editar cuota' : 'Agregar cuota' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogCuota = false" />
        </div>

        <v-select
          v-if="!cuotaEnEdicion"
          v-model="formCuota.NumCuota"
          :items="numerosCuotaDisponibles"
          label="Número de cuota"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Sólo se ofrecen los números que aún no están registrados"
          persistent-hint
        />
        <v-text-field
          v-else
          :model-value="formCuota.NumCuota"
          label="Número de cuota"
          readonly
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <v-text-field
          v-model.number="formCuota.ValorCuota"
          label="Valor de la cuota"
          type="number"
          min="0"
          step="0.01"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <v-text-field
          v-model="formCuota.FechaPago"
          label="Fecha de pago"
          type="date"
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hint="Vaciarla borra la fecha registrada"
          persistent-hint
        />

        <v-select
          v-model="formCuota.Estado"
          :items="opcionesEstadoCuota"
          item-title="texto"
          item-value="valor"
          label="Estado"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          hide-details
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="dialogCuota = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardandoCuota" @click="guardarCuota">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>
```

- [ ] **Step 3: Ampliar `data`**

```js
      dialogCuota: false,
      guardandoCuota: false,
      // null = estamos agregando; con valor = estamos editando esa cuota
      cuotaEnEdicion: null,
      formCuota: { NumCuota: null, ValorCuota: null, FechaPago: null, Estado: 'PENDIENTE' },
      // 'CANCELADA' significa PAGADA. Al backend viajan los valores del contrato; el usuario lee
      // la palabra de la derecha.
      opcionesEstadoCuota: [
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'CANCELADA', texto: 'Pagada' }
      ],
```

- [ ] **Step 4: Agregar el computed de los números libres**

```js
    // Sólo se ofrecen los numeros que faltan: asi el 400 "esa cuota ya esta registrada" no puede
    // ocurrir por descuido.
    numerosCuotaDisponibles() {
      const total = Number(this.compra?.compraNumeroCuotas) || 0
      const usados = new Set(this.cuotas.map((cuota) => Number(cuota.cuoNumCuota)))
      const libres = []
      for (let numero = 1; numero <= total; numero++) {
        if (!usados.has(numero)) libres.push(numero)
      }
      return libres
    },
```

- [ ] **Step 5: Agregar los cinco métodos**

```js
    // El backend manda '2026-10-15T00:00:00.000Z' y el input type="date" necesita 'YYYY-MM-DD'.
    // Se corta la cadena en vez de pasar por new Date(): convertir a Date local corre la fecha un
    // dia en cualquier zona al oeste de UTC, y la cuota aparecería con la fecha del dia anterior.
    aFechaInput(valor) {
      if (!valor) return null
      return String(valor).slice(0, 10)
    },

    abrirCuotaNueva() {
      this.cuotaEnEdicion = null
      this.formCuota = {
        NumCuota: this.numerosCuotaDisponibles[0] ?? null,
        ValorCuota: null,
        FechaPago: null,
        Estado: 'PENDIENTE'
      }
      this.dialogCuota = true
    },

    abrirCuotaEdicion(cuota) {
      this.cuotaEnEdicion = cuota
      this.formCuota = {
        NumCuota: cuota.cuoNumCuota,
        ValorCuota: Number(cuota.cuoValorCuota),
        FechaPago: this.aFechaInput(cuota.cuoFechaPago),
        Estado: cuota.cuoEstado || 'PENDIENTE'
      }
      this.dialogCuota = true
    },

    async guardarCuota() {
      if (!this.formCuota.NumCuota) {
        Swal.fire('Atención', 'Elija el número de la cuota', 'warning')
        return
      }
      if (!(Number(this.formCuota.ValorCuota) > 0)) {
        Swal.fire('Atención', 'El valor de la cuota debe ser mayor a cero', 'warning')
        return
      }

      this.guardandoCuota = true
      try {
        if (this.cuotaEnEdicion) {
          // Se envian los cuatro campos siempre. El endpoint conserva lo que no venga, pero
          // mandarlo todo hace que vaciar la fecha llegue como FechaPago: null —que SI es un
          // cambio, es como se borra una fecha ya puesta— y que un campo intacto viaje con su
          // propio valor, que es un no-op.
          const { data } = await compraService.updateCuota({
            idEmpresa: this.idEmpresa,
            idCuota: this.cuotaEnEdicion.cuoId,
            NumCuota: Number(this.formCuota.NumCuota),
            ValorCuota: Number(this.formCuota.ValorCuota),
            FechaPago: this.formCuota.FechaPago || null,
            Estado: this.formCuota.Estado
          })
          await Swal.fire('Éxito', data.msg || 'Cuota actualizada', 'success')
        } else {
          const { data } = await compraService.createCuota({
            idEmpresa: this.idEmpresa,
            idCompra: this.idCompra,
            NumCuota: Number(this.formCuota.NumCuota),
            ValorCuota: Number(this.formCuota.ValorCuota),
            FechaPago: this.formCuota.FechaPago || null,
            Estado: this.formCuota.Estado
          })
          await Swal.fire('Éxito', data.msg || 'Cuota agregada', 'success')
        }
        this.dialogCuota = false
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo guardar la cuota'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardandoCuota = false
      }
    },

    async borrarCuota(cuota) {
      const { isConfirmed } = await Swal.fire({
        title: `¿Borrar la cuota ${cuota.cuoNumCuota}?`,
        // Es el unico DELETE real del proyecto: esta tabla no tiene estado de fila y sus datos no
        // son contables. Decirlo evita que alguien lo trate como un "inactivar".
        text: 'Se borra de forma definitiva y no hay forma de recuperarla.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Borrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828'
      })
      if (!isConfirmed) return

      try {
        // Responde 204 SIN cuerpo: no hay data.msg que leer, el mensaje es propio.
        await compraService.deleteCuota({ idEmpresa: this.idEmpresa, idCuota: cuota.cuoId })
        await Swal.fire('Éxito', 'Cuota borrada', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo borrar la cuota'
        Swal.fire('Error', mensaje, 'error')
      }
    },
```

- [ ] **Step 6: Correr el build**

Run: `npm run build`
Expected: termina sin errores.

- [ ] **Step 7: Comprobación manual — pídela al usuario y espera su respuesta**

Sobre una compra a **crédito activa de 3 cuotas** con una sola cuota registrada:

1. *Agregar cuota* → el combo **Número de cuota** ofrece sólo **2 y 3**, no el 1. → así el 400 por cuota repetida no puede ocurrir por descuido.
2. Agregar la cuota 2 con valor y fecha, estado **Pendiente** → aparece en la tabla con chip gris «Pendiente».
3. Editar esa cuota y ponerle estado **Pagada** → el chip pasa a verde **«Pagada»**. El saldo de la cabecera **no cambia** y el estado de la compra sigue «Activa». → marcar pagada es informativo.
4. El número de cuota **no se puede cambiar en edición**: sale como campo de solo lectura.
5. **Vaciar la fecha** de una cuota que la tenía (la X del campo) y guardar → la tabla muestra `-` en Fecha de pago. → `FechaPago: null` sí es un cambio.
6. **La fecha no se corre un día.** Poner `2026-10-15`, guardar, reabrir el diálogo de edición: sigue diciendo `2026-10-15`, no `2026-10-14`. → es lo que evita `aFechaInput` cortando la cadena en vez de pasar por `new Date()`.
7. Guardar con valor `0` o vacío → «El valor de la cuota debe ser mayor a cero», sin llamar al backend.
8. **[REVIEW FOCUS 3]** **Borrar** una cuota: la confirmación advierte que es definitivo, y al aceptar **desaparece de la tabla**. Si sale un Swal con un 400 sobre `idCuota`, el DELETE salió sin cuerpo: falta el `{ data: payload }` en `compraService.deleteCuota`. Es exactamente el fallo que este punto busca.
9. Cuando las 3 cuotas están registradas, el botón *Agregar cuota* **desaparece**. → no quedan números libres.
10. Sobre una compra **anulada** a crédito: la tabla de cuotas **se ve** pero **no hay** botón *Agregar cuota*, ni lápiz, ni caneca. → los tres endpoints responden 400 sobre una compra anulada.
11. Sobre una compra de **contado**: no hay tarjeta de cuotas en absoluto.
12. **[REGRESIÓN tarea 6]** Anular sigue funcionando y, tras anular una compra a crédito, los botones de cuotas desaparecen sin recargar la página a mano.

- [ ] **Step 8: Commit**

```bash
git add src/views/Compras/CompraDetalle.vue
git commit -m "feat(compras): crud de cuotas en el detalle"
```

---

## Task 8: PDF del comprobante

Deliverable: el botón de impresora del grid y el del detalle descargan un PDF del comprobante, con banner «ANULADA» si la compra lo está.

**Files:**
- Create: `src/utils/compraPdf.js`
- Modify: `src/views/Compras/ComprasList.vue`
- Modify: `src/views/Compras/CompraDetalle.vue`
- Modify: `package.json` (por el install)

**Interfaces:**
- Consumes: `compraService.getById` (tarea 1); `authStore.empresaActual` y `authStore.empresas` (store existente: la empresa tiene `Id` y `Nombre`).
- Produces: `generarPdfCompra({ cabecera, lineas, cuotas, nombreEmpresa })` — función síncrona que guarda el archivo `compra-<id>.pdf`. No pide datos por su cuenta: quien la llama los trae.

- [ ] **Step 1: Instalar las dependencias**

```bash
npm i jspdf jspdf-autotable
```

Son las dos primeras dependencias nuevas del proyecto en mucho tiempo: hoy son siete. Quedan en `package.json` y `package-lock.json`, y los dos van en el commit.

- [ ] **Step 2: Crear `src/utils/compraPdf.js`**

```js
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Se usa la forma funcional autoTable(doc, opciones) y no doc.autoTable(opciones): la funcional
// funciona en las versiones 3, 4 y 5 del plugin, la de metodo solo si el plugin alcanzo a
// registrarse sobre el prototipo.

const formatearMoneda = (valor) => {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor ?? '')
  return `$ ${numero.toLocaleString('es-CO')}`
}

const formatearFecha = (valor) => {
  if (!valor) return '-'
  // Se corta la cadena en vez de pasar por new Date(): el backend manda la fecha en UTC y
  // convertirla a local la corre un dia en cualquier zona al oeste de UTC.
  return String(valor).slice(0, 10)
}

const etiquetaEstadoCuota = (estado) => (estado === 'CANCELADA' ? 'Pagada' : 'Pendiente')

export function generarPdfCompra({ cabecera, lineas, cuotas, nombreEmpresa }) {
  const doc = new jsPDF()
  const margen = 14
  let y = 18

  doc.setFontSize(14)
  doc.text(nombreEmpresa || 'Comprobante', margen, y)
  y += 7

  doc.setFontSize(11)
  doc.text('Comprobante de compra', margen, y)
  y += 8

  // Una compra anulada impresa sin que el papel lo diga es la forma de que ese papel termine
  // usandose como si valiera. El banner va arriba y en rojo, antes de cualquier cifra.
  if (cabecera.compraEstado === 0) {
    doc.setFontSize(13)
    doc.setTextColor(198, 40, 40)
    doc.text('*** COMPRA ANULADA ***', margen, y)
    y += 6
    doc.setFontSize(9)
    doc.text(`Motivo: ${cabecera.compraMotivoAnulacion || '-'}`, margen, y)
    y += 6
    doc.setTextColor(0, 0, 0)
  }

  doc.setFontSize(9)
  const datos = [
    `N° de compra: ${cabecera.compraId}`,
    `Fecha: ${formatearFecha(cabecera.compraFecha)}`,
    `Documento soporte: ${cabecera.compraDocumentoSoporte || '-'}`,
    `Tipo: ${cabecera.compraTipoCompra}`,
    `Tercero: ${cabecera.compraTercero} (${cabecera.compraTerceroTipoDoc || ''} ${cabecera.compraTerceroNumeroDoc || ''})`
  ]
  datos.forEach((linea) => {
    doc.text(linea, margen, y)
    y += 5
  })
  y += 3

  autoTable(doc, {
    startY: y,
    head: [['Artículo', 'Bodega', 'Cantidad', 'Costo unidad', 'Costo total']],
    body: (lineas || []).map((linea) => {
      const total = (Number(linea.detCantidad) || 0) * (Number(linea.detCostoUnidad) || 0)
      return [
        linea.detArticuloNombre,
        linea.detBodegaNombre,
        String(linea.detCantidad),
        formatearMoneda(linea.detCostoUnidad),
        formatearMoneda(Math.round(total * 100) / 100)
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [106, 122, 239] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  })

  y = doc.lastAutoTable.finalY + 8

  const totales = [
    ['Subtotal', formatearMoneda(cabecera.compraSubtotal)],
    ['Descuento', formatearMoneda(cabecera.compraDescuento)],
    ['Cancelado', formatearMoneda(cabecera.compraCancelado)],
    ['Saldo', formatearMoneda(cabecera.compraSaldo)]
  ]
  doc.setFontSize(9)
  totales.forEach(([etiqueta, valor]) => {
    doc.text(etiqueta, 140, y)
    doc.text(valor, 196, y, { align: 'right' })
    y += 5
  })
  y += 5

  if (cabecera.compraTipoCompra === 'CREDITO') {
    doc.setFontSize(9)
    doc.text(`Número de cuotas: ${cabecera.compraNumeroCuotas ?? '-'}`, margen, y)
    y += 5
    const valorCuota =
      cabecera.compraValorCuota === null || cabecera.compraValorCuota === undefined
        ? 'Valores distintos (ver detalle)'
        : formatearMoneda(cabecera.compraValorCuota)
    doc.text(`Valor de la cuota: ${valorCuota}`, margen, y)
    y += 5
    if (cabecera.compraFechaCompromiso) {
      doc.text(`Fecha de compromiso: ${formatearFecha(cabecera.compraFechaCompromiso)}`, margen, y)
      y += 5
    }
    y += 3

    if ((cuotas || []).length) {
      autoTable(doc, {
        startY: y,
        head: [['N°', 'Valor', 'Fecha de pago', 'Estado']],
        body: cuotas.map((cuota) => [
          String(cuota.cuoNumCuota),
          formatearMoneda(cuota.cuoValorCuota),
          formatearFecha(cuota.cuoFechaPago),
          etiquetaEstadoCuota(cuota.cuoEstado)
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [106, 122, 239] },
        columnStyles: { 1: { halign: 'right' } }
      })
      y = doc.lastAutoTable.finalY + 8
    }
  }

  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(`Impreso el ${new Date().toLocaleString('es-CO')}`, margen, 290)

  doc.save(`compra-${cabecera.compraId}.pdf`)
}
```

- [ ] **Step 3: Conectar el botón en `ComprasList.vue`**

En la celda de acciones, después del lápiz:

```html
                <v-btn
                  icon="mdi-printer"
                  size="small"
                  variant="text"
                  :loading="imprimiendoId === com.compraId"
                  title="Imprimir el comprobante en PDF"
                  @click="imprimir(com)"
                />
```

En `data`:

```js
      // id de la compra que se esta imprimiendo: el spinner va en el boton de ESA fila, no en
      // toda la tabla.
      imprimiendoId: null,
```

Import:

```js
import { generarPdfCompra } from '@/utils/compraPdf'
```

Y el método:

```js
    async imprimir(com) {
      this.imprimiendoId = com.compraId
      try {
        // El listado no trae las lineas ni las cuotas: hace falta el detalle completo.
        const { data } = await compraService.getById({
          idEmpresa: this.idEmpresa,
          idCompra: com.compraId
        })
        generarPdfCompra({
          cabecera: data.data,
          lineas: data.data.lineas || [],
          cuotas: data.data.cuotas || [],
          nombreEmpresa: this.authStore.empresaActual?.Nombre || ''
        })
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo generar el PDF de la compra'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.imprimiendoId = null
      }
    },
```

- [ ] **Step 4: Conectar el botón en `CompraDetalle.vue`**

En el encabezado, antes del botón *Anular compra*:

```html
      <v-btn
        v-if="compra"
        variant="tonal"
        prepend-icon="mdi-printer"
        @click="imprimir"
      >
        Imprimir
      </v-btn>
```

Imports nuevos:

```js
import { generarPdfCompra } from '@/utils/compraPdf'
import { useAuthStore } from '@/stores/auth'
```

Dos computed nuevos:

```js
    authStore() {
      return useAuthStore()
    },

    // La empresa del detalle sale de la URL y puede NO ser la seleccionada en la barra superior,
    // asi que el nombre se busca por ese Id en vez de usar empresaActual.
    nombreEmpresa() {
      const empresa = this.authStore.empresas.find((emp) => emp.Id === this.idEmpresa)
      return empresa ? empresa.Nombre : ''
    },
```

Y el método, que no pide nada porque los datos ya están cargados:

```js
    imprimir() {
      generarPdfCompra({
        cabecera: this.compra,
        lineas: this.lineas,
        cuotas: this.cuotas,
        nombreEmpresa: this.nombreEmpresa
      })
    },
```

- [ ] **Step 5: Correr el build**

Run: `npm run build`
Expected: termina sin errores. Si falla con «does not provide an export named 'jsPDF'», la versión instalada usa export por defecto: cambia a `import jsPDF from 'jspdf'`. El bundle crecerá de forma notable — es lo esperado con jsPDF.

- [ ] **Step 6: Comprobación manual — pídela al usuario y espera su respuesta**

1. En el grid, la impresora de una compra de **contado activa** descarga `compra-<id>.pdf`. Abrirlo: nombre de la empresa, «Comprobante de compra», número, fecha, documento soporte, tipo, tercero; la tabla de artículos; y los cuatro totales alineados a la derecha.
2. El spinner aparece **sólo en el botón de esa fila**, no en toda la tabla.
3. Una compra a **crédito con cuotas**: el PDF trae además número de cuotas, valor de cuota y **la tabla de cuotas**, con «Pagada»/«Pendiente» —no «CANCELADA»—.
4. Una compra del **escenario 3**: el PDF dice «Valores distintos (ver detalle)» en valor de la cuota.
5. Una compra **anulada**: el PDF lleva arriba, en rojo, **«*** COMPRA ANULADA ***»** con el motivo, **antes de cualquier cifra**. → un comprobante de una compra anulada que no lo diga acaba usándose como si valiera.
6. El mismo PDF desde el **detalle**, con el botón *Imprimir*: idéntico al del grid, y **sin** pedir datos otra vez (los tiene en memoria).
7. **Con el detalle abierto, cambiar de empresa** en la barra superior y pulsar *Imprimir*: el nombre de empresa del PDF es el de **la compra**, no el de la recién seleccionada. → por eso se busca por el `:EmpId` de la URL y no con `empresaActual`.
8. Una compra con **muchas líneas** (15 o más): la tabla salta de página sin encimarse con los totales.
9. El pie trae la fecha y hora de impresión.
10. **[REGRESIÓN tareas 2, 6 y 7]** Los filtros del grid, anular y el CRUD de cuotas siguen funcionando.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/utils/compraPdf.js src/views/Compras/ComprasList.vue src/views/Compras/CompraDetalle.vue
git commit -m "feat(compras): comprobante en PDF desde el listado y el detalle"
```

---

## Cierre: actualizar el handoff

No es una tarea de código, pero el handoff es el documento que lee quien retome el proyecto y quedaría mintiendo.

- [ ] **Step 1: Actualizar `handoff.md`**

- En la tabla de §4 «Qué está construido», **Compras** pasa de `EnConstruccion` a «List + Form de alta + Detalle con anulación y CRUD de cuotas».
- En §4, borrar la deuda **1** (el contrato de `getallcompra` que el front no tenía) y la **4** deja de aplicar a Compras: este List sí deshabilita el `textoFiltro` al ordenar por fecha.
- En §5, reemplazar «La siguiente fase: Compras» por lo que sea la siguiente de verdad, y dejar apuntado el spec y el plan de esta fase.
- En §1, la tabla de versiones gana **jspdf** y **jspdf-autotable**.
- En §2, anotar que hay un **segundo store** (`stores/catalogos.js`) y que Compras es la **primera excepción de cuatro** al patrón List + Form: su «editar» es un detalle, porque una compra no se edita.

- [ ] **Step 2: Commit**

```bash
git add handoff.md
git commit -m "docs: handoff al dia tras el modulo de compras"
```

