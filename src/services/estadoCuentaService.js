import http from '@/services/http'

export default {
  newPorCobrar(payload) {
    // payload: { idEmpresa, idTercero, TipoOrigen, MontoOriginal, MontoPendiente, FechaInicio,
    //   FechaVencimiento, Motivo }
    // MontoPendiente vacio = igual al MontoOriginal. El Estado lo calcula el servidor
    return http.post('/estadocuenta/newestadocuentaporcobrar', payload)
  },
  newPorPagar(payload) {
    // payload: el mismo de newPorCobrar
    return http.post('/estadocuenta/newestadocuentaporpagar', payload)
  },
  update(payload) {
    // payload: { idEmpresa, idEstadoCuenta, idTercero, TipoOrigen, MontoOriginal, MontoPendiente,
    //   FechaInicio, FechaVencimiento, Estado, Motivo }
    // Reemplazo completo: un Motivo que no se mande se borra. Sirve para por cobrar y por pagar
    return http.put('/estadocuenta/updateestadocuenta', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idEstadoCuenta }
    return http.post('/estadocuenta/getidestadocuenta', payload)
  },
  getAllPorCobrar(payload) {
    // payload: el mismo de getAllPorPagar
    return http.post('/estadocuenta/getallestadocuentaporcobrar', payload)
  },
  getAllPorPagar(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, fechaInicio, fechaFin, PorVencimiento,
    //   estadoFiltro, idTerceroFiltro }
    // fechaInicio y fechaFin obligatorias, rango maximo 94 dias
    return http.post('/estadocuenta/getallestadocuentaporpagar', payload)
  },
  updatePorPagarSistema(payload) {
    // payload: { idEmpresa }
    // Borra y vuelve a crear las cuentas por pagar SISTEMA (compras pendientes)
    return http.put('/estadocuenta/updateestadocuentaporpagar', payload)
  },
  getAllPorPagarSistema(payload) {
    // payload: el mismo de getAllPorCobrarSistema
    return http.post('/estadocuenta/getallestadocuentaporpagarsistema', payload)
  },
  updatePorCobrarSistema(payload) {
    // payload: { idEmpresa }
    // Borra y vuelve a crear las cuentas por cobrar SISTEMA (ventas y empeños pendientes)
    return http.put('/estadocuenta/updateestadocuentaporcobrar', payload)
  },
  getAllPorCobrarSistema(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, estadoFiltro, idTerceroFiltro }
    // Sin fechas. estadoFiltro: TODOS, PENDIENTE o PAGADO
    return http.post('/estadocuenta/getallestadocuentaporcobrarsistema', payload)
  }
}
