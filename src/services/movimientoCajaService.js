import http from '@/services/http'

// OJO: no confundir con movimientoService.js, que es el de INVENTARIO (kardex y ajuste de
// existencias). Este es el de CAJA, y son modulos distintos del backend.
export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, estadoFiltro, fechaInicio, fechaFin,
    //            tipoFiltro, motivoFiltro }
    // campoOrdenar: 1 fecha de creacion, 2 valor, 3 motivo, 4 tipo de movimiento.
    // estadoFiltro: 0 todos, 1 activos, 2 anulados.
    // tipoFiltro y motivoFiltro son arreglos, y el arreglo VACIO significa "todos" (no null).
    return http.post('/movimientocaja/getallmovimientocaja', payload)
  },
  getSaldo(payload) {
    // payload: { idEmpresa, fechaInicio, fechaFin }
    // Depende SOLO de las fechas: ni el estado, ni el tipo, ni el motivo entran aqui. Por eso
    // los totales de la pantalla no cambian al marcar un tipo o un motivo, y es correcto.
    return http.post('/movimientocaja/getsaldocaja', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idMovimientoCaja }
    // Trae lo que el listado NO devuelve: movcajObservaciones, movcajMotivoAnulacion,
    // movcajFechaAnulacion y movcajUsuarioAnulador.
    return http.post('/movimientocaja/getidmovimientocaja', payload)
  },
  create(payload) {
    // payload: { idEmpresa, TipoMovimiento, Valor, MetodoPago, Observaciones }
    // Da de alta un AJUSTE de caja: es el unico movimiento que nace en esta pantalla. Los demas
    // (venta, compra, abono, cuota, gasto) los crea su propio modulo.
    return http.post('/movimientocaja/newajustecaja', payload)
  },
  anular(payload) {
    // payload: { idEmpresa, idMovimientoCaja, MotivoAnulacion }
    return http.put('/movimientocaja/anularmovimientocaja', payload)
  }
}
