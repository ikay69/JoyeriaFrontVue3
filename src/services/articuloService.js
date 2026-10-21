import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    return http.post('/articulo/getallarticulo', payload)
  },
  create(payload) {
    // Propiedades: [{ idPropiedad, idUnidadMedida (nullable), Valor }]
    // payload: { idEmpresa, idProducto, Nombre, Descripcion, PrecioVentaUnitario, Vender, Propiedades }
    return http.post('/articulo/newarticulo', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idArticulo }
    return http.post('/articulo/getidarticulo', payload)
  },
  update(payload) {
    // ⚠️ Ruta NO confirmada en el documento — verificar con tu hermano
    // Propiedades: [{ idPropiedad, idUnidadMedida (nullable), Valor }]
    // payload: { idEmpresa, idArticulo, idProducto, Nombre, Descripcion, PrecioVentaUnitario, Vender, Estado, Propiedades }
    return http.put('/articulo/updatearticulo', payload)
  },

  getActivas(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro }
    // campoOrdenar -> 1:Nombre, 2:SKU, 3:Descripcion, 4:FechaCreacion
    // orden -> 'ASC' | 'DESC'
    // Usado por ArticulosSeleccionar.vue (ventana flotante para elegir un articulo)

    return http.post('/articulo/getactivasarticulo', payload)
  },

  getParaVenta(payload){
    //payload: {idEmpresa,idBodega,campoOrdenar,orden,pagina,textoFiltro}
     return http.post('/articulo/getvendiblesarticulo', payload)
  },

  getParaProduccion(payload) {
    // payload: { idEmpresa, idBodega, idTercero, campoOrdenar, orden, pagina, textoFiltro }
    // idBodega es OBLIGATORIO (bodega activa de la empresa).
    // idTercero: null o 0 -> bolsa DISPONIBLE; > 0 -> bolsa RECIBIDO_DE_TALLER de ese tercero.
    // campoOrdenar -> 1:Nombre, 2:SKU, 4:FechaCreacion (el 3 lo rechaza esta ruta)
    // Respuesta: { cantData, data: [{ artId, artSKU, artNombre, ..., artCostoUnitario (cadena o null), artCantidadDisponible }] }
    // Usado por ArticulosProduccion.vue (consumos de la orden de produccion)
    return http.post('/articulo/getproduccionarticulo', payload)
  }
}
