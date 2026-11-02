import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    return http.post('/tiposproducto/getalltipoproducto', payload)
  },
  create(payload) {
    // payload: { idEmpresa, Nombre }
    return http.post('/tiposproducto/newtipoproducto', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idTipoProducto }
    return http.post('/tiposproducto/getidtipoproducto', payload)
  },
  update(payload) {
    // payload: { idEmpresa, idTipoProducto, Nombre, Estado }
    return http.put('/tiposproducto/updatetipoproducto', payload)
  },
    getActivas(payload) {
    // payload: { idEmpresa }
    return http.post('/tiposproducto/getactivastipoproducto', payload)
  },
  eliminar(payload) {
    // payload: { idEmpresa, idTipoProducto }
    // Solo administrador. Borrado real; falla si algun producto usa el tipo
    return http.post('/tiposproducto/deletetipoproducto', payload)
  },
}