import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, fechaInicio, fechaFin, idTercero }
    return http.post('/empeno/getallempeno', payload)
  },

  getById(payload) {
    // payload: { idEmpresa, idEmpeno }
    return http.post('/empeno/getidempeno', payload)
  },

  create(payload) {
    // payload: { idEmpresa, idTercero, CodigoContrato, TerceroCiudadDoc, FechaInicio, TasaInteresPeriodo, MetodoPago, MontoInicial, Articulos[] }
    return http.post('/empeno/newempeno', payload)
  },
}
