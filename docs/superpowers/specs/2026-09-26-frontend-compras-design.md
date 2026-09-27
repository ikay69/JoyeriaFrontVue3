# Diseño — Frontend del módulo de Compras (Vue 3)

Fecha: 2026-09-26
Repo: `JoyeriaFrontVue3` (el front; el backend vive en `joyeriacompraventa`, repo distinto).
Estado previo: el módulo es hoy un `EnConstruccion` en `src/views/Compras/Compras.vue`.

Documento de diseño previo a la implementación. El backend ya está terminado y probado: aquí no se
pide ni se propone ningún cambio del lado del servidor.

---

## 0. Qué se entrega

Cuatro pantallas y tres piezas de soporte:

1. **Listado** de compras con los filtros completos, botón de detalle y botón de PDF por fila.
2. **Alta** de una compra, de contado o a crédito, con líneas que pueden dar de alta un artículo.
3. **Detalle** de solo lectura, desde el que se **anula** la compra.
4. **CRUD de cuotas** dentro del detalle, para compras a crédito activas.

Soporte: el service, un store de caché de catálogos y el generador de PDF.

## 1. La regla que define toda la pantalla

**Una compra no se edita. Nunca.** El backend no tiene endpoint de edición y no es un olvido: una
compra ya movió existencias y ya recalculó el costo promedio ponderado de una o varias bolsas, así
que reescribirla exigiría revertir y reaplicar ese costeo. La única operación correctiva es
**anular**.

De ahí salen las tres decisiones estructurales de este diseño:

- **`CompraForm` es sólo de alta.** No tiene modo edición, no lee `:ComId`, no llama a `getidcompra`.
  Es la primera ruptura del patrón List + Form del handoff §2, y es deliberada.
- **El botón del lápiz del grid abre un detalle**, no un formulario. Es donde se anula y donde se
  gestionan las cuotas: lo único que el backend permite corregir después del alta.
- **Anular no revierte inventario ni caja.** Sólo marca la compra y guarda el motivo, quién anuló y
  cuándo. El ajuste de existencias es manual, por el módulo de Ajustes. **Esto se le dice al usuario
  en el diálogo de confirmación**, o va a suponer que el inventario se corrige solo.

## 2. Archivos

### Nuevos

| Archivo | Qué es |
|---|---|
| `src/services/compraService.js` | siete métodos, uno por endpoint, payload comentado en la línea |
| `src/views/Compras/ComprasList.vue` | grid con filtros completos, lápiz e impresora |
| `src/views/Compras/CompraForm.vue` | **sólo alta** |
| `src/views/Compras/CompraDetalle.vue` | cabecera + líneas + cuotas; anular; CRUD de cuotas |
| `src/views/Compras/ArticuloNuevoDialog.vue` | la ventana flotante de `ArticuloNuevo` |
| `src/stores/catalogos.js` | caché de bodegas y propiedades por empresa |
| `src/utils/compraPdf.js` | arma el comprobante; lo usan el grid y el detalle |

`ArticuloNuevoDialog` sale a su propio archivo desde el principio: tiene su propio selector de
producto, su propia tabla de propiedades y su propia validación, y no comparte nada con el resto del
formulario. `CompraForm` ya va a ser el archivo más grande del proyecto; no hace falta sumarle eso.

### Modificados

- `src/router/index.js` — tres rutas nuevas en lugar de la actual (ver §11).
- `src/layouts/MainLayout.vue` — quitar `class="bg-red text-white"` de la entrada de Compras y
  actualizar su `:to`.
- `src/views/Compras/Compras.vue` — se elimina; era el `EnConstruccion`.
- `package.json` — `npm i jspdf jspdf-autotable`.

### Convenciones que no se rompen

Options API en todo (no hay un solo `<script setup>` en el proyecto), `v-table` cruda en vez de
`v-data-table`, SweetAlert2 como único canal de mensajes, y 50 registros por página escritos a mano
en `totalPaginas`. Son decisiones tomadas del handoff §4; este módulo no las revisa.

## 3. `compraService.js`

Objeto plano, sin lógica, con el payload comentado al lado de cada método — igual que
`categoriaService.js`:

```js
getAll(payload)        // POST   /compra/getallcompra
getById(payload)       // POST   /compra/getidcompra
create(payload)        // POST   /compra/newcompra
anular(payload)        // PUT    /compra/anularcompra
createCuota(payload)   // POST   /compra/newcompracuota
updateCuota(payload)   // PUT    /compra/updatecompracuota
deleteCuota(payload)   // DELETE /compra/deletecompracuota
```

`deleteCuota` lee del **cuerpo** de la petición, no de la query: `http.delete(url, { data: payload })`.
Es la firma de axios para un DELETE con body, y es fácil de escribir mal porque `http.delete` no
acepta el cuerpo como segundo argumento. Es el único `DELETE` del proyecto.

## 4. `ComprasList.vue`

Los cuatro bloques del patrón, en el orden del handoff §2: encabezado con botón Agregar, tarjeta de
filtros, tabla, paginado dentro de la misma tarjeta.

### Filtros

`textoFiltro` (`maxlength 100`), `campoOrdenar`, `orden`, tercero y rango de fechas.

| `campoOrdenar` | Columna |
|---|---|
| `1` | `NumeroDocumentoSoporte` |
| `2` | `TerceroTipoDoc` |
| `3` | `TerceroNumeroDoc` |
| `4` | `TerceroNombre` |
| `5` | `FechaCreacion` |

Tres reglas del backend que el grid tiene que respetar, y las tres son 400 si se ignoran:

- **`campoOrdenar` es obligatorio.** Sin él la ruta responde `400 Campo de orden invalido`; no hay
  valor por defecto del lado del servidor. El grid arranca en `5` con `orden: 'DESC'`: lo último
  comprado primero, que es lo que se quiere ver al abrir la pantalla.
- **`textoFiltro` se ignora con `campoOrdenar: 5`** — la fecha no es texto. La caja va con
  `:disabled` y un `hint` que lo explica, copiando el patrón que ya usan `ArticulosSeleccionar` y
  `TercerosSeleccionar`. **Con esto este List nace sin la deuda §4.4 del handoff**, que es
  exactamente lo que ese documento pide para esta pantalla.
- **`idTercero`: ausente o `0` trae todas**, un id positivo filtra por ese tercero, y `null` o un
  negativo responden `400 Tercero invalido`. Sin tercero elegido se manda `0`, **nunca `null`**. No
  existe el caso `-1` («sin tercero») de Ventas: `Compras.TerceroId` es `NOT NULL`.

El tercero se elige con `TercerosSeleccionar` (botón + campo readonly con el nombre) y se limpia con
una X que vuelve el filtro a `0`.

`fechaInicio` y `fechaFin` son **opcionales e independientes**: se puede mandar sólo una. Ambas
inclusivas, y una fecha sin hora cubre el día completo, así que la misma fecha en las dos trae ese
día entero. Vacío o `null` es «sin cota por ese lado». A diferencia de `textoFiltro`, el rango **no**
se desactiva con `campoOrdenar: 5`: siempre va sobre `FechaCreacion`.

`consultar()` vuelve a la página 1; `irPagina()` conserva los filtros. Cambiar un filtro y quedarse
en la página 7 es la forma clásica de ver una tabla vacía sin entender por qué.

### Tabla

Alias de la respuesta, **tal como los devuelve el backend** (no se adivinan: es el error que más se
ha repetido en los dos repos):

`compraId`, `compraFecha`, `compraTerceroId`, `compraTerceroTipoDoc`, `compraTerceroNumeroDoc`,
`compraTercero` (el nombre), `compraDocumentoSoporte`, `compraTipoCompra`, `compraFechaCompromiso`,
`compraNumeroCuotas`, `compraSubtotal`, `compraDescuento`, `compraCancelado`, `compraSaldo`,
`compraEstado`.

Columnas: Fecha · Documento · Tercero (tipo + número + nombre) · Tipo · Subtotal · Descuento ·
Cancelado · Saldo · Estado · Acciones.

**`compraEstado` es `1` activa / `0` anulada.** No es «pagada/pendiente». Chip verde *Activa*, chip
rojo *Anulada*. Confundir esto con el estado de las cuotas es el error que el handoff §5 marca como
el más fácil de cometer en este módulo; ver §8.

Tres estados en el `<tbody>`: cargando (`v-progress-circular`), vacío («No hay registros para
mostrar») y filas. La tabla va dentro de un `div` con `overflow-x: auto` — son diez columnas.

Acciones por fila: `mdi-pencil` navega al detalle pasando **empresa e id**; `mdi-printer` genera el
PDF (§9) con un spinner **en el botón de esa fila**, no en toda la tabla.

## 5. `CompraForm.vue` — alta

Una `v-card` con `v-form` y `ref="form"`. Título fijo, «Nueva compra»: no hay modo edición.

`idEmpresa` sale de `authStore.empresaSeleccionada`. Aquí no hay la bifurcación de
`$route.params.EmpId` de los otros Form, porque no hay edición que proteger.

### 5.1 Tercero

Va primero, y sigue el patrón de `ArticulosForm` con producto: botón `mdi-arrow-right` que abre el
diálogo, más un campo readonly con el nombre del tercero elegido.

El diálogo es **`TercerosSeleccionar`**, el componente que ya existe, con su contrato de tres piezas:

```vue
<TercerosSeleccionar v-model="dialogTercero" :id-empresa="idEmpresa" @seleccionar="onTercero" />
```

Emite `{ Id, identificacion, Nombre, Celular }`. Con esos datos se llenan dos campos readonly más
—identificación y celular— junto al nombre: el selector ya los trae, y mostrarlos es lo que permite
ver que el tercero es el correcto antes de guardar.

Debajo, **Documento soporte**: opcional, `maxlength 50` con `counter`. Es la factura del proveedor o
el número del formato físico.

### 5.2 Tipo de compra

`v-radio-group` horizontal con dos opciones: **CONTADO** y **CREDITO**. Son dos, no tres:
`POR_ABONO` salió del dominio de Compras. (Ventas sí conserva tres modalidades, con sólo `CONTADO`
procesado — de ahí venía una confusión que la doc del backend ya corrigió. No son el mismo
contrato.)

Con CONTADO, todo lo de crédito —fecha de compromiso, número de cuotas, valor de cuota y la tabla de
cuotas— queda oculto.

### 5.3 Dinero

En el orden pedido: Subtotal, Descuento, Efectivo, Transferencia, Saldo.

- **Subtotal** es readonly: la suma de `Cantidad × CostoUnidad` de las líneas. El backend lo
  recalcula siempre y **no confía en un subtotal enviado por el cliente**; aquí es indicador, no
  dato de envío.
- **Descuento, Efectivo, Transferencia** son editables, `type="number"`, mínimo 0.
- **Saldo** es readonly: `subtotal − descuento − efectivo − transferencia`.

Cada cambio en los tres editables, y cada cambio en la tabla de artículos, recalcula subtotal y
saldo. Son `computed`, no datos: no hay estado que pueda quedar desincronizado.

### 5.4 Validación por modalidad

Espejo de la del backend, para que un error evitable no gaste un viaje:

| Modalidad | Regla | Mensaje |
|---|---|---|
| CONTADO | `efectivo + transferencia > 0` | «Debe registrar algún valor cancelado (efectivo o transacción)» |
| CONTADO | `abs(saldo) <= 0.01` | «El valor cancelado debe cubrir exactamente el total de la compra de contado» |
| CREDITO | `saldo > 0.01` | «Una compra a crédito debe quedar con saldo pendiente; use CONTADO» |
| CREDITO | `NumeroCuotas` entero `>= 1` | «El número de cuotas debe ser un entero mayor o igual a 1» |
| CREDITO | `NumeroCuotas === 1` exige `FechaCompromiso` | «La fecha de pago es obligatoria cuando hay una sola cuota» |
| CREDITO | `ValorCuota` obligatorio **si no se envía `Cuotas`** | «El valor de la cuota es obligatorio cuando no se detallan las cuotas» |
| ambas | al menos una línea, máximo 200 | «Debe registrar al menos un artículo» / «La compra no puede tener más de 200 líneas» |
| ambas | `Cantidad > 0` y `CostoUnidad > 0` en cada línea | «Cantidad inválida» / «CostoUnidad inválido» |
| ambas | `descuento <= subtotal` | «El descuento no puede superar el subtotal» |

La tolerancia de un centavo del contado es la misma que usa el backend: si el saldo cabe dentro del
ruido de redondeo, la compra quedó pagada.

**Lo que deliberadamente NO se valida: que `NumeroCuotas × ValorCuota` se parezca al saldo.** El
proveedor calcula las cuotas con su propio interés, por fuera del sistema, y el usuario las
transcribe. Con interés, las cuotas *tienen* que sumar más que el saldo. El backend tiene una prueba
cuyo único propósito es fijar que esa validación no existe. **No se agrega en el front tampoco, ni
como aviso.** Es exactamente el tipo de «validación obvia» que alguien agregaría de buena fe en seis
meses y rompería el módulo.

### 5.5 Crédito

Sólo visible con `TipoCompra === 'CREDITO'`. Una `v-row` de tres columnas:

| Campo | Comportamiento |
|---|---|
| Fecha de compromiso | obligatoria con `NumeroCuotas === 1`; **deshabilitada con hint** si es > 1 |
| Número de cuotas | entero >= 1; al cambiar, redimensiona la tabla de cuotas |
| Valor de cuota | el «valor común»; siembra la tabla; se vacía si se edita una fila |

**La fecha de compromiso deshabilitada.** El backend la descarta cuando `NumeroCuotas > 1`: con
varias cuotas las fechas son de las cuotas y viven en `CompraCuotas`, y la cabecera guarda `NULL`.
Dejarla editable dejaría al usuario escribiendo una fecha que nunca se guarda y sin enterarse. Se
deshabilita con el hint «Con más de una cuota las fechas se registran en la tabla» — el mismo patrón
`:disabled` + `hint` de los dos selectores.

**La tabla de cuotas** aparece con `NumeroCuotas > 1`. Columnas: N° (readonly, 1..N) · Valor ·
Fecha de pago. Su comportamiento es el corazón de esta sección:

1. Al fijar `NumeroCuotas = N`, la tabla toma N filas con `NumCuota` 1..N.
2. Al escribir **Valor de cuota** en la cabecera, **todas las filas se siembran** con ese valor.
3. Si el usuario **edita el valor de una fila**, la cabecera se vacía y se deshabilita, y el envío
   lleva `ValorCuota: null` con el desglose completo.
4. **La salida del paso 3:** junto al campo deshabilitado aparece un botón *Volver a un valor único*
   que re-habilita la cabecera y vuelve a sembrar la tabla. Sin él, un valor cambiado por error deja
   al usuario encerrado en el escenario 3 y obligado a reescribir las N filas a mano.

**Qué se envía exactamente**, que es donde el comportamiento anterior se vuelve un contrato:

| Situación en pantalla | `ValorCuota` | `Cuotas` |
|---|---|---|
| Ninguna fila editada, ninguna fecha escrita | el valor de la cabecera | **no se envía** |
| Ninguna fila editada, con fechas escritas | el valor de la cabecera | sólo las filas con fecha, con su valor sembrado |
| Alguna fila editada | `null` | todas las filas con valor |

La tercera regla del medio importa: `validarCuotasCompra` exige `ValorCuota > 0` en **cada** fila del
desglose, así que una fila que sólo lleva fecha se rechazaría con «El valor de la cuota debe ser mayor
a cero». Por eso una fila se envía con su valor sembrado o no se envía.

Esto cubre los dos escenarios del backend sin que el usuario tenga que saber que existen:

| Escenario | `NumeroCuotas` | `ValorCuota` | `FechaCompromiso` | `Cuotas` |
|---|---|---|---|---|
| 1. Una cuota, un monto | `1` | el monto | **obligatoria** | no hace falta |
| 2. Varias cuotas, mismo valor | `N` | el valor común | se ignora (`NULL`) | opcional, para las fechas |
| 3. Varias cuotas, valores distintos | `N` | `NULL` | se ignora (`NULL`) | ahí está el desglose |

Una sola fuente de verdad: cuando existe el desglose, la cabecera no compite con él.

`Cuotas` es opcional y puede ir incompleto: es una transcripción informativa, no un cálculo, y el
backend no exige que esté completa. Con `NumeroCuotas > 1` y ninguna fila con fecha, la compra
simplemente no guarda fechas — el desglose no se envía y el valor vive en la cabecera.

### 5.6 Tabla de artículos

Una fila por línea de compra. Columnas, en orden:

| # | Columna | Qué hace |
|---|---|---|
| 1 | Bodega | `v-select`, de la caché (§10) |
| 2 | `mdi-book-plus` | abre `ArticuloNuevoDialog` para **esa** fila |
| 3 | `mdi-plus` | abre `ArticulosSeleccionar` para **esa** fila |
| 4 | `mdi-delete` | borra la fila |
| 5 | Artículo | readonly; lo llena cualquiera de los dos iconos |
| 6 | Cantidad | `type="number"`, > 0 |
| 7 | Costo unidad | `type="number"`, > 0 |
| 8 | Costo total | readonly, `Cantidad × CostoUnidad` |

**La columna 5 es un añadido sobre lo pedido.** En el orden original no había ninguna columna que
mostrara el artículo, y sin ella la fila no dice qué se está comprando: el combo de bodega y tres
iconos no identifican una pieza. Muestra `artNombre` (con el SKU en `text-caption`) si vino de
`ArticulosSeleccionar`, o el nombre escrito si vino de `ArticuloNuevoDialog`, con un chip *Nuevo*
para distinguirlos de un vistazo.

**La regla que el backend rechaza sin piedad: cada línea trae `idArticulo` o `ArticuloNuevo`, nunca
ambos y nunca ninguno.** El front la hace imposible de violar: elegir con `+` limpia el
`ArticuloNuevo` de esa fila, y guardar un artículo nuevo limpia el `idArticulo`. Una fila sin
ninguno de los dos se rechaza al confirmar, antes de llamar.

El botón *Agregar línea* añade una fila vacía. Tope de 200, el del backend, con el botón
deshabilitado al llegar.

`ArticulosSeleccionar` se usa con su contrato del handoff §3 y emite el registro completo:
`artId`, `artSKU`, `artNombre`, `artPropiedades`, `artCategoria`, `artTipoProducto`. **No se exige
que el artículo sea vendible** —a diferencia de la venta—: un artículo comprado nace justamente con
`Vender = false`.

### 5.7 El payload

Artículo existente:

```json
{ "idBodega": 2, "idArticulo": 578, "Cantidad": 15.5, "CostoUnidad": 40000 }
```

Artículo nuevo:

```json
{ "idBodega": 2, "Cantidad": 1, "CostoUnidad": 180000,
  "ArticuloNuevo": { "idProducto": 12, "Nombre": "ANILLO ORO 18K USADO",
                     "Descripcion": "Con rayones en la parte interna",
                     "Propiedades": [ { "idPropiedad": 4, "Valor": "18K" } ] } }
```

Compra completa a crédito:

```json
{ "idEmpresa": 1, "idTercero": 5, "TipoCompra": "CREDITO",
  "NumeroDocumentoSoporte": "FV-0012",
  "ValorDescuento": 0, "ValorEfectivo": 200000, "ValorTransaccion": 0,
  "FechaCompromiso": null, "NumeroCuotas": 3, "ValorCuota": null,
  "Cuotas": [ { "NumCuota": 1, "ValorCuota": 150000, "FechaPago": "2026-10-15" } ],
  "Articulos": [ ] }
```

Con CONTADO, los cuatro campos de crédito y `Cuotas` no se envían. Respuesta:
`{ msg: 'Compra registrada', idCompra: 75 }`.

Tras el éxito: `await Swal.fire(...)` y después `this.$router.back()`. El `await` es intencional
—primero se ve el mensaje, después se navega— y al volver, el `created()` del List dispara
`consultar()`, así que la tabla ya sale actualizada sin que el Form recargue nada.

## 6. `ArticuloNuevoDialog.vue`

La ventana flotante del `mdi-book-plus`. Es el formulario de alta de artículo **embebido en una línea
de la compra**, y sus reglas son las mismas que el alta suelta porque el backend reutiliza la misma
función de validación (`validarDatosArticulo`):

| Campo | Regla |
|---|---|
| Producto | obligatorio; se elige con el selector de producto |
| Nombre | obligatorio, máximo 150 caracteres, se guarda en MAYÚSCULAS |
| Descripción | opcional, máximo 300 |
| Propiedades | tabla de `idPropiedad` + `Valor`; valor no vacío, máximo 150 |

El selector de producto es el diálogo de `ArticulosForm`, con `productoService.getActivas` y sus
filtros. La tabla de propiedades replica la de `ArticulosForm`: `v-select` de propiedades de la caché
(§10), campo readonly con el tipo de dato, campo de valor y caneca; las filas sin propiedad o sin
valor se descartan al guardar.

**El artículo creado nace con `PrecioVentaUnitario` nulo y `Vender = false`**, y el diálogo no ofrece
esos campos: la compra sólo registra costo. El precio de venta se fija después, en la pantalla de
Artículos, cuando la pieza ya fue avaluada. El diálogo lo dice en un `text-caption` para que nadie
busque el campo de precio.

Contrato: `v-model` para la visibilidad, `:id-empresa`, y `@guardar` con el objeto `ArticuloNuevo`
listo. Recibe también el valor actual de la fila para poder reabrirse y editar lo ya escrito.

## 7. `CompraDetalle.vue`

Ruta `compras/:EmpId/:ComId/detalle`, `props: true`. Un solo `getidcompra` la llena entera.

**La empresa sale de la URL, no del store.** Es el error §7 del handoff: si el usuario cambia de
empresa en la barra superior con el detalle abierto, `anularcompra` y las operaciones de cuotas
seguirían apuntando a la compra correcta. El `:EmpId` de la ruta no es decorativo.

```js
idEmpresa() { return Number(this.$route.params.EmpId) }
idCompra()  { return Number(this.$route.params.ComId) }
```

Cuatro tarjetas, **ninguna editable y sin botón de guardar**:

1. **Cabecera** — fecha, documento soporte, tercero (`compraTerceroTipoDoc` + `compraTerceroNumeroDoc`
   + `compraTercero`), tipo, y el bloque de dinero: `compraSubtotal`, `compraDescuento`,
   `compraCancelado`, `compraSaldo`. Chip de estado. Si es CREDITO, además `compraNumeroCuotas`,
   `compraValorCuota` y `compraFechaCompromiso`.
2. **Líneas** — `detArticuloNombre` · `detBodegaNombre` · `detCantidad` · `detCostoUnidad` · total de
   la línea (calculado en el front; el backend no lo manda).
3. **Cuotas** — sólo si es CREDITO. Ver §8. En una compra de contado el arreglo viene vacío.
4. **Anulación** — sólo si `compraEstado === 0`: `compraMotivoAnulacion`, `compraFechaAnulacion`,
   `compraUsuarioAnulador`.

### Anular

Botón rojo en el encabezado, visible sólo si `compraEstado === 1`. `Swal.fire` con
`input: 'textarea'` e `inputValidator` que exige entre **5 y 300 caracteres** antes de enviar: el
backend lo rechaza igual, pero validar aquí ahorra el viaje.

El texto del diálogo dice, sin rodeos, que **anular no revierte el inventario ni la caja**: sólo
marca la compra y deja el motivo, quién anuló y cuándo, y el ajuste de existencias es manual por el
módulo de Ajustes.

Al confirmar se recarga `getidcompra` y la pantalla se reconfigura sola: chip rojo, botón fuera,
tarjeta de anulación visible, botones de cuotas ocultos.

## 8. Las cuotas

Sólo sobre compras **CREDITO y activas**. Una compra anulada congela sus cuotas: los tres endpoints
responden 400, así que los botones no se muestran en ese caso. La lectura por `getidcompra` sigue
funcionando.

Alias: `cuoId`, `cuoNumCuota`, `cuoValorCuota`, `cuoFechaPago`, `cuoEstado`. Vienen ordenadas por
número de cuota.

### El vocabulario cruzado

`cuoEstado = 'CANCELADA'` significa **pagada** (sentido coloquial de «cancelar una cuota»), mientras
`compraEstado = 0` significa **anulada**. Son conceptos opuestos con nombres parecidos, en la misma
pantalla, y el handoff §5 lo marca como el error más fácil de cometer en este módulo.

**Decisión: el front traduce.** La tabla muestra chips **«Pagada»** (verde) y **«Pendiente»** (gris),
y el combo del diálogo dice *Pendiente* / *Pagada*. Al backend viajan `PENDIENTE` y `CANCELADA` sin
cambio: el contrato no se toca, lo que cambia es la palabra que lee el usuario. Así «anulada» queda
libre para significar una sola cosa en toda la pantalla.

Debajo de la tabla, un `text-caption`: marcar una cuota como pagada **no mueve caja ni recalcula el
saldo** de la cabecera. Es un registro informativo que transcribe el usuario; el movimiento de caja
llegará con el módulo de Abonos.

### Las tres operaciones

Un solo `v-dialog` sirve para agregar y editar: los campos son los mismos (N°, valor, fecha de pago,
estado).

| | Endpoint | Detalles |
|---|---|---|
| Agregar | `POST /newcompracuota` | `{ idEmpresa, idCompra, NumCuota, ValorCuota, FechaPago, Estado }`. `NumCuota` entero entre 1 y `compraNumeroCuotas`. `400` si esa cuota ya está registrada |
| Editar | `PUT /updatecompracuota` | `{ idEmpresa, idCuota, … }`. Los cuatro campos opcionales, al menos uno. Los que no vengan conservan su valor |
| Borrar | `DELETE /deletecompracuota` | `{ idEmpresa, idCuota }`. Responde **204 sin cuerpo** |

Tres detalles que se implementan mal si no se leen:

- **`FechaPago: null` sí es un cambio**: es como se vacía una fecha ya puesta. El diálogo distingue
  «no toqué la fecha» de «borré la fecha», y sólo en el segundo caso manda `null`.
- **El borrado es real** —el único `DELETE` del proyecto—: esta tabla no tiene estado de fila y sus
  datos no son contables. La confirmación lo dice, y no hay forma de deshacerlo.
- **El 204 no trae `data.msg`**, así que el mensaje de éxito es propio. Es la única respuesta del
  proyecto sin cuerpo, y leer `data.msg` ahí da `undefined`.

El `NumCuota` del diálogo de alta se ofrece como `v-select` con los números 1..`compraNumeroCuotas`
que **todavía no están registrados**: así el 400 por cuota repetida no puede ocurrir por descuido.

Tras cualquiera de las tres, se recarga `getidcompra`. Es una llamada y evita mantener dos copias del
estado.

## 9. El PDF

`npm i jspdf jspdf-autotable`. `src/utils/compraPdf.js` exporta una función que **recibe los datos ya
cargados** y guarda el archivo:

```js
generarPdfCompra({ cabecera, lineas, cuotas, nombreEmpresa })   // -> compra-75.pdf
```

No pide nada por su cuenta. Quien la llama trae los datos, y así el grid y el detalle comparten un
solo generador:

- **Desde el grid:** el clic pide `getidcompra` de esa fila y llama al generador, con el spinner en
  el botón de esa fila.
- **Desde el detalle:** los datos ya están en memoria; llamada directa.

Contenido: nombre de la empresa, «Comprobante de compra», número y fecha, tercero, documento soporte
y tipo; `autoTable` con las líneas; bloque de totales alineado a la derecha (subtotal, descuento,
cancelado, saldo); `autoTable` con las cuotas si hay; pie con la fecha de impresión.

**Si `compraEstado === 0`, el PDF lleva un banner «ANULADA» con el motivo**, arriba y en rojo.
Imprimir una compra anulada sin que el papel lo diga es la forma de que ese papel termine usándose
como si valiera.

El nombre de la empresa: en el grid sale de `authStore.empresaActual.Nombre`; en el detalle hay que
buscarlo por el `:EmpId` de la URL (`authStore.empresas.find(e => e.Id === idEmpresa)`), que puede no
ser la empresa seleccionada. Es el mismo cuidado de §7.

Montos con `toLocaleString('es-CO')`, como ya hace `ArticulosSeleccionar`.

## 10. La caché de catálogos

`src/stores/catalogos.js`, **segundo store del proyecto** (hoy sólo existe `auth`):

```js
state:   { bodegas: {}, propiedades: {} }        // { [idEmpresa]: [...] }
actions: getBodegas(idEmpresa)                   // devuelve la caché, o pide y guarda
         getPropiedades(idEmpresa)
         invalidar(idEmpresa)
```

**Indexada por empresa.** Bodegas y propiedades son por empresa: sin el índice, cambiar de empresa en
la barra superior dejaría el combo de bodegas mostrando las de la anterior — un error silencioso que
guardaría la línea contra una bodega ajena.

**No se persiste en `localStorage`.** `auth` sí lo hace porque la sesión debe sobrevivir a un F5; una
lista de bodegas no. Al recargar se vuelve a pedir, y ésa es justo la invalidación que hace falta.

Una bodega o una propiedad creada en su propia pantalla no aparecería en una caché ya llena. Para eso,
el formulario lleva un `mdi-refresh` junto al encabezado de la columna Bodega —y otro en la tabla de
propiedades del diálogo— que llama a `invalidar(idEmpresa)` y vuelve a pedir.

Las fuentes son las que ya existen: `bodegaService.getActivas({ idEmpresa })` y
`propiedadService.getActivas({ idEmpresa })`. **Los services no se tocan**: el handoff §2 dice que son
objetos planos sin lógica, y meterles estado rompería esa regla en archivos que ya usan Ventas,
Artículos y Kardex.

## 11. Rutas y menú

En el bloque de Compras de `router/index.js`:

```js
{ path: 'compras',                        name: 'ComprasList',   component: … },
{ path: 'compras/nueva',                  name: 'CompraNueva',   component: …CompraForm },
{ path: 'compras/:EmpId/:ComId/detalle',  name: 'CompraDetalle', component: …, props: true }
```

La ruta `compras` con `name: 'Compras'` que hoy apunta al `EnConstruccion` se reemplaza por
`ComprasList`. **Hay que actualizar el `:to` de `MainLayout.vue`**, que hoy apunta a `name: 'Compras'`
y dejaría de resolver.

En `MainLayout.vue`, quitar `class="bg-red text-white"` de la entrada de Compras: es el semáforo del
proyecto y hay que mantenerlo al día.

## 12. Errores

El del handoff, sin inventar otro:

```js
catch (error) {
  const mensaje = error.response?.data?.msg || 'No se pudo consultar las compras'
  Swal.fire('Error', mensaje, 'error')
} finally {
  this.cargando = false
}
```

El backend siempre manda `{ msg }` en los errores; el texto propio es para cuando la petición no
llegó. **Los errores de validación y de negocio son `400`**: el interceptor de `http.js` hace logout
sólo con `401`, que el backend devuelve únicamente cuando la petición va sin token.

`$refs.form.validate()` es **asíncrono y devuelve `{ valid }`**, no un booleano. Es Vuetify 3, y es
el error que el handoff lista entre los ya cometidos.

## 13. Verificación

**El proyecto no tiene pruebas ni linter** (handoff §4.8): `package.json` sólo trae `dev`, `build` y
`preview`. La verificación es manual, con `npm run dev` y el backend levantado, y la hace el usuario:
el navegador de este entorno es Edge y no hay automatización de por medio.

Lista de comprobación:

1. Compra de **contado que cuadra** → se registra.
2. Contado con saldo distinto de cero → **rechazada**, con el mensaje del cuadre.
3. Contado sin efectivo ni transferencia → **rechazada**.
4. Crédito con el pago cubriendo todo → **rechazada** («use CONTADO»).
5. Crédito de **una cuota sin fecha de compromiso** → rechazada; con fecha → se registra.
6. Crédito de **3 cuotas iguales sin fechas**: valor en la cabecera, la tabla se siembra, se guarda.
   Leer de vuelta en el detalle: `compraValorCuota` con valor y **ninguna** cuota registrada.
7. Crédito de **3 cuotas iguales con fechas**: leer de vuelta `compraValorCuota` con valor **y** las
   tres cuotas, cada una con su fecha.
8. Crédito de **3 cuotas distintas**: se edita una fila, la cabecera se vacía y se deshabilita.
   Leer de vuelta: `compraValorCuota` en `null` y el desglose completo.
9. Desde el estado anterior, *Volver a un valor único* re-habilita la cabecera y resiembra la tabla.
10. Crédito de **3 cuotas sin valor de cabecera y sin tocar la tabla** → rechazada («El valor de la
    cuota es obligatorio cuando no se detallan las cuotas»).
11. Línea con **artículo nuevo** (producto + nombre + propiedades) → el artículo aparece después en
    Artículos, sin precio y no vendible.
12. Una línea con artículo existente **y** una con artículo nuevo en la misma compra.
13. Una fila a la que se le elige artículo con `+` y luego se le abre `book-plus`, y al revés: sólo
    queda uno de los dos, nunca ambos.
14. Grid: los cinco `campoOrdenar` en los dos sentidos; la caja de texto **deshabilitada** con
    `campoOrdenar: 5`; filtro por tercero y su limpieza; rango de fechas con una sola cota y con las
    dos; paginado conservando filtros.
15. **Anular** una compra: el motivo corto se rechaza en el diálogo; tras anular, chip rojo, tarjeta
    de anulación, botón fuera y botones de cuotas ocultos.
16. Cuotas: agregar, editar (incluido **vaciar la fecha**), borrar; y que los tres botones **no
    aparezcan** en una compra anulada.
17. PDF de una compra **activa** y de una **anulada** (banner «ANULADA» con el motivo), desde el grid
    y desde el detalle.
18. **Cambiar de empresa en la barra superior con el detalle abierto** y anular: la compra se anula
    contra la empresa de la URL, no contra la recién seleccionada.
19. Cambiar de empresa y abrir el formulario: el combo de bodegas muestra las de la empresa nueva.

## 14. Lo que deliberadamente no se hace

- **No hay `CompraForm` en modo edición**, porque no hay endpoint de edición. §1.
- **No se valida `NumeroCuotas × ValorCuota` contra el saldo**, ni como aviso. §5.4.
- **No se toca `bodegaService` ni `propiedadService`** para meterles caché. §10.
- **No se introduce `<script setup>`** ni `v-data-table`: el proyecto es Options API y `v-table`
  cruda, por decisión tomada. §2.
- **No se apunta `build.outDir` a la carpeta del backend.** El despliegue es manual y la separación
  en disco es política de seguridad, no una tarea pendiente.
- **No se arregla la autorización por rol** (deuda §4.5 del handoff): es un cambio en el router que
  afecta a las once pantallas y no pertenece a este módulo.
