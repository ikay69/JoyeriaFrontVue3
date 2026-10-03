import http from '@/services/http'

export default {
  getKardex(payload) {
    // payload: { idEmpresa, idArticulo, idBodega, fechaInicio, fechaFin, pagina }
    return http.post('/movimiento/getkardex', payload)
  },
  newAjuste(payload) {
    // payload: { idEmpresa, idBodega, idArticulo, TipoMovimiento, BolsaEstado, idPropietario,
    //            Cantidad, CostoUnitario, Observaciones }
    return http.post('/movimiento/newajuste', payload)
  }
}
