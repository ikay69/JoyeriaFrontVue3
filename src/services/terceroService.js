import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    return http.post('/tercero/getalltercero', payload)
  },
  getAllClientes(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    return http.post('/tercero/getallclientetercero', payload)
  },
  getAllProveedores(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    return http.post('/tercero/getallproveedortercero', payload)
  },
  getAllTalleres(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    return http.post('/tercero/getalltallertercero', payload)
  },
  create(payload) {
    // payload: { idEmpresa, tipoTercero, Nombre, Apellidos, idTipoDocumento, NumeroDocumento, Celular, Email, Direccion }
    return http.post('/tercero/newtercero', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idTercero }
    return http.post('/tercero/getidtercero', payload)
  },
  update(payload) {
    // payload: { idEmpresa, idTercero, Nombre, Apellidos, idTipoDocumento, NumeroDocumento, Estado, Celular, Email, Direccion }
    return http.put('/tercero/updatetercero', payload)
  },
  getActivas(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    // campoOrdenar -> 1:Nombre, 2:Apellidos, 3:NumeroDocumento, 4:Email, 5:FechaCreacion
    // orden -> 'ASC' | 'DESC'
    // Usado por TercerosSeleccionar.vue (ventana flotante para elegir un tercero)
    return http.post('/tercero/getactivastercero', payload)
  },
  getActivosClientes(payload) {
    // payload: { idEmpresa, campoOrden, orden, pagina, textoFiltro }
    return http.post('/tercero/getactivosclientetercero', payload)
  },
  getActivosProveedores(payload) {
    // payload: { idEmpresa, campoOrden, orden, pagina, textoFiltro }
    return http.post('/tercero/getactivosproveedortercero', payload)
  },
  getActivosTalleres(payload) {
    // payload: { idEmpresa, campoOrden, orden, pagina, textoFiltro }
    return http.post('/tercero/getactivostallertercero', payload)
  },

  getCrearTerceroRol(payload){
    // payload: { idEmpresa,idTercero,tipoTercero}
    return http.post('/tercero/newtercerorol', payload)
  },

  importar(payload) {
    // payload: { idEmpresa, terceros: [{ tipoDocumento, numeroDocumento, nombre, apellidos, celular, tipo }] }
    // Maximo 200 filas, todo o nada
    return http.post('/tercero/importarterceros', payload)
  }
}
