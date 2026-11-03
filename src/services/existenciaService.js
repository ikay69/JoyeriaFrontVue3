import http from '@/services/http'

export default {
  getExistencias(payload) {
    // payload: { idEmpresa, pagina, textoFiltro, BolsaEstado, idBodega }
    return http.post('/existencia/getexistencias', payload)
  },
  getExistenciasArticulo(payload) {
    // payload: { idEmpresa, idArticulo }
    return http.post('/existencia/getexistenciasarticulo', payload)
  },
  getExistenciasProducto(payload) {
    // payload: { idEmpresa, idProducto }
    return http.post('/existencia/getexistenciasproducto', payload)
  },
  exportarCsv(payload) {
    // payload: { idEmpresa, textoFiltro, BolsaEstado, idBodega } (solo ADMINISTRADOR, sin pagina)
    // Responde un archivo CSV (blob); los errores llegan como JSON dentro del blob.
    return http.post('/existencia/exportarexistenciascsv', payload, { responseType: 'blob' })
  },
  importarInventario(payload) {
    // payload: { idEmpresa, articulos: [{ bodega, categoria, tipoProducto, producto, tipoSeguimiento,
    //   articulo, existencia, cantidad, costoUnidad, precio, vender, tipoDocumento, numeroDocumento,
    //   nombre, apellido }] }
    // Solo administrador. Maximo 200 filas. Se escribe por etapas: si falla una, las anteriores quedan
    return http.post('/existencia/importarinventario', payload)
  },
  eliminarExistenciaCero(payload){
    // payload: { idEmpresa}
    // Solo administrador.
    return http.post('/existencia/deleteexistenciacero', payload)
  },
  cambioBodega(payload) {
    // payload: { idEmpresa, idBodegaOrigen, idBodegaDestino,
    //   articulos: [{ idArticulo, BolsaEstado, idPropietario, Cantidad, CostoUnidad }],
    //   gastos: [{ idTipoGasto, Descripcion, Monto, MetodoPago }] }
    // ADMINISTRADOR y VENDEDOR. Maximo 100 articulos y 50 gastos. Todo o nada.
    return http.post('/existencia/cambiobodega', payload)
  },
  updateCosto(payload) {
    // payload: { idEmpresa, idBodega, idArticulo, BolsaEstado, idPropietario, CostoUnitario, Observaciones }
    // Solo administrador y es POST. Solo DISPONIBLE, RECIBIDO_DE_TALLER y EN_GARANTIA_EMPENO.
    // idPropietario null con DISPONIBLE (un 0 se rechaza). Observaciones de 5 a 286 caracteres.
    // Deja SALIDA y ENTRADA en el kardex con Motivo AJUSTE
    return http.post('/existencia/updatecostoexistencia', payload)
  }
}
