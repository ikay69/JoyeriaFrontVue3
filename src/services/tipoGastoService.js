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
  },
  getActivas(payload){
    // payload: { idEmpresa }
    return http.post('/tipogasto/getactivostipogasto', payload)
  },
  eliminar(payload) {
    // payload: { idEmpresa, idTipoGasto } -- SOLO ADMINISTRADOR. Es POST (no DELETE).
    // Borra de verdad; si algun gasto (activo o anulado) lo usa responde 400 {"data":"Tipo de gasto en uso"}.
    // OJO: sus 400 de negocio vienen en "data", no en "msg".
    return http.post('/tipogasto/deletetipogasto', payload)
  },
  // Lee el mensaje de error de este modulo: {msg}, {errors:[{msg}]} o {data:"..."}
  mensajeError(error, porDefecto) {
    const datos = error.response?.data
    return (
      datos?.msg ||
      datos?.errors?.[0]?.msg ||
      (typeof datos?.data === 'string' ? datos.data : '') ||
      porDefecto
    )
  }
}
