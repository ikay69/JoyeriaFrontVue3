import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, pagina, idVendedor }
    // idVendedor -> -1: Sin vendedor, 0: Todos, cualquier otro numero: ese vendedor
    return http.post('/venta/getallventa', payload)
  },

  getById(payload) {
    // payload: { idEmpresa, idVenta }
    return http.post('/venta/getidventa',payload)

  },

  create(payload) {
    // payload: { idEmpresa, idTercero, idVendedor, TipoVenta, ValorDescuento,
    //            ValorEfectivo, ValorTransaccion,
    //            Articulos: [{ idBodega, idArticulo, Cantidad, PrecioVentaUnidad }] }
    return http.post('/venta/newventa', payload)
  },

  updateEstadoPago(payload) {
    // payload: { idEmpresa, idVenta, EstadoPago}
    return http.put('/venta/updateestadopagoventa', payload)
  },

  updateEstadoInventario(payload) {
    // payload: { idEmpresa, idVenta, EstadoInventario }
    return http.put('/venta/updateestadoinventarioventa', payload)
  },

  anular(payload) {
    // payload: { idEmpresa, idVenta, MotivoAnulacion }
    return http.put('/venta/anularventa', payload)
  }
}
