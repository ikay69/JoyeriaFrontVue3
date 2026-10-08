import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, pagina, idVendedor }
    // idVendedor -> -1: Sin vendedor, 0: Todos, cualquier otro numero: ese vendedor
    return http.post('/venta/getallventa', payload)
  },

  getById(payload) {
    // payload: { idEmpresa, idVenta }
    // Pendiente: aun no se definio esta ruta (la usara VentasDetalle.vue)
  },

  create(payload) {
    // payload: { idEmpresa, idTercero, idVendedor, TipoVenta, ValorDescuento,
    //            ValorEfectivo, ValorTransaccion,
    //            Articulos: [{ idBodega, idArticulo, Cantidad, PrecioVentaUnidad }] }
    // Pendiente: aun no se definio esta ruta (la usara VentasForm.vue)
    return http.post('/venta/newventa',payload)
  }
}