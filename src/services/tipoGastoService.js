import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    return http.post('/tipogasto/getalltipogasto', payload)
  },
  create(payload) {
    // payload: { idEmpresa, Nombre, Descripcion }
    return http.post('/tipogasto/newtipogasto', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idTipoGasto }
    return http.post('/tipogasto/getidtipogasto', payload)
  },
  update(payload) {
    // payload: { idEmpresa, idTipoGasto, Nombre, Descripcion, Estado }
    return http.put('/tipogasto/updatetipogasto', payload)
  }
}
