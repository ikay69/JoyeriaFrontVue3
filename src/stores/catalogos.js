import { defineStore } from 'pinia'
import bodegaService from '@/services/bodegaService'
import propiedadService from '@/services/propiedadService'

// Cache de los dos catalogos que Compras usa en combos.
//
// Indexado por empresa a proposito: bodegas y propiedades son POR empresa, y sin el indice,
// cambiar de empresa en la barra superior dejaria el combo mostrando las de la anterior. Eso no
// falla de forma visible: guarda la linea contra una bodega ajena.
//
// NO se persiste en localStorage, a diferencia del store auth: la sesion tiene que sobrevivir a
// un F5, una lista de bodegas no. Recargar la pagina ES la invalidacion natural. Para el caso de
// la bodega recien creada en su propia pantalla esta `invalidar`, que el formulario expone en un
// boton de refrescar.
export const useCatalogosStore = defineStore('catalogos', {
  state: () => ({
    bodegas: {},
    propiedades: {}
  }),

  actions: {
    async getBodegas(idEmpresa) {
      if (this.bodegas[idEmpresa]) return this.bodegas[idEmpresa]
      const { data } = await bodegaService.getActivas({ idEmpresa })
      this.bodegas[idEmpresa] = data.data || []
      return this.bodegas[idEmpresa]
    },

    async getPropiedades(idEmpresa) {
      if (this.propiedades[idEmpresa]) return this.propiedades[idEmpresa]
      const { data } = await propiedadService.getActivas({ idEmpresa })
      this.propiedades[idEmpresa] = data.data || []
      return this.propiedades[idEmpresa]
    },

    invalidar(idEmpresa) {
      delete this.bodegas[idEmpresa]
      delete this.propiedades[idEmpresa]
    }
  }
})
