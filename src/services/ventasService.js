import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, pagina, fechaInicio, fechaFin, idVendedor, idTercero,
    //            TipoVenta, EstadoPago, EstadoInventario }
    // idVendedor -> -1: Sin vendedor, 0: Todos, cualquier otro numero: ese vendedor
    // El endpoint ordena por fecha de creacion e id descendente.
    return http.post('/venta/getallventa', payload)
  },

  getActivas(payload) {
    // Mismo payload que getAll; solo trae ventas con Estado = TRUE
    return http.post('/venta/getactivasventa', payload)
  },

  getActivasCreditoAbono(payload) {
    // payload: { idEmpresa, pagina, idTercero } (idTercero null o 0 = todos)
    // Solo ventas activas CREDITO/POR_ABONO que no estan COMPLETO. Sin fechas.
    return http.post('/venta/getactivascreditoabonoventa', payload)
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
