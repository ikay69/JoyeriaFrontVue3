import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// La ruta base del backend se toma de la variable de entorno VITE_API_BASE_URL
// (archivo .env en la raíz del proyecto). Si no existe, usa localhost:3000/api.
const http = axios.create({
  //baseURL: import.meta.env.VITE_API_BASE_URL //|| 'http://localhost:3000/api' || "/api"
  baseURL: "/api"
})

// El backend espera el token de sesion en un header literal "token" (no Authorization Bearer)
http.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.token = authStore.token
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // El backend responde 401 tanto por sesion invalida (token malo, usuario/empresa
    // desactivados) como por "rol sin permiso". Este ultimo NO invalida la sesion: el
    // token sigue sirviendo, solo esa ruta esta reservada al ADMINISTRADOR. Cerrar sesion
    // ahi sacaba al VENDEDOR del sistema (ej. al imprimir el contrato de una compra, que
    // consulta /empresa/getempresaid).
    const rolSinPermiso = error.response?.data?.msg === 'Usuario actual no está autorizado.'
    if (error.response && error.response.status === 401 && !rolSinPermiso) {
      const authStore = useAuthStore()
      authStore.logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default http
