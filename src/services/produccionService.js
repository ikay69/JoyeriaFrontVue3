import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, pagina, fechaInicio, fechaFin, textoFiltro }
    // OJO: este listado NO acepta campoOrdenar ni orden, a diferencia de los otros once. Por eso
    // la pantalla no tiene esos dos v-select: no es un olvido al copiar el patron.
    // fechaInicio y fechaFin son AAAA-MM-DD o null; textoFiltro, 255 caracteres.
    return http.post('/produccion/getallordenes', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idOrden }
    // Devuelve la cabecera mas `movimientos`, con las ENTRADAS (lo producido) y las SALIDAS
    // (lo consumido) mezcladas en un solo arreglo: separarlas es cosa de la pantalla.
    return http.post('/produccion/getidorden', payload)
  },
  create(payload) {
    // payload: { idEmpresa, Observaciones, consumos, producidos }
    // consumos:   { idArticulo, idBodega, BolsaEstado, idPropietario, Cantidad }
    //             BolsaEstado es DISPONIBLE o RECIBIDO_DE_TALLER, e idPropietario SOLO lleva
    //             valor con RECIBIDO_DE_TALLER; con DISPONIBLE viaja null.
    // producidos: { idArticulo, idBodega, Cantidad,CostoUnitario } — sin BolsaEstado ni propietario.
    return http.post('/produccion/nuevaorden', payload)
  },
  updateObservacion(payload) {
    // payload: { idEmpresa, idOrden, Observaciones }
    // Es PUT. Observaciones es obligatoria (no se puede dejar vacia), maximo 300 caracteres despues
    // de recortar. Admin y vendedor: es la unica ruta de produccion que el vendedor puede llamar.
    return http.put('/produccion/updateobservacionorden', payload)
  }
}
