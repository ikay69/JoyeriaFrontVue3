# Handoff — frontend joyeriacompraventa (Vue 3)

Fecha: 2026-09-23
Documento **del front**. El backend tiene el suyo, aparte, en el worktree del repo `joyeriacompraventa` (`.claude/worktrees/nucleo-inventario/handoff.md`). Los dos proyectos son repos distintos, con remotos distintos.

Este primer documento **no cierra una fase**: es el levantamiento del proyecto tal como está hoy, escrito para que quien retome no tenga que deducir el patrón leyendo diez archivos.

---

## 0. Arranque rápido

Lo mínimo para no romper nada:

- **Todo el CRUD sigue un patrón de dos archivos: `XxxList.vue` + `XxxForm.vue`.** Está descrito entero en §2, con Categorías como referencia. **Para un módulo nuevo se copia Categorías y se cambian los nombres** (receta paso a paso en §7). No hay componente compartido de lista ni de formulario: es copia-pega deliberado.
- **Hay tres excepciones al patrón**, y son a propósito: `UsuarioForm` (segundo formulario para la contraseña), `AsignacionUsuario` (no tiene List/Form) y `UsuarioList` (el backend solo le da `pagina`). Ver §3.
- **Trabajo sin commitear ahora mismo:** el módulo **Vendedores completo está sin rastrear** (`VendedorService.js`, `VendedoresList.vue`, `VendedoresForm.vue`) y hay cambios reales en `MainLayout.vue`, `router/index.js` y `ArticulosForm.vue`. Lo primero al retomar es decidir si eso se commitea. Ver §6.
- **`git status` miente: dice 32 archivos modificados y solo 3 lo están.** Los otros 29 son ruido de fin de línea. Ver §6 antes de asustarte o de hacer `checkout --` sobre algo.
- **Las pantallas en rojo en el menú son las que faltan.** `class="bg-red text-white"` en `MainLayout.vue` marca lo pendiente; la pantalla en sí muestra el componente `EnConstruccion`. Es el semáforo del proyecto.
- **Hay 8 `console.log` olvidados y un botón que dice «Agregar 1».** Lista en §4. Limpieza de cinco minutos.
- **Lo siguiente que se construye es Compras**, y es la pantalla más compleja del proyecto: una compra **no se edita, solo se anula**, una línea puede dar de alta un artículo que no existe, y las cuotas tienen su propio CRUD. Todo el contexto en §5. **Leerlo entero antes de dibujar nada.**
- **El despliegue es manual y a propósito.** Se compila y el usuario copia `dist/` a la carpeta `Public/` del backend. Las dos carpetas no tienen relación en disco y **así se quedan**: es política de seguridad, no una tarea pendiente. No apuntes `build.outDir` al backend.

**Correr el proyecto:** `npm run dev` (Vite, puerto 5173). `npm run build` deja el resultado en `dist/`, que **no** está versionado.

---

## 1. Qué es y con qué está hecho

Frontend del sistema multiempresa de joyería y compraventa. Consume el backend Node/Express del otro repo.

| Pieza | Versión | Nota |
|---|---|---|
| Vue | 3.5 | **Options API en todo el proyecto.** No hay un solo `<script setup>`; no lo introduzcas sin decidirlo a propósito. |
| Vuetify | 3.7 | Todos los componentes y directivas se importan en bloque en `plugins/vuetify.js`. Tema claro, `primary: #6a7aef`. |
| Pinia | 2.3 | Un solo store: `stores/auth.js`. |
| vue-router | 4.5 | `createWebHistory`. Rutas en un único `router/index.js`. |
| axios | 1.7 | Una sola instancia, `services/http.js`. |
| SweetAlert2 | 11 | **Es el único canal de mensajes al usuario.** No hay snackbars ni toasts. |
| Vite | 6 | Alias `@` → `src/`, declarado en `vite.config.js` y en `jsconfig.json`. |
| jsPDF | 4.2 | Sólo lo usa `utils/compraPdf.js`. Import nombrado: `import { jsPDF } from 'jspdf'`. |
| jspdf-autotable | 5.0 | Se llama en forma funcional, `autoTable(doc, opciones)`, que funciona en las versiones 3, 4 y 5 del plugin. Arrastra `html2canvas` como dependencia transitiva, pero sale en un chunk aparte que sólo se alcanza por el `.html()` de jsPDF, que no usamos: el usuario nunca lo descarga. |

### Estructura

```
src/
  components/common/   EnConstruccion.vue          (el único componente compartido hoy)
  layouts/             MainLayout.vue              (app-bar + menú + <router-view>)
  plugins/             vuetify.js
  router/              index.js                    (todas las rutas, un solo archivo)
  services/            un archivo por recurso + http.js
  stores/              auth.js
  views/               una carpeta por módulo de negocio
  App.vue  main.js
```

### Las tres piezas de infraestructura

**`services/http.js`** — la instancia de axios. Tres cosas que importan:

1. `baseURL` sale de `VITE_API_BASE_URL` (archivo `.env`, **no versionado**). Hoy apunta a `http://localhost:3000/api`.
2. Un interceptor de request mete el token en un header **literalmente llamado `token`**. No es `Authorization`, no es `Bearer`, no es `x-token`. Es la convención del backend.
3. Un interceptor de response: ante un **`401` hace logout y redirige a `/login`**. Ojo con esto: el backend devuelve `401` **solo** cuando la petición va sin token; los errores de validación y de negocio son `400`. Si algún día el backend empezara a devolver `401` por otra cosa, este interceptor echaría al usuario de la sesión sin explicación.

**`stores/auth.js`** — token, usuario, rol, lista de empresas y `empresaSeleccionada`. Se persiste entero en `localStorage` bajo la clave `joyeria_auth`, así que la sesión sobrevive a un refresco. `setSession(data)` recibe **la respuesta cruda del login** y selecciona por defecto la primera empresa de la lista.

**`router/index.js`** — todas las rutas cuelgan de `MainLayout` salvo `/login`. Un `beforeEach` global manda a Login si no hay token, y a Inicio si ya hay token y se pide Login. **La autorización por rol no está en el router:** ver §4.

---

## 2. El patrón List + Form — leer esto antes de crear un módulo

Es el patrón que se repite en los **once** módulos de CRUD. La referencia canónica es **Categorías**:

```
src/views/Inventario/Categorias/CategoriaList.vue
src/views/Inventario/Categorias/CategoriaForm.vue
src/services/categoriaService.js
```

Y las tres rutas que los enganchan, en `router/index.js`.

### El service

Un objeto plano con cinco métodos, cada uno una llamada a `http`. Nada de lógica:

```js
import http from '@/services/http'

export default {
  getAll(payload)     { return http.post('/categoria/getallcategoria', payload) },     // { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
  create(payload)     { return http.post('/categoria/newcategoria', payload) },        // { idEmpresa, Nombre }
  getById(payload)    { return http.post('/categoria/getidcategoria', payload) },      // { idEmpresa, idCategoria }
  update(payload)     { return http.put('/categoria/updatecategoria', payload) },      // { idEmpresa, idCategoria, Nombre, Estado }
  getActivas(payload) { return http.post('/categoria/getactivascategoria', payload) }  // { idEmpresa }
}
```

**`getActivas` no lo usa el List: lo usan los Form de otros módulos** para llenar sus `v-select` (Productos necesita categorías activas, Artículos necesita productos activos, etc.). Por eso existe en casi todos los services aunque el List no lo llame nunca.

### Las tres rutas

```js
{ path: 'inventario/categorias',                      name: 'CategoriaList',   component: … },
{ path: 'inventario/categorias/nueva',                name: 'CategoriaNueva',  component: …Form },
{ path: 'inventario/categorias/:EmpId/:CatId/editar', name: 'CategoriaEditar', component: …Form, props: true }
```

**El mismo componente Form sirve para crear y para editar.** Distingue por `this.$route.name === 'CategoriaEditar'`, no por la presencia de los params.

**El `:EmpId` en la URL de edición no es decorativo.** El Form lee la empresa **de la URL** cuando edita, y del store cuando crea:

```js
idEmpresa() {
  if (this.esEdicion) return Number(this.$route.params.EmpId)
  return this.authStore.empresaSeleccionada
}
```

Así, si el usuario cambia de empresa en la barra superior mientras tiene abierta una edición, el registro se sigue guardando contra la empresa a la que pertenece y no contra la recién seleccionada.

### El List

Cuatro bloques, siempre en este orden:

1. **Encabezado** — `<h1>` con el título y botón **Agregar** a la derecha, que hace `$router.push({ name: 'XxxNueva' })`.
2. **Tarjeta de filtros** — `textoFiltro` (`v-text-field`), `campoOrdenar` (`v-select`), `orden` (`v-select` ASC/DESC) y botón **Consultar**. Los `v-select` usan siempre `item-title="texto"` / `item-value="valor"` sobre arreglos `{ valor, texto }` definidos en `data`.
3. **Tabla** — `v-table` cruda (no `v-data-table`), con tres estados en el `<tbody>`: cargando (`v-progress-circular`), vacío («No hay registros para mostrar») y filas. Última columna: botón lápiz que navega a editar pasando **empresa e id**.
4. **Paginado** — Anterior / `Página X de Y` / Siguiente, debajo de la tabla, dentro de la misma tarjeta.

El script:

```js
data() {
  return {
    cargando: false, categorias: [], cantData: 0, pagina: 1,
    filtros: { textoFiltro: '', campoOrdenar: 2, orden: 'DESC' },
    opcionesCampoOrdenar: [ { valor: 1, texto: 'Nombre' }, { valor: 2, texto: 'Fecha de creación' } ],
    opcionesOrden:        [ { valor: 'ASC', texto: 'Ascendente' }, { valor: 'DESC', texto: 'Descendente' } ]
  }
},
computed: {
  authStore()   { return useAuthStore() },
  idEmpresa()   { return this.authStore.empresaSeleccionada },
  totalPaginas(){ return Math.max(1, Math.ceil(this.cantData / 50)) }
},
created() { this.consultar() },
methods: {
  consultar()      { this.buscar(1) },          // el botón: SIEMPRE vuelve a la página 1
  irPagina(pagina) { this.buscar(pagina) },     // el paginado: conserva los filtros
  async buscar(pagina) { … }
}
```

**Las cinco reglas del listado, que son las que se rompen al copiar:**

1. **50 registros por página, y el 50 está escrito a mano en `totalPaginas`.** Es el tope del backend; no es configurable. Si alguna vez cambia, hay que tocarlo en los once List.
2. **`cantData` es el total *filtrado*, no el de la empresa.** De ahí salen las páginas. El backend garantiza que el conteo y el listado aplican los mismos filtros.
3. **`consultar()` vuelve a la página 1; `irPagina()` no.** Cambiar un filtro y quedarse en la página 7 es la forma clásica de ver una tabla vacía sin entender por qué.
4. **Se comprueba `idEmpresa` antes de llamar** y, si falta, se avisa con Swal y se corta. Sin empresa el backend responde error, pero el mensaje propio es más claro.
5. **El `textoFiltro` filtra por la MISMA columna por la que se ordena.** Es una regla del backend, no del front: al ordenar por fecha de creación el filtro de texto queda desactivado del lado del servidor. Los dos selectores (`ArticulosSeleccionar`, `TercerosSeleccionar`) sí deshabilitan la caja de texto en ese caso, con un hint explicando por qué. **Los once List no lo hacen**, así que el usuario puede escribir un texto que se ignora en silencio. Ver §4.

El manejo de error es el mismo en todas partes, y conviene no inventarse otro:

```js
catch (error) {
  const mensaje = error.response?.data?.msg || 'No se pudo consultar las categorías'
  Swal.fire('Error', mensaje, 'error')
} finally {
  this.cargando = false
}
```

**El backend siempre manda `{ msg }` en los errores.** El texto de respaldo es para cuando la petición ni siquiera llegó.

### El Form

Una `v-card` con un `v-form` y un `ref="form"`. Las piezas:

- **Título dinámico:** `{{ esEdicion ? 'Editar categoría' : 'Nueva categoría' }}`.
- **Campos** con `maxlength` + `counter` puestos al mismo número **que el backend valida**. El `maxlength` es comodidad; la validación de verdad está en el servidor.
- **El `v-select` de Estado solo aparece en edición** (`v-if="esEdicion"`): al crear, el backend pone activo por defecto y no acepta el campo.
- **Bloque informativo solo en edición:** «Creado por» y «Fecha creación», en `text-caption`. Es de lectura, no se edita nunca.
- **Botonera abajo a la derecha:** Cancelar (`$router.back()`) y Confirmar (`type="submit"`, con `:loading="guardando"`).

El flujo:

```js
created() { if (this.esEdicion) this.cargarCategoria() },

async confirmar() {
  const { valid } = await this.$refs.form.validate()   // Vuetify 3: devuelve { valid }, es async
  if (!valid) return
  …
  if (this.esEdicion) { await service.update({ … }) } else { await service.create({ … }) }
  await Swal.fire('Éxito', data.msg || 'Categoría creada', 'success')
  this.$router.back()                                  // vuelve al List, que recarga en su created()
}
```

**Tres detalles que se copian mal:**

- **`$refs.form.validate()` es asíncrono y devuelve `{ valid }`.** No un booleano. Es Vuetify 3.
- **El `await` del Swal de éxito es intencional:** primero se ve el mensaje, después se navega.
- **Al volver con `$router.back()` el List se reconstruye y su `created()` dispara `consultar()`**, así que la tabla ya sale actualizada. Por eso ningún Form recarga nada a mano.

### Los alias del backend: la trampa número uno

**Los modelos del backend devuelven columnas con alias, distintos en cada módulo.** No son `Id`, `Nombre`, `Estado`:

| Módulo | Prefijo | Ejemplos |
|---|---|---|
| Categorías | `cat` | `catId`, `catNombre`, `catEstado`, `catFecCreacion`, `catcUsuario`, `catEmp` |
| Vendedores | `vdr` | `vdrId`, `vdrNombre`, `vdrEstado`, `vdrFecCreacion`, `vdrUsuario`, `vdrEmp` |
| Artículos | `art` | `artId`, `artNombre`, `artSKU`, `artPropiedades`, `artUnidadMedida` |

El prefijo de Vendedores es **`vdr` y no `ven`** porque `ven` ya lo usa Ventas en el backend. Y ojo: en Categorías el usuario creador es **`catcUsuario`** —con esa `c` de más—, mientras que en Vendedores es `vdrUsuario`. No son deducibles: **abrir el endpoint y mirar la respuesta antes de escribir la tabla.** El `docs/endpoints.md` del repo del backend los lista todos.

También hay que saber que **`Estado` llega como `1`/`0`, no como booleano.** De ahí el `=== 1` de las tablas y el `data.data.catEstado === 1` con el que el Form lo convierte a `true`/`false` para su `v-select`.

---

## 3. Las excepciones al patrón — y por qué existen

### `UsuarioForm.vue` — dos formularios en una pantalla

Es la excepción **de seguridad**, y la pidió el usuario explícitamente. La contraseña **no se edita junto con los demás datos**: va en una **segunda `v-card` aparte**, con su propio `ref="passForm"`, su propio submit y su propio estado de carga. Pide **contraseña actual y contraseña nueva**, y llama a un endpoint distinto (`changepassuser`).

Mezclar la contraseña con el resto del formulario permitiría cambiarla sin conocer la actual, que es justamente lo que se quiso evitar.

Además, en este Form:

- El campo Contraseña del alta (`v-if="!esEdicion"`) **desaparece en edición**: al editar, la contraseña solo se cambia por la tarjeta de abajo.
- Tras cambiar la contraseña se limpian los dos campos y se llama a `resetValidation()`, para no dejar las contraseñas escritas en pantalla.
- Muestra una tabla de solo lectura con las **empresas asignadas** al usuario.
- **La respuesta de `getById` viene anidada: `data.data.usuarioId` es el usuario y `data.data.empresas` la lista.** El nombre `usuarioId` para un objeto completo es confuso, pero es el contrato.

### `AsignacionUsuario.vue` — sin List ni Form

No es un CRUD: es una pantalla única con un `v-select` de usuarios que **no** pertenecen a la empresa actual, un botón Confirmar, y debajo una tabla de los que **sí** pertenecen. No tiene paginado, ni filtros, ni edición: solo se asigna.

Detalle que se repite al copiar mal: **tras asignar hay que recargar las dos cosas**, la tabla y el combo, porque el usuario asignado tiene que desaparecer de la lista de disponibles.

### `UsuarioList.vue` — un listado sin filtros

El endpoint `getuserall` del backend **solo acepta `{ pagina }`**: no tiene `campoOrdenar`, ni `orden`, ni `textoFiltro`, ni `idEmpresa`. Los usuarios son globales, no por empresa. Por eso el List no tiene tarjeta de filtros. **No es un olvido:** el día que el backend gane esos filtros, esta pantalla se alinea con el patrón.

### Los selectores en diálogo — un cuarto patrón

`ArticulosSeleccionar.vue` y `TercerosSeleccionar.vue` no son pantallas: son **componentes de diálogo** que otras vistas abren para elegir un registro. Los usan Ventas, Kardex y Existencia artículo.

Contrato, idéntico en los dos:

```vue
<ArticulosSeleccionar
  v-model="mostrarSelectorArticulo"     <!-- prop modelValue + emit update:modelValue -->
  :id-empresa="idEmpresa"               <!-- obligatorio: quien lo abre SIEMPRE pasa la empresa -->
  @seleccionar="onArticuloSeleccionado" <!-- emite el registro completo -->
/>
```

Por dentro repiten los filtros y el paginado del List, dentro de un `v-dialog`. Viven en la carpeta del módulo al que pertenecen (`views/Inventario/Articulos/`), no en `components/`, aunque los consuma otro módulo.

---

## 4. Estado actual y deuda

### Qué está construido

| Módulo | Estado |
|---|---|
| Login, layout, menú, store de sesión | Completo |
| Bodegas · Categorías · Unidades de medida · Propiedades · Tipos de producto · Productos · Artículos | List + Form completos |
| Terceros | List + Form + selector en diálogo |
| Tipos de documento | List + Form |
| Usuarios | List + Form (con cambio de contraseña) |
| Asignación de usuario | Completo |
| Vendedores | List + Form completos — **pero sin commitear**, ver §6 |
| Informes: Existencias · Kardex · Existencia artículo | Completos |
| Movimientos de inventario | `EnConstruccion` |
| **Ventas** | Pantalla a medias: tiene los dos selectores funcionando, pero no registra nada |
| **Compras** | **Completo**: List con filtros completos + Form de alta (contado y crédito) + Detalle con anulación y CRUD de cuotas + PDF del comprobante. Ver §5 |
| **Préstamos · Empeños · Abonos · Gastos · Contabilidad · Empresas** | `EnConstruccion` |

Las pendientes están marcadas **en rojo en el menú** (`class="bg-red text-white"` en `MainLayout.vue`). Mantener ese semáforo al día: es lo primero que se mira.

### Deuda y cosas a arreglar

1. ~~El listado de Compras del backend cambió de contrato y el front no tiene pantalla.~~ **Resuelto el 2026-09-26**: `ComprasList.vue` nace con los filtros completos (`campoOrdenar` 1..5 obligatorio, `orden`, `textoFiltro`, `idTercero`, `fechaInicio`/`fechaFin`) y es el único List del proyecto que **sí deshabilita la caja de texto al ordenar por fecha** — o sea, nace sin la deuda 4 de más abajo. Los otros once List la siguen arrastrando: copiar de ahí la solución.
2. **Ocho `console.log` olvidados.** `AsignacionUsuario:130`, `TiposDocumentoList:158`, `UsuarioList:98`, `CategoriaForm:125`, `UnidadesMedidaForm:166` y `:176`, `VendedoresList:176` (`'linea 176'`), `Ventas.vue:98`.
3. **`VendedoresList.vue` tiene el botón «Agregar 1»** — un `1` de prueba que llegó a quedarse. Y `CategoriaList.vue` arrastra un comentario `//prueba`.
4. **El `textoFiltro` no se deshabilita al ordenar por fecha en los once List.** El backend lo ignora en ese caso, así que el usuario escribe un filtro que no tiene efecto y nadie le dice nada. Los dos selectores ya lo resuelven bien, con `:disabled` y un `hint`: **copiar esa solución a los List**.
5. **La autorización por rol está en tres pantallas sueltas y no en el router.** `AsignacionUsuario`, `TiposDocumentoList` y `UsuarioList` tienen un método `checkToken()` que redirige si el rol no es `ADMINISTRADOR`. Las demás no comprueban nada. Lo correcto es un `meta: { roles: [...] }` en las rutas y una sola comprobación en el `beforeEach`; lo de hoy es fácil de olvidar en la pantalla siguiente. **La seguridad real la impone el backend** —el front solo esconde—, pero la inconsistencia confunde.
6. **Nombres de archivo de services inconsistentes:** `VendedorService.js` y `Usuarioempresaservice.js` rompen el `camelCase` de los otros catorce (`categoriaService.js`). En Windows no molesta; en el build de Linux un import con la caja equivocada **falla**.
7. **`EnConstruccion` se importa suelto en cada vista pendiente**, con diez archivos idénticos de doce líneas. Se podría resolver con una sola ruta comodín, pero tal como está es explícito y no estorba.
8. **No hay pruebas ni linter.** `package.json` solo tiene `dev`, `build` y `preview`.
9. **`.env` no está versionado** (y `.env.example` tampoco: está en `.gitignore`). Quien clone el repo **no tiene de dónde copiar la variable**. `VITE_API_BASE_URL` es la única que hace falta.

### Decisiones tomadas, no las revuelvas

- **El despliegue es manual y las dos carpetas se quedan sin relación en disco. Es política, no pendiente.** El backend sirve el front desde su carpeta `Public/`, pero el puente lo hace el usuario a mano: compila y copia. **No apuntes `build.outDir` a la carpeta del backend**, aunque el comentario de `vite.config.js` lo sugiera y aunque técnicamente funcione: la separación es deliberada, por seguridad. Ese comentario del `vite.config.js` quedó desactualizado y conviene corregirlo.
- **`dist/` está en `.gitignore`** y seguirá estándolo: el artefacto de build no se versiona.
- **`v-table` cruda en vez de `v-data-table`.** Se paginan 50 registros del servidor, así que el ordenamiento y el filtrado en cliente de `v-data-table` sobrarían y podrían inducir a error (ordenaría solo la página visible). La decisión es correcta; conviene dejarla dicha para que nadie la «mejore».

---

## 5. Compras — construido el 2026-09-26

**Está terminado y sin mergear**, en la rama `feature/compras-frontend` (11 commits + 1 de arreglos finales). El diseño y el plan de implementación viven en el repo:

- `docs/superpowers/specs/2026-09-26-frontend-compras-design.md`
- `docs/superpowers/plans/2026-09-26-frontend-compras.md`

**Lo que falta antes de mergear: nadie ha pasado la comprobación manual en el navegador.** Ningún paso del proceso pudo abrirlo. La lista de verificación está en §13 del spec.

### Lo que se construyó

| Archivo | Qué es |
|---|---|
| `src/services/compraService.js` | los siete endpoints |
| `src/views/Compras/ComprasList.vue` | grid con filtros completos, lápiz al detalle e impresora |
| `src/views/Compras/CompraForm.vue` | **sólo alta** (~890 líneas, el archivo más grande del proyecto) |
| `src/views/Compras/CompraDetalle.vue` | detalle de lectura, anulación y CRUD de cuotas |
| `src/views/Compras/ArticuloNuevoDialog.vue` | alta de artículo embebida en una línea |
| `src/stores/catalogos.js` | **segundo store del proyecto**: caché de bodegas y propiedades por empresa |
| `src/utils/compraPdf.js` | comprobante en PDF (jsPDF + jspdf-autotable) |

### Las tres cosas que hay que saber antes de tocarlo

1. **Compras es la cuarta excepción al patrón List + Form**, y es deliberada: una compra **no se edita nunca**, así que el «editar» del patrón es aquí una pantalla de **detalle** desde la que se anula. No hay endpoint de edición y no es un olvido.
2. **`idEmpresa` se lee de la URL en el detalle, no del store.** El selector de empresa vive en un `v-app-bar` persistente que no navega, así que las pantallas no se remontan al cambiarlo: `CompraForm` y `ComprasList` llevan un `watch` sobre `idEmpresa` por esa misma razón. Quitarlos reabre escrituras contra la empresa equivocada.
3. **Vocabulario cruzado:** `cuoEstado = 'CANCELADA'` significa **pagada**; `compraEstado = 0` significa **anulada**. El front traduce a «Pagada»/«Pendiente» en pantalla y en el PDF, pero al backend siguen viajando `PENDIENTE`/`CANCELADA`.

### Alcance que se pidió en su momento

### Alcance pedido

1. **Listar** compras, con los filtros completos.
2. **Agregar** una compra.
3. **Editar las cuotas** de una compra a crédito.
4. **Anular**: el estado y el motivo.

### La regla que define toda la pantalla

**Una compra NO se edita. Nunca.** El backend no tiene endpoint de edición y no es un olvido: una compra ya movió existencias y ya recalculó el costo promedio de una o varias bolsas, así que reescribirla exigiría revertir y reaplicar ese costeo. La única operación correctiva es **anular**.

De ahí salen tres consecuencias para el diseño de la pantalla, y conviene tenerlas claras **antes** de dibujarla:

- **No hay `CompraForm` en modo edición.** El Form es solo de alta. El «editar» del patrón habitual, aquí, es una pantalla de **detalle** (cabecera + líneas + cuotas) desde la que se anula y se gestionan las cuotas.
- **Anular no revierte inventario ni caja.** Solo marca la compra, guarda el motivo, quién anuló y cuándo. El ajuste de existencias es manual, por el módulo de Ajustes. **Esto hay que decírselo al usuario en el diálogo de confirmación**, o va a suponer que el inventario se corrige solo.
- **Marcar una cuota como `CANCELADA` (= pagada) no mueve caja ni recalcula el saldo de la cabecera.** Es un registro informativo que transcribe el usuario. El movimiento de caja llegará con el módulo de Abonos.

### Los endpoints, tal como están hoy

Base `/api/compra`. Contratos completos y ejemplos en `docs/endpoints.md` del repo del backend — **léelos ahí, no de memoria**.

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/getallcompra` | listado paginado |
| POST | `/getidcompra` | cabecera + `lineas` + `cuotas` |
| POST | `/newcompra` | alta (contado o crédito) |
| PUT | `/anularcompra` | anular, con motivo |
| POST | `/newcompracuota` | agregar una cuota |
| PUT | `/updatecompracuota` | editar una cuota |
| DELETE | `/deletecompracuota` | borrar una cuota |

**`getallcompra` estrenó filtros el 2026-09-23 y es el listado más completo del backend:**

```json
{ "idEmpresa": 1, "campoOrdenar": 4, "orden": "ASC", "pagina": 1,
  "textoFiltro": "MARCELA", "idTercero": 0 }
```

| `campoOrdenar` | Columna |
|---|---|
| `1` | `NumeroDocumentoSoporte` |
| `2` | `TerceroTipoDoc` |
| `3` | `TerceroNumeroDoc` |
| `4` | `TerceroNombre` |
| `5` | `FechaCreacion` |

- **`campoOrdenar` es obligatorio**: sin él la ruta responde `400`. No hay valor por defecto que valga.
- **`textoFiltro` se ignora con `campoOrdenar: 5`** (la fecha no es texto). **Esta es la pantalla donde por fin hay que deshabilitar la caja de texto en ese caso** — copiar el `:disabled` + `hint` de `ArticulosSeleccionar`, y así este List nace sin la deuda número 4 de §4.
- **`idTercero`**: ausente o `0` trae todas; un id positivo filtra por ese tercero. **`null` y los negativos dan `400`.** Encaja de fábrica con `TercerosSeleccionar`.

Alias de la respuesta del listado: `compraId`, `compraFecha`, `compraTerceroId`, `compraTerceroTipoDoc`, `compraTerceroNumeroDoc`, `compraTercero` (el nombre), `compraDocumentoSoporte`, `compraTipoCompra`, `compraFechaCompromiso`, `compraNumeroCuotas`, `compraSubtotal`, `compraDescuento`, `compraCancelado`, `compraSaldo`, `compraEstado`. **`compraEstado` es `1` activa / `0` anulada** — no es «pagada/pendiente».

### Lo que hace a Compras distinta de todo lo construido hasta ahora

Es, con diferencia, la pantalla más compleja del proyecto. Cuatro cosas que no aparecen en ningún módulo actual:

1. **Una línea de compra puede dar de alta un artículo que todavía no existe** — la joya usada comprada a un particular. Cada línea trae **`idArticulo` o `ArticuloNuevo`, nunca ambos y nunca ninguno**; `ArticuloNuevo` lleva `idProducto`, nombre, descripción y propiedades. Es el formulario de alta de artículo **embebido dentro de una línea de la compra**.
2. **Dos modalidades: `CONTADO` y `CREDITO`** (son dos, no tres — `POR_ABONO` salió del dominio). El contado exige que el pago cubra todo; el crédito exige saldo mayor que cero y el pago inicial es opcional.
3. **El sistema NO calcula las cuotas.** El proveedor las calcula con su propio interés, por fuera, y el usuario las transcribe. **`NumeroCuotas × ValorCuota` no cuadra con `ValorSaldo` y eso es correcto** — el backend tiene una prueba cuyo propósito es fijar que esa validación *no existe*. **No la agregues en el front tampoco**, ni como aviso: con interés, las cuotas *tienen* que sumar más.
4. **Vocabulario cruzado, muy fácil de equivocar:** `cuoEstado = 'CANCELADA'` significa **pagada**; `compraEstado = 0` significa **anulada**. Son conceptos opuestos con nombres parecidos.

### Piezas que ya existen y hay que reutilizar

- **`TercerosSeleccionar`** y **`ArticulosSeleccionar`** — diálogos ya hechos, con el contrato de §3. Los usa Ventas; Compras los necesita igual (el tercero de la cabecera, el artículo de cada línea).
- **`bodegaService.getActivas`** para la bodega de cada línea, **`productoService.getActivas`** y **`propiedadService.getActivas`** para el artículo nuevo.
- El patrón List + Form de §2 para la parte de listado y alta.

### Antes de escribir la primera línea

- Abrir `docs/endpoints.md` del backend, sección **Compras**, y la colección **`docs/compras.postman_collection.json`** (46 peticiones, todas verificadas contra el servidor real).
- **Probar los endpoints en Postman primero** y mirar los alias reales de la respuesta, sobre todo los de `lineas` (`detArticuloId`, `detArticuloNombre`, `detBodegaId`, `detBodegaNombre`, `detCantidad`, `detCostoUnidad`) y los de `cuotas` (`cuoId`, `cuoNumCuota`, `cuoValorCuota`, `cuoFechaPago`, `cuoEstado`). Es el error que más se ha repetido en este proyecto, en los dos repos.
- **Ojo con un dato desactualizado en la doc del backend:** en la sección de `newcompra` queda una frase que dice «`TipoCompra` acepta los tres valores; solo `CONTADO` se procesa». **Es falsa desde el 2026-09-21**: hay dos modalidades y el crédito sí se procesa. La sección «Compra a `CREDITO`», más abajo en el mismo documento, es la correcta.

---

## 6. Git — leer antes de commitear

**Repo:** `https://github.com/ikay69/JoyeriaFrontVue3.git`. Rama de trabajo `master`; existe además `carlos-cambios`, desde la que han entrado varios PR.

**Es un repo distinto del backend.** No comparten historia ni remoto, y el handoff del backend no aplica aquí salvo en el capítulo de fines de línea, que sí.

### El working tree ahora mismo

`git status` muestra **35 entradas, pero solo 3 tienen cambios reales**:

| | |
|---|---|
| **Cambios reales** | `src/layouts/MainLayout.vue`, `src/router/index.js`, `src/views/Inventario/Articulos/ArticulosForm.vue` (59 inserciones, 4 borrados) |
| **Sin rastrear** | `src/services/VendedorService.js`, `src/views/Ventas/VendedoresList.vue`, `src/views/Ventas/VendedoresForm.vue` |
| **Ruido** | Las otras 29 |

Los cambios reales y los archivos sin rastrear **son todos la misma cosa**: el módulo de Vendedores (su service, sus dos vistas, sus tres rutas, y el menú reorganizado para colgar Ventas y Compras como grupos desplegables). **Es una unidad, y va en un solo commit.**

### Los 29 archivos «modificados» que no cambiaron

`core.autocrlf` está en `true`: git guarda LF en el repo y expande a CRLF en el disco. Cuando un archivo se guarda con un editor que escribe CRLF, git lo marca como modificado aunque el contenido sea idéntico.

Para ver qué cambió **de verdad**:

```bash
git diff --stat            # los archivos con diferencias reales aparecen con su conteo
git diff --ignore-all-space --stat
```

**No hagas `git checkout --` masivo para «limpiar»:** entre esos 29 no hay nada que perder hoy, pero el día que sí lo haya te llevas por delante trabajo real. Y **no** commitees los 32 de golpe: el diff quedaría ilegible y el próximo que lea el historial no sabrá qué se tocó.

---

## 7. Cómo agregar un módulo nuevo — receta

Suponiendo que el endpoint del backend ya existe:

1. **Mirar la respuesta real del endpoint** (Postman o `docs/endpoints.md` del backend) y **anotar los alias**. No adivinarlos.
2. **`src/services/xxxService.js`** — copiar `categoriaService.js`, cambiar rutas y comentar el payload de cada método en la misma línea.
3. **`src/views/<Modulo>/XxxList.vue`** — copiar `CategoriaList.vue`. Cambiar título, `opcionesCampoOrdenar` (los valores los define el backend), columnas de la tabla, los alias y los nombres de ruta.
4. **`src/views/<Modulo>/XxxForm.vue`** — copiar `CategoriaForm.vue`. Campos con `maxlength`/`counter` **iguales a los que valida el backend**; Estado solo en edición.
5. **Tres rutas en `router/index.js`**, con el bloque de comentario del módulo. La de edición lleva `:EmpId/:XxxId` y `props: true`.
6. **Una entrada en `MainLayout.vue`**, y si la pantalla queda a medias, con `class="bg-red text-white"`.
7. **Probar:** crear, editar, cambiar de página, filtrar por texto, ordenar por los dos sentidos, y **cambiar de empresa en la barra superior teniendo un registro abierto en edición** — ahí es donde se nota si `idEmpresa` se resolvió bien.

### Errores que ya se han cometido, para no repetirlos

- **Adivinar los alias de la respuesta.** `catcUsuario` no es `catUsuario`, `vdrEmp` no es `vdrEmpresa`. Mirar primero, escribir después. En el backend este mismo error se ha repetido en tres fases distintas.
- **Tratar `Estado` como booleano.** Llega `1`/`0`.
- **Leer `empresaSeleccionada` del store al editar.** Hay que leer `$route.params.EmpId`, o el registro se guarda contra la empresa equivocada si el usuario cambió el selector.
- **Dejar `consultar()` paginando donde estaba.** Al cambiar un filtro se vuelve a la página 1.
- **Usar `$refs.form.validate()` como si devolviera un booleano.** Es `async` y devuelve `{ valid }`.
- **Olvidar que el backend limita a 50 por página.** El `50` de `totalPaginas` no es arbitrario.
