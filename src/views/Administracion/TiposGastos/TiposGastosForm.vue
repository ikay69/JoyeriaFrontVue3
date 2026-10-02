<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">{{ esEdicion ? 'Editar tipo de gasto' : 'Nuevo tipo de gasto' }}</h1>

    <v-card class="pa-6" max-width="560" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <v-text-field
          v-model="nombre"
          label="Nombre"
          maxlength="100"
          counter="100"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="255"
          counter="255"
          rows="3"
          auto-grow
          variant="outlined"
          class="mb-2"
        />

        <v-select
          v-if="esEdicion"
          v-model="estado"
          :items="opcionesEstado"
          item-title="texto"
          item-value="valor"
          label="Estado"
          variant="outlined"
          class="mb-2"
        />

        <div v-if="esEdicion && usuario" class="mb-4">
          <div class="text-caption text-medium-emphasis">
            Creado por: <strong>{{ usuario }}</strong>
          </div>
          <div class="text-caption text-medium-emphasis" style="font-size: 11px;">
            Fecha creación: {{ fechaCreacionFormateada }}
          </div>
        </div>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" type="submit">Confirmar</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import tipoGastoService from '@/services/tipoGastoService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'TiposGastosForm',

  data() {
    return {
      nombre: '',
      descripcion: '',
      estado: true,
      usuario: '',
      fechaCreacion: '',

      cargando: false,
      guardando: false,
      opcionesEstado: [
        { valor: true, texto: 'Activo' },
        { valor: false, texto: 'Inactivo' }
      ],
      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    // En edicion la empresa sale de la ruta, NO del store: si el usuario cambia el selector de
    // empresa de la barra superior con el registro abierto, el store ya apunta a otra empresa y
    // el guardado iria contra la equivocada.
    idEmpresa() {
      if (this.esEdicion) {
        return Number(this.$route.params.EmpId)
      }
      return this.authStore.empresaSeleccionada
    },

    esEdicion() {
      return this.$route.name === 'TiposGastosEditar'
    },

    idTipoGasto() {
      return Number(this.$route.params.TipGasId)
    },

    fechaCreacionFormateada() {
      if (!this.fechaCreacion) return ''
      return new Date(this.fechaCreacion).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  created() {
    if (this.esEdicion) {
      this.cargarTipoGasto()
    }
  },

  methods: {
    async cargarTipoGasto() {
      this.cargando = true
      try {
        const { data } = await tipoGastoService.getById({
          idEmpresa: this.idEmpresa,
          idTipoGasto: this.idTipoGasto
        })
        this.nombre = data.data.tipgasNombre
        // La descripcion es opcional: el backend la puede devolver null y v-textarea con null
        // deja de ser un campo controlado.
        this.descripcion = data.data.tipgasDescripcion || ''
        // Estado llega como 1/0, no como booleano.
        this.estado = data.data.tipgasEstado === 1
        this.usuario = data.data.tipgasUsuario
        this.fechaCreacion = data.data.tipgasFecCreacion
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el tipo de gasto'
        await Swal.fire('Error', mensaje, 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    async confirmar() {
      if (this.guardando) return

      // validate() es async y devuelve { valid }, no un booleano.
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.guardando = true
      try {
        if (this.esEdicion) {
          const { data } = await tipoGastoService.update({
            idEmpresa: this.idEmpresa,
            idTipoGasto: this.idTipoGasto,
            Nombre: this.nombre.trim(),
            Descripcion: this.descripcion.trim(),
            Estado: this.estado
          })
          await Swal.fire('Éxito', data.msg || 'Tipo de gasto actualizado', 'success')
        } else {
          const { data } = await tipoGastoService.create({
            idEmpresa: this.idEmpresa,
            Nombre: this.nombre.trim(),
            Descripcion: this.descripcion.trim()
          })
          await Swal.fire('Éxito', data.msg || 'Tipo de gasto creado', 'success')
        }
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar el tipo de gasto'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
