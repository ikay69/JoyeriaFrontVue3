import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, idTercero, fechaInicio, fechaFin }
    return http.post('/compra/getallcompra', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idCompra }
    return http.post('/compra/getidcompra', payload)
  },
  create(payload) {
    // payload: { idEmpresa, idTercero, TipoCompra, NumeroDocumentoSoporte, ValorDescuento,
    //            ValorEfectivo, ValorTransaccion, FechaCompromiso, NumeroCuotas, ValorCuota,
    //            Cuotas, Articulos }
    return http.post('/compra/newcompra', payload)
  },
  updateCredito(payload) {
    // payload: { idEmpresa, idCompra, NumeroCuotas, ValorCuota }
    // Los dos ultimos admiten null, y null NO significa "dejalo como esta": pone el campo en
    // NULL. ValorCuota null es un estado real de la cabecera, el que la pantalla muestra como
    // "Valores distintos (ver detalle)".
    return http.put('/compra/updatecreditocompra', payload)
  },
  anular(payload) {
    // payload: { idEmpresa, idCompra, MotivoAnulacion }
    return http.put('/compra/anularcompra', payload)
  },
  createCuota(payload) {
    // payload: { idEmpresa, idCompra, NumCuota, ValorCuota, FechaPago, Estado }
    return http.post('/compra/newcompracuota', payload)
  },
  updateCuota(payload) {
    // payload: { idEmpresa, idCuota, NumCuota, ValorCuota, FechaPago, Estado }
    return http.put('/compra/updatecompracuota', payload)
  },
  deleteCuota(payload) {
    // payload: { idEmpresa, idCuota }
    // OJO: axios manda el cuerpo de un DELETE en la propiedad `data` de la config, NO como
    // segundo argumento. Escrito http.delete(url, payload) la peticion sale SIN cuerpo y el
    // backend responde 400 por idCuota faltante, que parece un error del servidor y no lo es.
    return http.delete('/compra/deletecompracuota', { data: payload })
  }
}
