<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.push({ name: 'PagosList' })" />
      <div class="flex-grow-1">
        <h1 class="text-h5">
          Pago {{ pago ? `#${pago.pagoId}` : '' }}
          <v-chip
            v-if="pago"
            :color="esActivo ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ esActivo ? 'Activo' : 'Anulado' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Consulta del registro y de la venta a la que fue aplicado.
        </p>
      </div>
      <v-btn
        v-if="pago && esActivo && esAdministrador"
        color="error"
        variant="flat"
        prepend-icon="mdi-cancel"
        :loading="anulando"
        @click="anular"
      >
        Anular pago
      </v-btn>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="pago">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Datos del pago</div>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Fecha:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearFechaHora(pago.pagoFecha) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Monto:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium text-subtitle-1">{{ formatearMoneda(pago.pagoMonto) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Método de pago:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ nombreMetodo(pago.pagoMetodoPago) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Tipo:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ nombreTipoOrigen(pago.pagoTipoOrigen) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Registrado por:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ pago.pagoUsuario || '-' }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Cliente:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">
            {{ pago.terceroNombreCompleto || '-' }}
            <span class="text-medium-emphasis">({{ documentoCliente }})</span>
          </v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Observaciones:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ pago.pagoObservacion || '-' }}</v-col>
        </v-row>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Venta asociada</div>
        <v-row dense align="center">
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Venta:</v-col>
          <v-col cols="12" sm="5" class="font-weight-medium">#{{ pago.pagoOrigenId }}</v-col>
          <v-col cols="12" sm="4" class="text-sm-right">
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-open-in-new"
              :disabled="!origenVentaDisponible"
              @click="irALaVenta"
            >
              Ver venta
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <v-card v-if="!esActivo" class="pa-6" elevation="1">
        <div class="text-subtitle-2 mb-3">Anulación</div>
        <v-row dense>
          <v-col cols="12" sm="4" class="mb-2">
            <div class="text-caption text-medium-emphasis">Fecha de anulación</div>
            <div>{{ formatearFechaHora(pago.pagoFechaAnulacion) }}</div>
          </v-col>
          <v-col cols="12" sm="4" class="mb-2">
            <div class="text-caption text-medium-emphasis">Usuario que anuló</div>
            <div>{{ pago.pagoUsuarioAnulador || '-' }}</div>
          </v-col>
          <v-col cols="12" class="mb-2">
            <div class="text-caption text-medium-emphasis">Motivo de la anulación</div>
            <div>{{ pago.pagoMotivoAnulacion || '-' }}</div>
          </v-col>
        </v-row>
        <v-alert type="info" variant="tonal" class="mt-2">
          La anulación conserva el movimiento de caja y el estado de pago de la venta, tal como lo define el backend.
        </v-alert>
      </v-card>

      <v-alert v-else-if="!esAdministrador" type="info" variant="tonal" class="mt-4">
        Solo un administrador puede anular pagos.
      </v-alert>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import pagoService from '@/services/pagoService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'PagosDetalle',

  data() {
    return {
      pago: null,
      cargando: false,
      anulando: false
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    idPago() {
      return Number(this.$route.params.PagoId)
    },
    esActivo() {
      return Number(this.pago?.pagoEstado) === 1
    },
    esAdministrador() {
      return this.authStore.rol === 'ADMINISTRADOR'
    },
    origenVentaDisponible() {
      return Number(this.pago?.pagoOrigenId) > 0
    },
    documentoCliente() {
      return [this.pago?.terceroTipoDocumento, this.pago?.terceroNumeroDocumento].filter(Boolean).join(' ') || 'sin documento'
    }
  },

  watch: {
    idEmpresa() {
      this.cargar()
    },
    idPago() {
      this.cargar()
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      if (!this.idEmpresa || !this.idPago) {
        await Swal.fire('Error', 'La empresa o el ID del pago no son válidos', 'error')
        this.$router.push({ name: 'PagosList' })
        return
      }

      this.cargando = true
      try {
        const { data } = await pagoService.getById({ idEmpresa: this.idEmpresa, idPago: this.idPago })
        this.pago = data.data || null
        if (!this.pago) {
          await Swal.fire('Error', data.msg || 'No se encontró el pago', 'error')
          this.$router.push({ name: 'PagosList' })
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar el detalle del pago'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.push({ name: 'PagosList' })
      } finally {
        this.cargando = false
      }
    },

    irALaVenta() {
      if (!this.origenVentaDisponible) return
      this.$router.push({
        name: 'VentasDetalle',
        params: { EmpId: this.idEmpresa, VentaId: Number(this.pago.pagoOrigenId) }
      })
    },

    async anular() {
      if (!this.esAdministrador || !this.esActivo) return

      const { value: motivo } = await Swal.fire({
        title: '¿Anular este pago?',
        html: '<p style="text-align:left">Indique el motivo (entre 6 y 255 caracteres):</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 255 },
        showCancelButton: true,
        confirmButtonText: 'Anular pago',
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
        const { data } = await pagoService.anular({
          idEmpresa: this.idEmpresa,
          idPago: this.idPago,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Pago anulado correctamente', 'success')
        await this.cargar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular el pago'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulando = false
      }
    },

    nombreTipoOrigen(tipo) {
      return tipo === 'ABONO_VENTA' ? 'Abono de venta' : tipo === 'CUOTA_VENTA' ? 'Cuota de venta' : tipo || '-'
    },

    nombreMetodo(metodo) {
      return metodo === 'TRANSACCION' ? 'Transacción' : metodo === 'EFECTIVO' ? 'Efectivo' : metodo || '-'
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>
