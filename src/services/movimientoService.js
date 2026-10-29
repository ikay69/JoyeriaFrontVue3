import http from '@/services/http'

export default {
  getKardex(payload) {
    // payload: { idEmpresa, idArticulo, idBodega, historico, fechaInicio, fechaFin, pagina }
    // historico: booleano (true = desde el primer movimiento y sin fechas; "true", 1 o 0 dan 400).
    // Con historico false o ausente, fechaInicio y fechaFin son obligatorias.
    // Orden: del mas viejo al mas nuevo.
    return http.post('/movimiento/getkardex', payload)
  },
  exportarCsv(payload) {
    // payload: { idEmpresa, fechaInicio, fechaFin } (solo ADMINISTRADOR, fechas obligatorias, rango maximo 94 dias)
    // Responde un archivo CSV (blob); los errores llegan como JSON dentro del blob.
    return http.post('/movimiento/exportarmovimientoscsv', payload, { responseType: 'blob' })
  },
  getById(payload) {
    // payload: { idEmpresa, idMovimiento } (idMovimiento tiene que ser numero entero, no texto)
    // Trae los mismos campos de una fila del kardex mas movArticuloId, movArticuloNombre y
    // movArticuloSku, y SIN movSaldo (es un acumulado del listado).
    return http.post('/movimiento/getidmovimiento', payload)
  },
  newAjuste(payload) {
    // payload: { idEmpresa, idBodega, idArticulo, TipoMovimiento, Motivo, idOrigen, BolsaEstado,
    //            idPropietario, Cantidad, CostoUnitario, Observaciones }
    // idOrigen es null cuando Motivo es AJUSTE; en los demas motivos es un entero > 0.
    return http.post('/movimiento/newajuste', payload)
  }
}
