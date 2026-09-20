import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    return http.post('/articulo/getallarticulo', payload)
  },
  create(payload) {
    // payload: { idEmpresa, idProducto, Nombre, Descripcion, PrecioVentaUnitario, Vender, Propiedades }
    return http.post('/articulo/newarticulo', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idArticulo }
    return http.post('/articulo/getidarticulo', payload)
  },
  update(payload) {
    // ⚠️ Ruta NO confirmada en el documento — verificar con tu hermano
    // payload: { idEmpresa, idArticulo, idProducto, Nombre, Descripcion, PrecioVentaUnitario, Vender, Estado, Propiedades }
    return http.put('/articulo/updatearticulo', payload)
  },

  getActivas(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    // campoOrdenar -> 1:Nombre, 2:SKU, 3:Descripcion, 4:FechaCreacion
    // orden -> 'ASC' | 'DESC'
    // Usado por ArticulosSeleccionar.vue (ventana flotante para elegir un articulo)

    return http.post('/articulo/getactivasarticulo', payload)
  }


}