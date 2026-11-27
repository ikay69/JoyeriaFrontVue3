import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, fechaInicio, fechaFin, idTercero, estadoEmpeno }
    return http.post('/empeno/getallempeno', payload)
  },

  getById(payload) {
    // payload: { idEmpresa, idEmpeno }
    return http.post('/empeno/getidempeno', payload)
  },

  create(payload) {
    // payload: { idEmpresa, idTercero, CodigoContrato, TerceroCiudadDoc, FechaInicio, TasaInteresPeriodo, MetodoPago, MontoInicial, idEmpenoOrigen, Articulos[] }
    return http.post('/empeno/newempeno', payload)
  },

  actualizarPeriodos(payload) {
    // payload: { idEmpresa }
    return http.post('/empeno/actualizarperiodos', payload)
  },

  entregarArticulos(payload) {
    // payload: { idEmpresa, idEmpeno, FechaEntrega }  (es PUT)
    return http.put('/empeno/entregararticulos', payload)
  },

  adjudicar(payload) {
    // payload: { idEmpresa, idEmpeno, HayEntrega, ValorCompra, MetodoPago, FechaAdjudicacion }
    return http.post('/empeno/adjudicar', payload)
  },

  getMora(payload) {
    // payload: { idEmpresa, pOrden, pagina, idTercero }
    return http.post('/empeno/getmora', payload)
  },

  retirar(payload) {
    // payload: { idEmpresa, idEmpeno, Valor, MetodoPago, FechaRetiro, IdsEntregados[] }
    return http.post('/empeno/retirar', payload)
  },

  getCuenta(payload) {
    // payload: { idEmpresa, idEmpeno }
    return http.post('/empeno/getcuenta', payload)
  },

  newPago(payload) {
    // payload: { idEmpresa, idEmpeno, MontoTotalPagado, MetodoPago, FechaPago }
    // Responde { msg, data: { pagos: [...] } } (desde 2026-11-26): TODOS los pagos del contrato,
    // mismo arreglo que /getidempeno, orden FechaPago ASC e Id ASC (el nuevo es el ultimo).
    return http.post('/empeno/newpago', payload)
  },
}
