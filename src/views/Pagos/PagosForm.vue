<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="cancelar" />
      <div>
        <h1 class="text-h5">Registrar pago</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Registre un abono o una cuota para una venta pendiente o parcial.
        </p>
      </div>
    </div>

    <v-card class="pa-6" max-width="760" elevation="1">
      <v-alert type="info" variant="tonal" class="mb-5">
        El tipo de pago debe corresponder al tipo de venta. El cliente se toma de la venta verificada.
      </v-alert>

      <v-form ref="form" @submit.prevent="confirmar">
       

        <div class="d-flex align-center ga-2">
          <v-text-field
            v-model="idVenta"
            label="ID de la venta"
            type="number"
            min="1"
            step="1"
            :loading="verificandoVenta"
            :rules="[reglas.requerido, reglas.enteroPositivo]"
            variant="outlined"
            class="flex-grow-1"
            @keydown.enter.prevent="verificarVenta"
          />
          <v-btn
            icon="mdi-magnify"
            variant="tonal"
            color="primary"
            title="Buscar venta"
            aria-label="Buscar venta"
            :disabled="!idEmpresa"
            @click="dialogVentas = true"
          />
        </div>
        <p class="text-caption text-medium-emphasis mt-n4 mb-4">
          Busque una venta con la lupa o escriba su ID y presione Enter para verificarla.
        </p>

        <v-card v-if="ventaOrigen" variant="tonal" color="primary" class="pa-4 mb-4">
          <div class="text-subtitle-2 mb-2">Venta verificada #{{ ventaOrigen.ventaId }}</div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Cliente:</span>
              {{ ventaOrigen.ventaTercero || '-' }}
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Documento:</span>
              {{ documentoCliente(ventaOrigen) }}
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Tipo de venta:</span>
              {{ ventaOrigen.ventaTipoVenta }}
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">Estado de pago:</span>
              {{ ventaOrigen.ventaEstadoPago || '-' }}
            </v-col>
            <v-col cols="12" sm="6">
              <span class="text-medium-emphasis">ID del cliente:</span>
              {{ ventaOrigen.ventaTerceroId }}
            </v-col>
          </v-row>
        </v-card>

         <v-select
          v-model="tipoOrigen"
          :items="opcionesTipoOrigen"
          item-title="texto"
          item-value="valor"
          label="Tipo de pago"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />
        
        <v-text-field
          v-model="monto"
          label="Monto del pago"
          type="number"
          step="0.01"
          min="0.01"
          max="9999999999.99"
          prefix="$"
          :rules="[reglas.requerido, reglas.mayorQueCero, reglas.montoValido]"
          variant="outlined"
          class="mb-2"
        />

        <v-select
          v-model="metodoPago"
          :items="opcionesMetodoPago"
          item-title="texto"
          item-value="valor"
          label="Método de pago"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea
          v-model="observaciones"
          label="Observaciones (opcional)"
          maxlength="255"
          counter="255"
          rows="3"
          variant="outlined"
          class="mb-2"
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="outlined" :disabled="guardando" @click="cancelar">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" type="submit">Registrar pago</v-btn>
        </div>
      </v-form>
    </v-card>

    <VentasSeleccionarPago
      v-model="dialogVentas"
      :id-empresa="idEmpresa"
      @seleccionar="onVentaSeleccionada"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import pagoService from '@/services/pagoService'
import ventasService from '@/services/ventasService'
import { useAuthStore } from '@/stores/auth'
import VentasSeleccionarPago from '@/views/Ventas/VentasSeleccionarPago.vue'

export default {
  name: 'PagosForm',

  components: { VentasSeleccionarPago },

  data() {
    return {
      tipoOrigen: null,
      idVenta: '',
      ventaOrigen: null,
      dialogVentas: false,
      monto: '',
      metodoPago: 'EFECTIVO',
      observaciones: '',
      verificandoVenta: false,
      guardando: false,
      opcionesTipoOrigen: [
        { valor: 'ABONO_VENTA', texto: 'Abono a venta por abono' },
        { valor: 'CUOTA_VENTA', texto: 'Cuota de venta a crédito' }
      ],
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      reglas: {
        requerido: (valor) => (valor !== null && valor !== undefined && String(valor).trim() !== '') || 'Campo obligatorio',
        enteroPositivo: (valor) => {
          if (valor === null || valor === undefined || String(valor).trim() === '') return 'Ingrese el ID de la venta'
          const numero = Number(valor)
          return (Number.isInteger(numero) && numero > 0) || 'Debe ser un entero mayor que cero'
        },
        mayorQueCero: (valor) => Number(valor) > 0 || 'El monto debe ser mayor que cero',
        montoValido: (valor) => {
          const montoRedondeado = Math.round((Number(valor) + Number.EPSILON) * 100) / 100
          return (Number.isFinite(montoRedondeado) && montoRedondeado > 0 && montoRedondeado <= 9999999999.99) ||
            'El monto debe ser máximo 9.999.999.999,99'
        }
      }
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    idEmpresa() {
      return this.authStore.empresaSeleccionada
    }
  },

  watch: {
    tipoOrigen() {
      this.ventaOrigen = null
      if (this.idVenta) this.verificarVenta()
    },
    idVenta(valor) {
      if (this.ventaOrigen && String(this.ventaOrigen.ventaId) !== String(valor).trim()) {
        this.ventaOrigen = null
      }
    },
    idEmpresa() {
      this.ventaOrigen = null
      this.idVenta = ''
    }
  },

  methods: {
    onVentaSeleccionada(venta) {
      this.idVenta = String(venta.ventaId)
      this.ventaOrigen = null
      if (this.tipoOrigen) this.verificarVenta()
    },

    async verificarVenta() {
      const idVenta = Number(this.idVenta)
      if (!this.idEmpresa) {
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      if (!this.tipoOrigen) {
        await Swal.fire('Atención', 'Seleccione el tipo de pago antes de verificar la venta', 'warning')
        return
      }
      if (!Number.isInteger(idVenta) || idVenta <= 0) {
        await Swal.fire('Atención', 'Ingrese un ID de venta entero mayor que cero', 'warning')
        return
      }

      this.verificandoVenta = true
      this.ventaOrigen = null
      try {
        const { data } = await ventasService.getById({ idEmpresa: this.idEmpresa, idVenta })
        const venta = data.data
        if (!venta) {
          await Swal.fire('Error', data.msg || 'No se encontró la venta', 'error')
          return
        }

        const tipoVentaEsperado = this.tipoOrigen === 'ABONO_VENTA' ? 'POR_ABONO' : 'CREDITO'
        if (Number(venta.ventaEstado) !== 1) {
          await Swal.fire('Atención', 'No se pueden registrar pagos para una venta anulada', 'warning')
          return
        }
        if (venta.ventaTipoVenta !== tipoVentaEsperado) {
          const nombreEsperado = tipoVentaEsperado === 'POR_ABONO' ? 'por abono' : 'a crédito'
          await Swal.fire('Atención', `Este pago solo aplica a una venta ${nombreEsperado}`, 'warning')
          return
        }
        if (String(venta.ventaEstadoPago || '').toUpperCase() === 'COMPLETO') {
          await Swal.fire('Atención', 'La venta ya está pagada por completo', 'warning')
          return
        }
        if (!Number.isInteger(Number(venta.ventaTerceroId)) || Number(venta.ventaTerceroId) <= 0) {
          await Swal.fire('Error', 'La venta no tiene un cliente válido asociado', 'error')
          return
        }

        this.ventaOrigen = venta
        this.idVenta = String(venta.ventaId)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo verificar la venta'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.verificandoVenta = false
      }
    },

    async confirmar() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return
      if (!this.idEmpresa) {
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }
      if (!this.ventaOrigen || Number(this.ventaOrigen.ventaId) !== Number(this.idVenta)) {
        await Swal.fire('Atención', 'Verifique la venta antes de registrar el pago', 'warning')
        return
      }

      const monto = Math.round((Number(this.monto) + Number.EPSILON) * 100) / 100
      this.guardando = true
      try {
        const { data } = await pagoService.create({
          idEmpresa: this.idEmpresa,
          idTercero: Number(this.ventaOrigen.ventaTerceroId),
          TipoOrigen: this.tipoOrigen,
          idOrigen: Number(this.ventaOrigen.ventaId),
          Monto: monto,
          MetodoPago: this.metodoPago,
          Observaciones: this.observaciones.trim() || null
        })

        const pago = data.data
        await Swal.fire('Éxito', data.msg || 'Pago registrado correctamente', 'success')
        if (pago?.pagoId) {
          this.$router.push({
            name: 'PagosDetalle',
            params: { EmpId: this.idEmpresa, PagoId: pago.pagoId }
          })
        } else {
          this.$router.push({ name: 'PagosList' })
        }
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo registrar el pago'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    documentoCliente(venta) {
      return [venta.ventaTerceroTipoDoc, venta.ventaTerceroNumeroDoc].filter(Boolean).join(' ') || '-'
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return '$ 0,00'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    cancelar() {
      this.$router.push({ name: 'PagosList' })
    }
  }
}
</script>
