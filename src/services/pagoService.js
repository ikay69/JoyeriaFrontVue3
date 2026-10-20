import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, fechaInicio, fechaFin,
    //            estadoFiltro, idTerceroFiltro, tipoOrigenFiltro }
    return http.post('/pago/getallpago', payload)
  },

  getById(payload) {
    // payload: { idEmpresa, idPago }
    return http.post('/pago/getidpago', payload)
  },

  create(payload) {
    // payload: { idEmpresa, idTercero, TipoOrigen, idOrigen, Monto,
    //            MetodoPago, Observaciones }
    return http.post('/pago/newpago', payload)
  },

  anular(payload) {
    // payload: { idEmpresa, idPago, MotivoAnulacion }
    return http.put('/pago/anularpago', payload)
  }
}
