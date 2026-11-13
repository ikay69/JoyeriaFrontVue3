import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    // campoOrdenar -> 1:Nombre, 2:FechaInicio, 3:FechaCreacion (textoFiltro solo filtra con 1)
    // estadoFiltro -> 0:todas, 1:activas, 2:inactivas (null se rechaza: omitir o mandar 0)
    return http.post('/promocion/getallpromocion', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idPromocion }
    return http.post('/promocion/getidpromocion', payload)
  },
  create(payload) {
    // payload: { idEmpresa, Nombre, Descripcion, FechaInicio, FechaFin, PorcentajeDescuento,
    //   ValorDescuento, MontoMinimoVenta, CantidadMinimaCompras, MontoMinimoAcumulado, TopeDescuento }
    // Responde { data: {...} } con la promocion creada y SIN msg.
    return http.post('/promocion/newpromocion', payload)
  },
  update(payload) {
    // payload: lo mismo que create + { idPromocion, Estado }. Reemplaza TODOS los campos.
    return http.put('/promocion/updatepromocion', payload)
  },
  delete(payload) {
    // payload: { idEmpresa, idPromocion }. Es POST y el borrado es fisico.
    return http.post('/promocion/deletepromocion', payload)
  },
  getVigentes(payload) {
    // payload: { idEmpresa }. Promociones activas cuya vigencia incluye hoy (ADMIN y VENDEDOR).
    return http.post('/promocion/getvigentespromocion', payload)
  }
}
