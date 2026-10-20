<template>
  <v-dialog v-model="dialogVisible" max-width="760" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Cuenta y retiro de joyas</span>
        <v-btn icon="mdi-close" variant="text" :disabled="guardando" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <div v-if="cargando" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else-if="cuenta">
          <div class="text-subtitle-2 mb-2">Cuenta del contrato {{ empeno?.empCodigoContrato || '' }}</div>
          <v-row dense class="mb-2">
            <v-col cols="6" sm="3">
              <div class="dato-etiqueta">Saldo capital</div>
              <div class="font-weight-bold">{{ formatearMoneda(cuenta.saldoCapital) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="dato-etiqueta">Interés corriente</div>
              <div class="font-weight-bold">{{ formatearMoneda(cuenta.interesCorriente) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="dato-etiqueta">Períodos vencidos</div>
              <div class="font-weight-bold">{{ periodosVencidos.length }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="dato-etiqueta">Deuda total</div>
              <div class="font-weight-bold">{{ formatearMoneda(cuenta.deudaTotal) }}</div>
            </v-col>
          </v-row>

          <div v-if="periodosVencidos.length" class="tabla-contenedor mb-4">
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-end">N.º</th>
                  <th>Vencimiento</th>
                  <th class="text-end">Interés</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="periodo in periodosVencidos" :key="periodo.numeroPeriodo">
                  <td class="text-end">{{ periodo.numeroPeriodo }}</td>
                  <td>{{ formatearFecha(periodo.fechaVencimiento) }}</td>
                  <td class="text-end">{{ formatearMoneda(periodo.monto) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-1">Joyas que el cliente se lleva</div>
          <p class="text-caption text-medium-emphasis mb-2">
            Debe marcar al menos una. Las que no marque quedan REFINANCIADAS para un contrato nuevo.
          </p>
          <v-alert v-if="!joyas.length" type="warning" variant="tonal" density="compact" class="mb-4">
            El contrato no tiene joyas en custodia.
          </v-alert>
          <v-checkbox
            v-for="joya in joyas"
            :key="joya.id"
            v-model="idsEntregados"
            :value="joya.id"
            density="compact"
            hide-details
          >
            <template #label>
              {{ joya.nombre }} · cant. {{ formatearNumero(joya.cantidad) }} · avalúo {{ formatearMoneda(joya.valorAvaluo) }}
            </template>
          </v-checkbox>

          <v-form ref="form" class="mt-4" @submit.prevent="guardar">
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="valor"
                  label="Valor negociado"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[reglas.valor]"
                  hint="Puede ser 0"
                  persistent-hint
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="metodoPago"
                  :items="opcionesMetodoPago"
                  item-title="texto"
                  item-value="valor"
                  label="Método de pago"
                  :disabled="!(Number(valor) > 0)"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="fechaRetiro"
                  label="Fecha de retiro"
                  type="date"
                  :min="fechaMinima"
                  :max="hoy()"
                  hint="Vacío = hoy"
                  persistent-hint
                  clearable
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>
          </v-form>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" :disabled="guardando" @click="cerrar">Cancelar</v-btn>
        <v-btn
          color="primary"
          :loading="guardando"
          :disabled="guardando || cargando || !cuenta || !joyas.length"
          @click="guardar"
        >
          Retirar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'

export default {
  name: 'EmpenoRetiroDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], default: null },
    empeno: { type: Object, default: null }
  },

  emits: ['update:modelValue', 'guardado'],

  data() {
    return {
      cargando: false,
      guardando: false,
      cuenta: null,
      idsEntregados: [],
      valor: '0',
      metodoPago: 'EFECTIVO',
      fechaRetiro: null,
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      reglas: {
        valor: (valor) => {
          const numero = Number(valor)
          if (valor === '' || valor === null || valor === undefined) return 'Campo obligatorio'
          if (!Number.isFinite(numero) || numero < 0) return 'No puede ser negativo'
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
    joyas() {
      return Array.isArray(this.cuenta?.joyas) ? this.cuenta.joyas : []
    },
    periodosVencidos() {
      return Array.isArray(this.cuenta?.periodosVencidos) ? this.cuenta.periodosVencidos : []
    },
    fechaMinima() {
      return this.empeno?.empFechaInicio ? String(this.empeno.empFechaInicio).slice(0, 10) : undefined
    }
  },

  watch: {
    modelValue(visible) {
      if (visible) this.abrir()
    }
  },

  methods: {
    async abrir() {
      this.cuenta = null
      this.idsEntregados = []
      this.valor = '0'
      this.metodoPago = 'EFECTIVO'
      this.fechaRetiro = null

      const idEmpresa = Number(this.idEmpresa)
      if (!this.empeno || !Number.isInteger(idEmpresa) || idEmpresa <= 0) return

      this.cargando = true
      try {
        const { data } = await empenoService.getCuenta({ idEmpresa, idEmpeno: Number(this.empeno.empId) })
        this.cuenta = data
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar la cuenta del empeño'
        await Swal.fire('Error', mensaje, 'error')
        this.cerrar()
      } finally {
        this.cargando = false
      }
    },

    cerrar() {
      this.dialogVisible = false
    },

    async guardar() {
      if (this.guardando || !this.cuenta) return

      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idsEntregados.length) {
        Swal.fire('Atención', 'Debe marcar al menos una joya para retirar', 'warning')
        return
      }

      const fechaRetiro = this.fechaRetiro || null
      if (fechaRetiro) {
        if (fechaRetiro > this.hoy()) {
          Swal.fire('Atención', 'La fecha de retiro no puede ser futura', 'warning')
          return
        }
        if (this.fechaMinima && fechaRetiro < this.fechaMinima) {
          Swal.fire('Atención', 'La fecha de retiro no puede ser anterior al inicio del contrato', 'warning')
          return
        }
      }

      const valor = Number(this.valor)
      const confirmacion = await Swal.fire({
        title: '¿Confirmar retiro?',
        text: 'Esta operación es irreversible.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, retirar',
        cancelButtonText: 'Cancelar'
      })
      if (!confirmacion.isConfirmed) return

      this.guardando = true
      try {
        const { data } = await empenoService.retirar({
          idEmpresa: Number(this.idEmpresa),
          idEmpeno: Number(this.empeno.empId),
          Valor: valor,
          MetodoPago: valor > 0 ? this.metodoPago : null,
          FechaRetiro: fechaRetiro,
          IdsEntregados: this.idsEntregados.map(Number)
        })
        await Swal.fire({
          title: 'Retiro registrado',
          icon: 'success',
          html: [
            `Estado: <b>${data.estado}</b>`,
            `Deuda previa: ${this.formatearMoneda(data.deudaPrevia)}`,
            `Intereses aplicados: ${this.formatearMoneda(data.interesesAplicados)}`,
            `Capital aplicado: ${this.formatearMoneda(data.capitalAplicado)}`,
            `Saldo final: ${this.formatearMoneda(data.saldoFinal)}`,
            `Saldo perdonado: ${this.formatearMoneda(data.saldoPerdonado)}`,
            `Joyas entregadas: ${data.joyasEntregadas} · refinanciadas: ${data.joyasRefinanciadas}`
          ].join('<br>')
        })
        this.$emit('guardado')
        this.cerrar()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al retirar el empeño'
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

    formatearFecha(valor) {
      if (!valor) return '-'
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number)
      if (!anio || !mes || !dia) return '-'
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO')
    },

    formatearNumero(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })
    },

    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
}
</script>

<style scoped>
.dato-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
  margin-bottom: 0.15rem;
}

.tabla-contenedor {
  overflow-x: auto;
}
</style>
