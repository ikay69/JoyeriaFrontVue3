<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">{{ esEdicion ? 'Editar proveedor' : 'Nuevo proveedor' }}</h1>

    <v-card class="pa-6" max-width="560" elevation="1">
      <v-form ref="form" @submit.prevent="confirmar">
        <v-text-field
          v-model="nombre"
          label="Nombre"
          maxlength="150"
          counter="150"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="apellidos"
          label="Apellidos"
          maxlength="150"
          counter="150"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-select
          v-model="idTipoDocumento"
          :items="tiposDocumento"
          item-title="tipDocNombre"
          item-value="tipDocId"
          label="Tipo de documento"
          :rules="[reglas.documentoTipo]"
          :loading="cargandoListas"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="numeroDocumento"
          label="Número de documento"
          maxlength="50"
          counter="50"
          :rules="[reglas.documentoNumero]"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="celular"
          label="Celular"
          maxlength="10"
          counter="10"
          :rules="[reglas.celular]"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="email"
          label="Email"
          maxlength="150"
          type="email"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="direccion"
          label="Dirección"
          maxlength="20"
          counter="20"
          variant="outlined"
          class="mb-2"
        />

        <v-select v-if="esEdicion"
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

        <template v-if="esEdicion">
          <v-divider class="my-4" />
          <v-row dense align="center">
            <v-col cols="12" sm="3" class="font-weight-medium">Asignar como:</v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="tipoTerceroAsignar"
                :items="opcionesTipoTercero"
                item-title="texto"
                item-value="valor"
                label="Rol"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-btn
                color="primary"
                block
                :loading="asignandoRol"
                :disabled="!puedeAsignarRol"
                type="button"
                @click="asignarRol"
              >
                Asignar
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import terceroService from '@/services/terceroService'
import tipoDocumentoService from '@/services/tipoDocumentoService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ProveedoresForm',

  data() {
    return {
      nombre: '',
      apellidos: '',
      idTipoDocumento: '',
      numeroDocumento: '',
      celular: '',
      email: '',
      direccion: '',
      estado: true,
      usuario: '',
      fechaCreacion: '',

      tiposDocumento: [{ tipDocId: '', tipDocNombre: 'NN' }],

      cargando: false,
      cargandoListas: false,
      guardando: false,
      tipoTerceroAsignar: null,
      asignandoRol: false,
      opcionesTipoTercero: [
        { valor: 'CLIENTE', texto: 'Cliente' },
        { valor: 'PROVEEDOR', texto: 'Proveedor' },
        { valor: 'TALLER', texto: 'Taller' }
      ],
      opcionesEstado: [
        { valor: true, texto: 'Activo' },
        { valor: false, texto: 'Inactivo' }
      ],
      reglas: {
        requerido: (v) => !!v || 'Campo obligatorio',
        documentoTipo: (v) => {
          const tipoVacio = v === '' || v === null || v === undefined
          const numeroVacio = !String(this.numeroDocumento ?? '').trim()
          return tipoVacio === numeroVacio || 'Complete ambos campos de documento o déjelos vacíos'
        },
        documentoNumero: (v) => {
          const tipoVacio = this.idTipoDocumento === '' || this.idTipoDocumento === null || this.idTipoDocumento === undefined
          const numeroVacio = !String(v ?? '').trim()
          return tipoVacio === numeroVacio || 'Complete ambos campos de documento o déjelos vacíos'
        },
        celular: (v) => !v || v.length === 10 || 'Debe tener exactamente 10 caracteres'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    idEmpresa() {
      if (this.esEdicion) {
        return Number(this.$route.params.EmpId)
      } else {
        return this.authStore.empresaSeleccionada
      }
    },

    esEdicion() {
      return this.$route.name === 'ProveedoresEditar'
    },

    idTercero() {
      return Number(this.$route.params.TerId)
    },

    fechaCreacionFormateada() {
      if (!this.fechaCreacion) return ''
      const fecha = new Date(this.fechaCreacion)
      return fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    puedeAsignarRol() {
      return Boolean(
        this.esEdicion &&
        Number.isInteger(Number(this.idEmpresa)) && Number(this.idEmpresa) > 0 &&
        Number.isInteger(this.idTercero) && this.idTercero > 0 &&
        this.tipoTerceroAsignar &&
        !this.asignandoRol
      )
    }
  },

  async created() {
    await this.cargarTiposDocumento()
    if (this.esEdicion) {
      this.cargarProveedor()
    }
  },

  methods: {
    async cargarTiposDocumento() {
      this.cargandoListas = true
      try {
        const { data } = await tipoDocumentoService.getActivas({ idEmpresa: this.idEmpresa })
        this.tiposDocumento = [{ tipDocId: '', tipDocNombre: 'NN' }, ...(data.data || [])]
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la lista de tipos de documento'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargandoListas = false
      }
    },

    async cargarProveedor() {
      this.cargando = true
      try {
        const { data } = await terceroService.getById({
          idEmpresa: this.idEmpresa,
          idTercero: this.idTercero
        })
        this.nombre = data.data.terNombres
        this.apellidos = data.data.terApellidos
        this.idTipoDocumento = data.data.terTipDocId ?? ''
        this.numeroDocumento = data.data.terNumDoc ?? ''
        this.celular = data.data.terCelular
        this.email = data.data.terEmail
        this.direccion = data.data.terDireccion
        this.estado = data.data.terEstado === 1
        this.usuario = data.data.terUsuario
        this.fechaCreacion = data.data.terFecCreacion

        // Si el tipo de documento del proveedor ya no está activo (no vino
        // en la lista de getActivas), lo agregamos igual para que el
        // combo lo muestre seleccionado correctamente.
        const existe = this.tiposDocumento.some((td) => td.tipDocId === data.data.terTipDocId)
        if (data.data.terTipDocId != null && !existe) {
          this.tiposDocumento.push({
            tipDocId: data.data.terTipDocId,
            tipDocNombre: data.data.terTipDocNombre
          })
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el proveedor'
        await Swal.fire('Error', mensaje, 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    normalizarDocumento() {
      const numeroDocumento = String(this.numeroDocumento ?? '').trim()
      if (!numeroDocumento || this.idTipoDocumento === '' || this.idTipoDocumento === null || this.idTipoDocumento === undefined) {
        return { idTipoDocumento: null, NumeroDocumento: null }
      }
      return { idTipoDocumento: this.idTipoDocumento, NumeroDocumento: numeroDocumento }
    },

    async asignarRol() {
      const idEmpresa = Number(this.idEmpresa)
      const idTercero = Number(this.idTercero)
      const rolesValidos = ['CLIENTE', 'PROVEEDOR', 'TALLER']

      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0 || !Number.isInteger(idTercero) || idTercero <= 0) {
        await Swal.fire('Atención', 'Se requiere una empresa y un tercero válidos para asignar el rol', 'warning')
        return
      }
      if (!rolesValidos.includes(this.tipoTerceroAsignar)) {
        await Swal.fire('Atención', 'Seleccione un rol válido', 'warning')
        return
      }

      this.asignandoRol = true
      try {
        const { data } = await terceroService.getCrearTerceroRol({
          idEmpresa,
          idTercero,
          tipoTercero: this.tipoTerceroAsignar
        })
        await Swal.fire('Éxito', data.msg || 'Rol asignado correctamente', 'success')
        this.tipoTerceroAsignar = null
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al asignar el rol'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.asignandoRol = false
      }
    },

    async confirmar() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.guardando = true
      try {
        if (this.esEdicion) {
          const { data } = await terceroService.update({
            idEmpresa: this.idEmpresa,
            idTercero: this.idTercero,
            Nombre: this.nombre,
            Apellidos: this.apellidos,
            ...this.normalizarDocumento(),
            Estado: this.estado,
            Celular: this.celular,
            Email: this.email,
            Direccion: this.direccion
          })
          await Swal.fire('Éxito', data.msg || 'Proveedor actualizado', 'success')
        } else {
          const { data } = await terceroService.create({
            idEmpresa: this.idEmpresa,
            tipoTercero: 'PROVEEDOR',
            Nombre: this.nombre,
            Apellidos: this.apellidos,
            ...this.normalizarDocumento(),
            Celular: this.celular,
            Email: this.email,
            Direccion: this.direccion
          })
          await Swal.fire('Éxito', data.msg || 'Proveedor creado', 'success')
        }
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar el proveedor'
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
