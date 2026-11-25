import http from '@/services/http'

export default {
  getAll(payload) {
    // payload: { idEmpresa, campoOrdenar, orden, pagina, textoFiltro, estadoFiltro }
    // campoOrdenar -> 1:Codigo, 2:FechaCreacion, 3:FechaModificacion (textoFiltro solo filtra con 1)
    // estadoFiltro -> 0:todas, 1:activas, 2:inactivas (null se rechaza: omitir o mandar 0)
    // El listado NO trae confValor ni confTipoValor.
    return http.post('/configuracion/getallconfiguracion', payload)
  },
  getById(payload) {
    // payload: { idEmpresa, idConfiguracion }
    return http.post('/configuracion/getidconfiguracion', payload)
  },
  create(payload) {
    // payload: { idEmpresa, Codigo, Descripcion, Valor, TipoValor }
    // Responde { data: {...} } con la configuracion creada y SIN msg. Nace activa.
    return http.post('/configuracion/newconfiguracion', payload)
  },
  update(payload) {
    // payload: lo mismo que create + { idConfiguracion, Estado }. Reemplaza TODOS los campos.
    // Responde { data: {...} } con la configuracion editada y SIN msg.
    return http.put('/configuracion/updateconfiguracion', payload)
  },
  delete(payload) {
    // payload: { idEmpresa, idConfiguracion }. Es POST y el borrado es fisico.
    return http.post('/configuracion/deleteconfiguracion', payload)
  },
  getValor(payload) {
    // payload: { idEmpresa, Codigo }. Responde { data: { confValor, confTipoValor } } (ADMIN y VENDEDOR).
    // Si no existe o esta inactiva llega confValor === '' (no es error).
    return http.post('/configuracion/getvalorconfiguracion', payload)
  }
}
