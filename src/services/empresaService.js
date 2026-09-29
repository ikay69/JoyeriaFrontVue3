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
    // payload: { idEmpresa, passEmpresa, Nombre, TipoDocumento, NumeroDocumento, Celular, Telefono, Email, Direccion }
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
  }
}