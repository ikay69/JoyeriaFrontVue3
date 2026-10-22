<template>
  <v-dialog v-model="dialogVisible" max-width="620" scrollable>
    <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">{{ esEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</h1>
      <div class="d-flex align-center ga-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          :loading="guardando"
          @click="confirmar"
        >
          Guardar
        </v-btn>
        <v-btn icon="mdi-close" variant="text" title="Cerrar" @click="cancelar" />
      </div>
    </div>

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
        </div>
      </v-form>
    </v-card>
    </v-container>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import terceroService from '@/services/terceroService'
import tipoDocumentoService from '@/services/tipoDocumentoService'

export default {
  name: 'ClientesFormDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    idEmpresa: {
      type: [Number, String],
      required: true
    },
    cliente: {
      type: Object,
      default: null
    }
  },

  emits: ['update:modelValue', 'guardado'],

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
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(valor) {
        this.$emit('update:modelValue', valor)
      }
    },
    esEdicion() {
      return Boolean(this.cliente && this.cliente.Id)
    },
    idTercero() {
      return this.esEdicion ? Number(this.cliente.Id) : null
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
    }
  },

  watch: {
    async modelValue(visible) {
      if (visible) {
        await this.prepararFormulario()
      }
    }
  },

  methods: {
    async prepararFormulario() {
      this.nombre = ''
      this.apellidos = ''
      this.idTipoDocumento = ''
      this.numeroDocumento = ''
      this.celular = ''
      this.email = ''
      this.direccion = ''
      this.estado = true
      this.usuario = ''
      this.fechaCreacion = ''
      this.tiposDocumento = [{ tipDocId: '', tipDocNombre: 'NN' }]

      if (!this.idEmpresa) {
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        this.cerrar()
        return
      }

      await this.cargarTiposDocumento()
      if (this.esEdicion) {
        await this.cargarCliente()
      }
    },

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

    async cargarCliente() {
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

        // Si el tipo de documento del cliente ya no está activo (no vino
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
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el cliente'
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
          const tipoDocumento = this.tiposDocumento.find(
            (tipo) => Number(tipo.tipDocId) === Number(this.idTipoDocumento)
          )
          this.$emit('guardado', {
            creado: false,
            cliente: {
              Id: this.idTercero,
              identificacion: [tipoDocumento?.tipDocNombre, this.numeroDocumento].filter(Boolean).join(' '),
              Nombre: `${this.nombre} ${this.apellidos}`.trim(),
              Celular: this.celular
            }
          })
          this.cerrar()
          await Swal.fire('Éxito', data.msg || 'Cliente actualizado', 'success')
        } else {
          const { data } = await terceroService.create({
            idEmpresa: this.idEmpresa,
            tipoTercero: 'CLIENTE',
            Nombre: this.nombre,
            Apellidos: this.apellidos,
            ...this.normalizarDocumento(),
            Celular: this.celular,
            Email: this.email,
            Direccion: this.direccion
          })
          this.$emit('guardado', { creado: true, cliente: null })
          this.cerrar()
          await Swal.fire('Éxito', data.msg || 'Cliente creado', 'success')
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al guardar el cliente'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    }
  }
}
</script>
