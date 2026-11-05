import { defineStore } from 'pinia'
import empresaService from '@/services/empresaService'

// Cache del logo de la empresa (la foto de /getfotoempresa) para la factura.
//
// La guia del backend pide no traer la foto en cada venta: se pide la primera vez que se imprime
// y se reutiliza. Indexado por empresa porque se puede cambiar de empresa en la barra superior.
// Se guarda como Data URL, que es lo que jsPDF recibe en addImage.
//
// Valores por empresa:
//   undefined  aun no se ha pedido
//   null       se pidio y la empresa no tiene foto (404); tambien se cachea para no repetir
//   'data:..'  la foto
//
// NO se persiste en localStorage: recargar la pagina es la invalidacion natural. EmpresaForm
// llama a `invalidar` al subir o eliminar la foto.
export const useLogoEmpresaStore = defineStore('logoEmpresa', {
  state: () => ({
    logos: {}
  }),

  actions: {
    // Devuelve el Data URL o null si la empresa no tiene foto. Otros errores se propagan y NO se
    // cachean, para que la siguiente impresion lo vuelva a intentar.
    async getLogo(idEmpresa) {
      if (this.logos[idEmpresa] !== undefined) return this.logos[idEmpresa]

      try {
        const resp = await empresaService.getFoto({ idEmpresa })
        // los errores llegan en JSON aunque se pida un blob: mirar el Content-Type
        if (!(resp.headers['content-type'] || '').startsWith('image/')) {
          throw new Error('La respuesta de la foto no es una imagen')
        }
        this.logos[idEmpresa] = await blobADataUrl(resp.data)
      } catch (error) {
        if (error.response?.status !== 404) throw error
        this.logos[idEmpresa] = null
      }
      return this.logos[idEmpresa]
    },

    invalidar(idEmpresa) {
      delete this.logos[idEmpresa]
    }
  }
})

function blobADataUrl(blob) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result)
    lector.onerror = () => reject(new Error('No se pudo leer la foto de la empresa'))
    lector.readAsDataURL(blob)
  })
}
