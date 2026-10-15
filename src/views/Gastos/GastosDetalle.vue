<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Gasto {{ gasto ? '#' + gasto.gasId : '' }}
          <v-chip
            v-if="gasto"
            :color="esActivo ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActivo ? 'Activo' : 'Anulado' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Un gasto registrado no se edita: la única operación correctiva es anularlo.
        </p>
      </div>
      <v-btn
        v-if="gasto && esActivo"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular gasto
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="gasto">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Datos del gasto</div>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">fecha:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearFechaHora(gasto.gasFecha) }}</v-col>
        </v-row>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">tipo gasto:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasTipoGasto || '-' }}</v-col>
        </v-row>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">monto:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium text-subtitle-1">{{ formatearMoneda(gasto.gasMonto) }}</v-col>
        </v-row>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">metodo de pago:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasMetodoPago || '-' }}</v-col>
        </v-row>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">descripcion:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasDescripcion || '-' }}</v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">usuario:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasUsuario || '-' }}</v-col>
        </v-row>
      </v-card>

      <v-card v-if="gasto.gasTipoOrigen" class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Origen</div>
        <v-row dense class="mb-1">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">tipo de origen:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasTipoOrigen }}</v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">origen:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ gasto.gasOrigenId }} (id de origen)</v-col>
        </v-row>
      </v-card>

      <v-card v-if="!esActivo" class="pa-6" elevation="1">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="4" class="mb-2">
            <div class="text-caption text-medium-emphasis">Fecha de anulación</div>
            <div>{{ formatearFechaHora(gasto.gasFechaAnulacion) }}</div>
          </v-col>
          <v-col cols="12" sm="4" class="mb-2">
            <div class="text-caption text-medium-emphasis">Usuario que anuló</div>
            <div>{{ gasto.gasUsuarioAnulador || '-' }}</div>
          </v-col>
          <v-col cols="12" class="mb-2">
            <div class="text-caption text-medium-emphasis">Motivo de la anulación</div>
            <div>{{ gasto.gasMotivoAnulacion || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import gastosService from '@/services/gastosService'

export default {
  name: 'GastosDetalle',

  data() {
    return {
      gasto: null,
      cargando: false,
      anulando: false
    }
  },

  computed: {
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },

    idGasto() {
      return Number(this.$route.params.GasId)
    },

    esActivo() {
      return this.gasto ? this.gasto.gasEstado === 1 : false
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await gastosService.getById({
          idEmpresa: this.idEmpresa,
          idGasto: this.idGasto
        })
        this.gasto = data.data || null
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el detalle del gasto'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    async anular() {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular este gasto?',
        html: '<p style="text-align:left">Escriba el motivo de la anulación (entre 6 y 255 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 255 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 6) return 'El motivo debe tener al menos 6 caracteres'
          if (texto.length > 255) return 'El motivo no puede superar los 255 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulando = true
      try {
        const { data } = await gastosService.anular({
          idEmpresa: this.idEmpresa,
          idGasto: this.idGasto,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Gasto anulado correctamente', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular el gasto'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (Number.isNaN(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>