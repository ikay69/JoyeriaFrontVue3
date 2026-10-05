// Mapas y etiquetas de Movimiento en caja, compartidos por el List y el Detalle.
//
// Es el unico archivo compartido del modulo, y esta aqui a proposito: el filtro de motivos del
// List y la celda de la tabla tienen que salir del MISMO mapa. Con dos copias, una diria
// "Cuota empeño" y la otra "CUOTA EMPENO", porque cambiar los guiones bajos por espacios no
// devuelve la eñe que el valor del backend no tiene.

// Los nueve valores de movcajMotivo.
export const MOTIVOS = [
  { valor: 'VENTA_CONTADO', texto: 'Venta contado' },
  { valor: 'COMPRA_CONTADO', texto: 'Compra contado' },
  { valor: 'ABONO_VENTA', texto: 'Abono venta' },
  { valor: 'ABONO_COMPRA', texto: 'Abono compra' },
  { valor: 'CUOTA_VENTA', texto: 'Cuota venta' },
  { valor: 'CUOTA_COMPRA', texto: 'Cuota compra' },
  { valor: 'CUOTA_EMPENO', texto: 'Cuota empeño' },
  { valor: 'GASTO', texto: 'Gasto' },
  { valor: 'AJUSTE', texto: 'Ajuste' }
]

// Los ocho valores de movcajTipoOrigen. `ruta` y `paramId` son lo UNICO que hay que tocar cuando
// entre una pantalla nueva: hoy solo Compras existe, y agregar Ventas es poner ahi el nombre de
// su ruta y el de su parametro de id.
export const ORIGENES = [
  { valor: 'COMPRA', nombre: 'compra', ruta: 'CompraDetalle', paramId: 'ComId' },
  { valor: 'VENTA', nombre: 'venta', ruta: null, paramId: null },
  { valor: 'EMPENO', nombre: 'empeño', ruta: null, paramId: null },
  { valor: 'GASTO', nombre: 'gasto', ruta: null, paramId: null },
  { valor: 'ABONO', nombre: 'abono', ruta: null, paramId: null },
  { valor: 'CUOTA_COMPRA', nombre: 'cuota de compra', ruta: null, paramId: null },
  { valor: 'CUOTA_VENTA', nombre: 'cuota de venta', ruta: null, paramId: null },
  // Un ajuste no viene de ningun documento: se teclea en la propia pantalla de caja. Nunca va a
  // tener ruta, y por eso se deja sin `nombre`: su boton dice "Ver origen" y no "Ver ajuste",
  // que prometeria una pantalla que no va a existir.
  { valor: 'AJUSTE', nombre: null, ruta: null, paramId: null }
]

// 'VENTA_CONTADO' -> 'VENTA CONTADO'. El respaldo es para un motivo que el backend agregue y
// este mapa todavia no conozca: se muestra legible en vez de dejar la celda vacia.
export function textoMotivo(valor) {
  const motivo = MOTIVOS.find((m) => m.valor === valor)
  const texto = motivo ? motivo.texto : String(valor || '').replace(/_/g, ' ')
  return texto.toUpperCase()
}

export function origenDe(tipoOrigen) {
  return ORIGENES.find((o) => o.valor === tipoOrigen) || null
}

// 'COMPRA' + 1 -> 'COMPRA #1'
export function textoOrigen(mov) {
  if (!mov || !mov.movcajTipoOrigen) return '-'
  const id = mov.movcajOrigenId
  return id ? `${mov.movcajTipoOrigen} #${id}` : String(mov.movcajTipoOrigen)
}

export function etiquetaBotonOrigen(tipoOrigen) {
  const origen = origenDe(tipoOrigen)
  return origen && origen.nombre ? `Ver ${origen.nombre}` : 'Ver origen'
}

// Por que el boton esta deshabilitado. Va en el title, asi que tiene que explicarse solo.
export function motivoOrigenNoDisponible(tipoOrigen) {
  const origen = origenDe(tipoOrigen)
  if (origen && origen.valor === 'AJUSTE') {
    return 'Un ajuste de caja no proviene de otro documento'
  }
  if (!origen || !origen.nombre) {
    return 'Este origen no tiene una pantalla disponible'
  }
  return `La pantalla de ${origen.nombre} aún no está disponible`
}
