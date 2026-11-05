import http from '@/services/http'

export default {
  getAll() {
    // GET, sin body, sin paginacion ni filtros: trae todas las empresas
    return http.get('/empresa/listarempresas')
  },
  create() {
    // POST sin body: el backend genera el nombre de empresa y usuario automaticamente
    return http.post('/empresa/ajvd845mda93n23lm3x')
  },
  getById(payload) {
    // payload: { idEmpresa }
    return http.post('/empresa/getempresaid', payload)
  },
  update(payload) {
    // payload: { idEmpresa, passEmpresa, Nombre, TipoDocumento, NumeroDocumento, Celular, Telefono, Email, Direccion,
    //            Whatsapp, Instagram, Twitter, Facebook, Youtube }
    // Reemplaza la ficha completa: lo que no se manda queda en null
    return http.put('/empresa/updateempresa', payload)
  },
  cambiarClave(payload) {
    // payload: { idEmpresa, passEmpresa, newClave }
    return http.put('/empresa/cambiarclaveempresa', payload)
  },
  cambiarPassword(payload) {
    // payload: { idEmpresa, passEmpresa, newPass }
    return http.put('/empresa/cambiarpassempresa', payload)
  },
  cambiarEstado(payload) {
    // payload: { idEmpresa, passEmpresa, newEstado }
    return http.put('/empresa/cambiarestadoempresa', payload)
  },
  updateFoto(payload) {
    // payload: { idEmpresa, Foto } -- Foto es un Data URL base64 (png/jpg/jpeg, max 500 KB)
    // Solo la empresa del token. Si ya tenia foto, la reemplaza
    return http.put('/empresa/updatefotoempresa', payload)
  },
  deleteFoto(payload) {
    // payload: { idEmpresa } -- DELETE con body: en axios va en { data }
    return http.delete('/empresa/deletefotoempresa', { data: payload })
  },
  getFoto(payload) {
    // payload: { idEmpresa } -- responde la IMAGEN (bytes), no JSON; los errores si vienen en JSON.
    // ADMINISTRADOR y VENDEDOR; cualquier empresa con la que el usuario tenga relacion activa
    // (no solo la del token)
    return http.post('/empresa/getfotoempresa', payload, { responseType: 'blob' })
  }
}