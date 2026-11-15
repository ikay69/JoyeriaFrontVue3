import { defineStore } from 'pinia'
import empresaService from '@/services/empresaService'

const STORAGE_KEY = 'joyeria_auth'

function cargarDeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const guardado = cargarDeStorage()
    return {
      token: guardado?.token || null,
      usuario: guardado?.usuario || null,
      rol: guardado?.rol || null,
      empresas: guardado?.empresas || [],
      empresaSeleccionada: guardado?.empresaSeleccionada || null,
      // Datos publicos de la empresa seleccionada (/empresa/getdatosempresa) + su Id.
      // Sirven a los dos roles para imprimir facturas, tirillas y contratos.
      datosEmpresa: guardado?.datosEmpresa || null
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    // Empresa seleccionada: { Id, Nombre } del login, completada con los datos publicos
    // cuando ya se cargaron para esa misma empresa.
    empresaActual: (state) => {
      const base = state.empresas.find((empresa) => empresa.Id === state.empresaSeleccionada)
      if (!base) return null
      if (state.datosEmpresa?.Id === base.Id) return { ...base, ...state.datosEmpresa }
      return base
    }
  },
  actions: {
    // Se llama justo despues de un login exitoso con la respuesta cruda del backend
    setSession({ token, usuario, empresas, rol }) {
      this.token = token
      this.usuario = usuario
      this.empresas = empresas || []
      this.rol = rol
      this.empresaSeleccionada = this.empresas.length ? this.empresas[0].Id : null
      this.datosEmpresa = null

      this.persistir()
    },
    setEmpresaSeleccionada(idEmpresa) {
      this.empresaSeleccionada = idEmpresa
      this.persistir()
      // Los datos guardados eran de la otra empresa: se recargan sin bloquear el cambio
      this.cargarDatosEmpresa().catch(() => {})
    },
    // Trae los datos publicos de la empresa seleccionada y los deja en la sesion.
    // Lanza el error si falla (quien llama decide si avisar o seguir).
    async cargarDatosEmpresa() {
      const idEmpresa = Number(this.empresaSeleccionada)
      if (!this.token || !Number.isInteger(idEmpresa) || idEmpresa <= 0) return null

      const { data } = await empresaService.getDatos({ idEmpresa })
      // Si mientras tanto cambiaron de empresa o cerraron sesion, no se pisa nada
      if (!this.token || Number(this.empresaSeleccionada) !== idEmpresa) return null
      if (!data?.data) throw new Error(data?.msg || 'No se recibieron los datos de la empresa')

      this.datosEmpresa = { ...data.data, Id: idEmpresa }
      this.persistir()
      return this.empresaActual
    },
    // Datos completos de la empresa para imprimir. Usa los de la sesion; si no estan
    // (o son de otra empresa) los pide al backend. Lanza el error si no se pueden traer.
    async obtenerDatosEmpresa(idEmpresa = this.empresaSeleccionada) {
      const id = Number(idEmpresa)
      if (id === Number(this.empresaSeleccionada)) {
        if (this.datosEmpresa?.Id === id) return this.empresaActual
        const empresa = await this.cargarDatosEmpresa()
        if (empresa) return empresa
      }

      const { data } = await empresaService.getDatos({ idEmpresa: id })
      if (!data?.data) throw new Error(data?.msg || 'No se recibieron los datos de la empresa')
      const base = this.empresas.find((empresa) => empresa.Id === id) || {}
      return { ...base, ...data.data, Id: id }
    },
    persistir() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          usuario: this.usuario,
          rol: this.rol,
          empresas: this.empresas,
          empresaSeleccionada: this.empresaSeleccionada,
          datosEmpresa: this.datosEmpresa
        })
      )
    },
    logout() {
      this.token = null
      this.usuario = null
      this.rol = null
      this.empresas = []
      this.empresaSeleccionada = null
      this.datosEmpresa = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
