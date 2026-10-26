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
  }
}
