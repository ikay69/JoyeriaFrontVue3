import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, tipoGastoFiltro,estadoFiltro, fechaInicio, fechaFin}
    return http.post('/gasto/getallgasto', payload)
  },
  create(payload) {
    // payload: { idEmpresa, idTipoGasto, Descripcion, Monto, MetodoPago, TipoOrigen, idOrigen }
    return http.post('/gasto/newgasto', payload)
  },
  exportarCsv(payload) {
    // payload: { idEmpresa, fechaInicio, fechaFin } (solo ADMINISTRADOR, fechas obligatorias, rango maximo 94 dias)
    // Responde un archivo CSV (blob); los errores llegan como JSON dentro del blob.
    return http.post('/gasto/exportargastoscsv', payload, { responseType: 'blob' })
  },
  getById(payload) {
    // payload: { idEmpresa, idGasto }
    return http.post('/gasto/getidgasto', payload)
  },
  anular(payload) {
    // payload: { idEmpresa, idGasto, MotivoAnulacion }
    return http.put('/gasto/anulargasto', payload)
  }
}