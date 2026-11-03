<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">{{ esEdicion ? 'Editar' : 'Nueva' }} cuenta {{ textoTipo }}</h1>

    <v-card class="pa-6" max-width="720" elevation="1">
      <div v-if="cargando" class="text-center py-6">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else ref="form" @submit.prevent="guardar">
        <v-alert
          v-if="anuladaGuardada"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          La cuenta está anulada: solo se puede cambiar el estado para reactivarla.
        </v-alert>

        <div class="d-flex align-center ga-2 mb-4">
          <v-btn
            icon="mdi-magnify"
            variant="tonal"
            title="Buscar tercero"
            :disabled="soloEstado"
            @click="dialogTercero = true"
          />
          <v-text-field
            :model-value="terceroTexto"
            :rules="[reglas.tercero]"
            label="Tercero"
            readonly
            placeholder="Seleccione un tercero"
            :disabled="soloEstado"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="flex-grow-1"
            @click="!soloEstado && (dialogTercero = true)"
          />
        </div>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select
              v-model="tipoOrigen"
              :items="opcionesTipoOrigen"
              item-title="texto"
              item-value="valor"
              label="Tipo de origen"
              :rules="[reglas.requerido]"
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <!-- Al crear el estado lo calcula el servidor; al editar se guarda el que se mande -->
            <v-select
              v-if="esEdicion"
              v-model="estado"
              :items="opcionesEstado"
              item-title="texto"
              item-value="valor"
              label="Estado"
              :rules="[reglas.requerido]"
              hint="Se guarda tal cual, no se calcula con los montos"
              persistent-hint
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="montoOriginal"
              label="Monto original"
              type="number"
              min="0.01"
              step="0.01"
              prefix="$"
              :rules="[reglas.montoOriginal]"
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="montoPendiente"
              label="Monto pendiente"
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              :rules="[reglas.montoPendiente]"
              hint="Vacío = igual al monto original"
              persistent-hint
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha inicio"
              type="date"
              :rules="[reglas.requerido]"
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="fechaVencimiento"
              label="Fecha vencimiento"
              type="date"
              :min="fechaInicio || undefined"
              :rules="[reglas.requerido, reglas.fechaVencimiento]"
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="motivo"
              label="Motivo"
              maxlength="1000"
              counter="1000"
              rows="2"
              auto-grow
              :disabled="soloEstado"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <div v-if="esEdicion" class="text-caption text-medium-emphasis mb-4">
          Creada por {{ usuario || '-' }} el {{ formatearFechaHora(fechaCreacion) }}
          <template v-if="usuarioActualizador">
            · Actualizada por {{ usuarioActualizador }} el {{ formatearFechaHora(fechaActualizacion) }}
          </template>
        </div>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="outlined" :disabled="guardando" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" type="submit" :loading="guardando" :disabled="guardando">
            {{ esEdicion ? 'Guardar' : 'Registrar' }}
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <TercerosSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresaForm"
      @seleccionar="tercero = $event"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import estadoCuentaService from '@/services/estadoCuentaService'
import { useAuthStore } from '@/stores/auth'
import TercerosSeleccionar from '@/components/common/TercerosSeleccionar.vue'

export default {
  name: 'CuentaForm',

  components: { TercerosSeleccionar },

  props: {
    // Lo pone la ruta: decide la ruta de alta
    tipo: {
      type: String,
      required: true,
      validator: (valor) => ['POR_COBRAR', 'POR_PAGAR'].includes(valor)
    },
    // Solo llegan en edicion, desde la fila del listado
    EmpId: { type: [Number, String], default: null },
    EstcueId: { type: [Number, String], default: null }
  },

  data() {
    return {
      tercero: null,
      tipoOrigen: null,
      montoOriginal: '',
      montoPendiente: '',
      fechaInicio: this.hoy(),
      fechaVencimiento: '',
      motivo: '',
      estado: null,
      estadoGuardado: null,
      usuario: '',
      usuarioActualizador: '',
      fechaCreacion: '',
      fechaActualizacion: '',

      cargando: false,
      guardando: false,
      dialogTercero: false,
      opcionesTipoOrigen: [
        { valor: 'VENTA', texto: 'Venta' },
        { valor: 'COMPRA', texto: 'Compra' },
        { valor: 'MERCANCIA', texto: 'Mercancía' },
        { valor: 'INVENTARIO', texto: 'Inventario' },
        { valor: 'PRESTAMO', texto: 'Préstamo' },
        { valor: 'APORTES', texto: 'Aportes' },
        { valor: 'OTRO', texto: 'Otro' }
      ],
      opcionesEstado: [
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PAGADO', texto: 'Pagado' },
        { valor: 'ANULADO', texto: 'Anulado' }
      ],
      reglas: {
        requerido: (valor) => !!valor || 'Campo obligatorio',
        tercero: () => !!this.tercero || 'Seleccione un tercero',
        montoOriginal: (valor) => {
          if (valor === '' || valor === null || valor === undefined) return 'Campo obligatorio'
          const numero = Number(valor)
          if (!Number.isFinite(numero) || Number(numero.toFixed(2)) <= 0) return 'Debe ser mayor a cero'
          if (numero > 9999999999.99) return 'Excede el máximo permitido'
          return true
        },
        montoPendiente: (valor) => {
          if (valor === '' || valor === null || valor === undefined) return true
          const numero = Number(valor)
          if (!Number.isFinite(numero) || numero < 0) return 'No puede ser negativo'
          const original = Number(this.montoOriginal)
          if (Number.isFinite(original) && numero > original) return 'No puede superar el monto original'
          return true
        },
        // Las fechas aaaa-mm-dd se comparan como texto, sin pasar por new Date()
        fechaVencimiento: (valor) =>
          !valor || !this.fechaInicio || valor >= this.fechaInicio ||
          'No puede ser anterior a la fecha inicio'
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    esPorCobrar() {
      return this.tipo === 'POR_COBRAR'
    },
    textoTipo() {
      return this.esPorCobrar ? 'por cobrar' : 'por pagar'
    },
    esEdicion() {
      return this.EstcueId !== null && this.EstcueId !== undefined
    },
    // En edicion la empresa sale del registro, no del selector de la barra
    idEmpresaForm() {
      return this.esEdicion ? Number(this.EmpId) : this.authStore.empresaSeleccionada
    },
    // Una cuenta guardada como ANULADO solo puede cambiar de estado: el resto debe llegar igual
    anuladaGuardada() {
      return this.esEdicion && this.estadoGuardado === 'ANULADO'
    },
    soloEstado() {
      return this.anuladaGuardada
    },
    terceroTexto() {
      if (!this.tercero) return ''
      return [this.tercero.identificacion, this.tercero.Nombre].filter(Boolean).join(' ')
    }
  },

  created() {
    if (this.esEdicion) this.cargarCuenta()
  },

  methods: {
    async cargarCuenta() {
      this.cargando = true
      try {
        const { data } = await estadoCuentaService.getById({
          idEmpresa: Number(this.EmpId),
          idEstadoCuenta: Number(this.EstcueId)
        })
        const cuenta = data.data
        if (cuenta.estcueOrigenRegistro !== 'MANUAL') {
          await Swal.fire('Atención', 'Solo se pueden editar las cuentas registradas manualmente', 'warning')
          this.$router.back()
          return
        }
        this.tercero = { Id: cuenta.estcueTerceroId, Nombre: cuenta.estcueTercero }
        this.tipoOrigen = cuenta.estcueTipoOrigen
        this.montoOriginal = cuenta.estcueMontoOriginal
        this.montoPendiente = cuenta.estcueMontoPendiente
        this.fechaInicio = cuenta.estcueFechaInicio
        this.fechaVencimiento = cuenta.estcueFechaVencimiento
        this.motivo = cuenta.estcueMotivo || ''
        this.estado = cuenta.estcueEstado
        this.estadoGuardado = cuenta.estcueEstado
        this.usuario = cuenta.estcueUsuario
        this.usuarioActualizador = cuenta.estcueUsuarioActualizador
        this.fechaCreacion = cuenta.estcueFechaCreacion
        this.fechaActualizacion = cuenta.estcueFechaActualizacion
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo cargar la cuenta'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async guardar() {
      if (this.guardando) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const idEmpresa = Number(this.idEmpresaForm)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      // Mismo body para crear y editar; editar es un reemplazo completo y agrega id y Estado
      const datos = {
        idEmpresa,
        idTercero: Number(this.tercero.Id),
        TipoOrigen: this.tipoOrigen,
        MontoOriginal: Number(this.montoOriginal),
        MontoPendiente: this.montoPendiente === '' || this.montoPendiente === null
          ? null
          : Number(this.montoPendiente),
        FechaInicio: this.fechaInicio,
        FechaVencimiento: this.fechaVencimiento,
        Motivo: this.motivo?.trim() || null
      }

      this.guardando = true
      try {
        if (this.esEdicion) {
          const { data } = await estadoCuentaService.update({
            ...datos,
            idEstadoCuenta: Number(this.EstcueId),
            Estado: this.estado
          })
          await Swal.fire('Éxito', data.msg || 'Cuenta actualizada', 'success')
        } else {
          const crear = this.esPorCobrar ? estadoCuentaService.newPorCobrar : estadoCuentaService.newPorPagar
          const { data } = await crear(datos)
          await Swal.fire('Éxito', data.msg || `Cuenta ${this.textoTipo} registrada`, 'success')
        }
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          `Ocurrió un error al guardar la cuenta ${this.textoTipo}`
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    cancelar() {
      this.$router.back()
    },

    hoy() {
      const ahora = new Date()
      const mes = String(ahora.getMonth() + 1).padStart(2, '0')
      const dia = String(ahora.getDate()).padStart(2, '0')
      return `${ahora.getFullYear()}-${mes}-${dia}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>
