import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, pagina, fechaInicio, fechaFin, idVendedor, idTercero,
    //            TipoVenta, EstadoPago, EstadoInventario }
    // idVendedor -> -1: Sin vendedor, 0: Todos, cualquier otro numero: ese vendedor
    // El endpoint ordena por fecha de creacion e id descendente.
    return http.post('/venta/getallventa', payload)
  },

  exportarCsv(payload) {
    // payload: { idEmpresa, fechaInicio, fechaFin } (solo ADMINISTRADOR, rango maximo 94 dias)
    // Responde un archivo CSV (blob); los errores llegan como JSON dentro del blob.
    return http.post('/venta/exportarventascsv', payload, { responseType: 'blob' })
  },

  exportarArticulosCsv(payload) {
    // payload: { idEmpresa, fechaInicio, fechaFin } (solo ADMINISTRADOR, rango maximo 94 dias)
    // Una fila por articulo vendido (linea de venta). El rango se mide por la fecha de la venta.
    // Responde un archivo CSV (blob); los errores llegan como JSON dentro del blob.
    return http.post('/venta/exportarventasarticuloscsv', payload, { responseType: 'blob' })
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
  },

  createCuota(payload) {
    // payload: { idEmpresa, idVenta, NumCuota, ValorCuota, FechaPago }
    // La cuota nace PENDIENTE (Estado no se recibe). NumCuota hasta ventaNumeroCuotas + 1.
    return http.post('/venta/newventacuota', payload)
  },

  updateCuota(payload) {
    // payload: { idEmpresa, idCuota, Estado, ValorCuota, FechaPago } (al menos uno)
    // NumCuota no se edita y FechaPago no se puede vaciar.
    return http.put('/venta/updateventacuota', payload)
  },

  deleteCuota(payload) {
    // payload: { idEmpresa, idCuota }
    // DELETE con body: responde 204 sin cuerpo.
    return http.delete('/venta/deleteventacuota', { data: payload })
  }
}
