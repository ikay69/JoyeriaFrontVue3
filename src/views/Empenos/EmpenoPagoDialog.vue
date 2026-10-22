<template>
  <v-dialog v-model="dialogVisible" max-width="520" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Registrar pago</span>
        <v-btn icon="mdi-close" variant="text" :disabled="guardando" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div v-if="empeno" class="mb-4">
          <div class="text-body-2">Contrato {{ empeno.empCodigoContrato || '-' }}</div>
          <div class="text-caption text-medium-emphasis">
            Saldo capital: {{ formatearMoneda(empeno.empSaldoCapital) }}
          </div>
        </div>

        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          El pago cubre primero los intereses, periodo por periodo y completos, y lo que sobre baja capital.
          No se puede pagar medio periodo.
        </v-alert>

        <v-form ref="form" @submit.prevent="guardar">
          <v-text-field
            v-model="monto"
            label="Monto total pagado"
            type="number"
            min="0.01"
            step="0.01"
            :rules="[reglas.monto]"
            variant="outlined"
            density="comfortable"
          />
          <v-select
            v-model="metodoPago"
            :items="opcionesMetodoPago"
            item-title="texto"
            item-value="valor"
            label="Método de pago"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="fechaPago"
            label="Fecha de pago"
            type="date"
            :min="fechaMinima"
            :max="hoy()"
            hint="Vacío = hoy. No puede ser futura ni anterior al inicio del contrato."
            persistent-hint
            clearable
            variant="outlined"
            density="comfortable"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" :disabled="guardando" @click="cerrar">Cancelar</v-btn>
        <v-btn color="primary" :loading="guardando" :disabled="guardando" @click="guardar">
          Registrar pago
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'

export default {
  name: 'EmpenoPagoDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], default: null },
    empeno: { type: Object, default: null }
  },

  emits: ['update:modelValue', 'guardado'],

  data() {
    return {
      monto: '',
      metodoPago: 'EFECTIVO',
      fechaPago: null,
      guardando: false,
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      reglas: {
        monto: (valor) => {
          const numero = Number(valor)
          if (valor === '' || valor === null || valor === undefined) return 'Campo obligatorio'
          if (!Number.isFinite(numero) || numero <= 0) return 'Debe ser mayor a cero'
          if (numero > 9999999999.99) return 'Excede el máximo permitido'
          if (Math.abs(numero - Number(numero.toFixed(2))) > 0.0000001) return 'Máximo dos decimales'
          return true
        }
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
    fechaMinima() {
      return this.empeno?.empFechaInicio ? String(this.empeno.empFechaInicio).slice(0, 10) : undefined
    }
  },

  watch: {
    modelValue(visible) {
      if (visible) this.limpiar()
    }
  },

  methods: {
    limpiar() {
      this.monto = ''
      this.metodoPago = 'EFECTIVO'
      this.fechaPago = null
    },

    cerrar() {
      this.dialogVisible = false
    },

    async guardar() {
      if (this.guardando || !this.empeno) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'La empresa indicada no es válida', 'warning')
        return
      }

      const fechaPago = this.fechaPago || null
      if (fechaPago) {
        if (fechaPago > this.hoy()) {
          Swal.fire('Atención', 'La fecha de pago no puede ser futura', 'warning')
          return
        }
        if (this.fechaMinima && fechaPago < this.fechaMinima) {
          Swal.fire('Atención', 'La fecha de pago no puede ser anterior al inicio del contrato', 'warning')
          return
        }
      }

      this.guardando = true
      try {
        const { data } = await empenoService.newPago({
          idEmpresa,
          idEmpeno: Number(this.empeno.empId),
          MontoTotalPagado: Number(this.monto),
          MetodoPago: this.metodoPago,
          FechaPago: fechaPago
        })
        await Swal.fire('Éxito', data.msg || 'Pago registrado', 'success')
        this.$emit('guardado')
        this.cerrar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al registrar el pago'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.guardando = false
      }
    },

    hoy() {
      const ahora = new Date()
      const mes = String(ahora.getMonth() + 1).padStart(2, '0')
      const dia = String(ahora.getDate()).padStart(2, '0')
      return `${ahora.getFullYear()}-${mes}-${dia}`
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
}
</script>
