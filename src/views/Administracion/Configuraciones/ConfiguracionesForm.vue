<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">{{ esEdicion ? 'Editar configuración' : 'Nueva configuración' }}</h1>

    <v-card class="pa-6" max-width="760" elevation="1">
      <v-form ref="form" :disabled="cargando" @submit.prevent="confirmar">
        <v-text-field
          v-model="codigo"
          label="Código"
          maxlength="15"
          counter="15"
          hint="Solo letras (A-Z) y números, sin espacios ni tildes. Se guarda en mayúsculas y no se puede repetir."
          persistent-hint
          :rules="[reglas.requerido, reglas.codigo]"
          variant="outlined"
          class="mb-4"
          @update:model-value="codigo = String($event || '').toUpperCase()"
        />

        <v-textarea
          v-model="descripcion"
          label="Descripción"
          maxlength="255"
          counter="255"
          rows="2"
          auto-grow
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-row dense>
          <v-col cols="12" sm="5">
            <v-select
              :model-value="tipoValor"
              :items="opcionesTipoValor"
              item-title="texto"
              item-value="valor"
              label="Tipo de valor"
              :rules="[reglas.requerido]"
              variant="outlined"
              @update:model-value="cambiarTipo"
            />
          </v-col>
          <v-col cols="12" sm="7">
            <v-text-field
              v-if="tipoValor === 'NUMERO'"
              v-model="valor"
              label="Valor"
              inputmode="decimal"
              hint="Entero o decimal con punto, ej. 18 o -2.5"
              :rules="[reglas.requerido, reglas.numero]"
              variant="outlined"
            />
            <v-text-field
              v-else-if="tipoValor === 'FECHA'"
              v-model="valor"
              label="Valor"
              type="date"
              :rules="[reglas.requerido]"
              variant="outlined"
            />
            <v-textarea
              v-else
              v-model="valor"
              label="Valor"
              rows="1"
              auto-grow
              :rules="[reglas.requerido]"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-select
          v-if="esEdicion"
          v-model="estado"
          :items="opcionesEstado"
          item-title="texto"
          item-value="valor"
          label="Estado"
          hint="Una configuración inactiva no se aplica en el sistema."
          persistent-hint
          variant="outlined"
          class="mt-2 mb-4"
        />

        <div v-if="esEdicion && (usuario || usuarioActualizador)" class="mb-4">
          <div v-if="usuario" class="text-caption text-medium-emphasis">
            Creado por: <strong>{{ usuario }}</strong> · {{ formatearFechaHora(fechaCreacion) }}
          </div>
          <div v-if="usuarioActualizador" class="text-caption text-medium-emphasis">
            Última modificación: <strong>{{ usuarioActualizador }}</strong> · {{ formatearFechaHora(fechaModificacion) }}
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
import configuracionService from '@/services/configuracionService'
import { useAuthStore } from '@/stores/auth'

const vacio = (v) => v === null || v === undefined || String(v).trim() === ''

// Mismas reglas que el backend.
const REGEX_CODIGO = /^[A-Za-z0-9]{1,15}$/
const REGEX_NUMERO = /^-?\d+(\.\d+)?$/

export default {
  name: 'ConfiguracionesForm',

  data() {
    return {
      codigo: '',
      descripcion: '',
      tipoValor: 'TEXTO',
      // Con FECHA se guarda aaaa-mm-dd (lo que usa el input date); al enviar se pasa a aaaa/mm/dd.
      valor: '',
      estado: true,
      usuario: '',
      usuarioActualizador: '',
      fechaCreacion: '',
      fechaModificacion: '',

      cargando: false,
      guardando: false,
      opcionesTipoValor: [
        { valor: 'TEXTO', texto: 'Texto' },
        { valor: 'NUMERO', texto: 'Número' },
        { valor: 'FECHA', texto: 'Fecha' }
      ],
      opcionesEstado: [
        { valor: true, texto: 'Activa' },
        { valor: false, texto: 'Inactiva' }
      ],
      reglas: {
        requerido: (v) => !vacio(v) || 'Campo obligatorio',
        codigo: (v) =>
          vacio(v) || REGEX_CODIGO.test(String(v).trim()) || 'Solo letras y números, sin espacios',
        numero: (v) =>
          vacio(v) || REGEX_NUMERO.test(String(v).trim()) || 'Número inválido (use punto para decimales)'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    // En edicion la empresa sale de la ruta, NO del store: si el usuario cambia el selector de
    // empresa de la barra superior con el registro abierto, el guardado iria contra la equivocada.
    idEmpresa() {
      if (this.esEdicion) {
        return Number(this.$route.params.EmpId)
      }
      return this.authStore.empresaSeleccionada
    },

    esEdicion() {
      return this.$route.name === 'ConfiguracionesEditar'
    },

    idConfiguracion() {
      return Number(this.$route.params.ConfId)
    }
  },

  created() {
    if (this.esEdicion) {
      this.cargarConfiguracion()
    }
  },

  methods: {
    async cargarConfiguracion() {
      this.cargando = true
      try {
        const { data } = await configuracionService.getById({
          idEmpresa: this.idEmpresa,
          idConfiguracion: this.idConfiguracion
        })
        const conf = data.data
        this.codigo = conf.confCodigo || ''
        this.descripcion = conf.confDescripcion || ''
        this.tipoValor = conf.confTipoValor || 'TEXTO'
        // confValor siempre llega como cadena; las fechas vienen aaaa/mm/dd.
        const valor = conf.confValor ?? ''
        this.valor = this.tipoValor === 'FECHA' ? String(valor).replaceAll('/', '-') : String(valor)
        // Estado llega como 1/0, no como booleano.
        this.estado = conf.confEstado === 1
        this.usuario = conf.confUsuario || ''
        this.usuarioActualizador = conf.confUsuarioActualizador || ''
        this.fechaCreacion = conf.confFecCreacion
        this.fechaModificacion = conf.confFecModificacion
      } catch (error) {
        await Swal.fire('Error', this.mensajeError(error, 'No se pudo cargar la configuración'), 'error')
        this.cancelar()
      } finally {
        this.cargando = false
      }
    },

    // Al cambiar el tipo, el valor anterior casi nunca sirve en el nuevo formato: se limpia.
    cambiarTipo(nuevoTipo) {
      if (nuevoTipo === this.tipoValor) return
      this.tipoValor = nuevoTipo
      this.valor = ''
    },

    // Editar REEMPLAZA todos los campos: se arma siempre el cuerpo completo.
    armarCuerpo() {
      const valor = String(this.valor).trim()
      return {
        Codigo: this.codigo.trim().toUpperCase(),
        Descripcion: this.descripcion.trim(),
        TipoValor: this.tipoValor,
        // El backend exige FECHA con barras: aaaa/mm/dd.
        Valor: this.tipoValor === 'FECHA' ? valor.replaceAll('-', '/') : valor
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
        // Crear y editar responden la configuracion en data y no traen msg: el aviso es propio.
        if (this.esEdicion) {
          await configuracionService.update({
            idEmpresa: this.idEmpresa,
            idConfiguracion: this.idConfiguracion,
            ...this.armarCuerpo(),
            Estado: this.estado
          })
          await Swal.fire('Éxito', 'Configuración actualizada', 'success')
        } else {
          await configuracionService.create({
            idEmpresa: Number(this.idEmpresa),
            ...this.armarCuerpo()
          })
          await Swal.fire('Éxito', 'Configuración creada', 'success')
        }
        this.$router.back()
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'Ocurrió un error al guardar la configuración'), 'error')
      } finally {
        this.guardando = false
      }
    },

    // Los 400 llegan como {msg} o como {errors:[{msg}]} (express-validator).
    // Los 500 traen el error crudo: se muestra el mensaje generico.
    mensajeError(error, alternativo) {
      if (error.response?.status >= 500) return alternativo
      const respuesta = error.response?.data
      return respuesta?.msg || respuesta?.errors?.[0]?.msg || alternativo
    },

    formatearFechaHora(valor) {
      if (!valor) return ''
      const fecha = new Date(valor)
      if (Number.isNaN(fecha.getTime())) return ''
      return fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    cancelar() {
      this.$router.back()
    }
  }
}
</script>
