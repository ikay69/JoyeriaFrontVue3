<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Nuevo ajuste de caja</h1>

    <v-card class="pa-6" max-width="560" elevation="1">
      <!--
        Esta pantalla solo da de alta AJUSTES: el sobrante o el faltante que aparece al cuadrar
        la caja. Los movimientos de venta, compra, abono, cuota y gasto los crea su propio
        modulo, no se teclean aqui.
      -->
      <p class="text-caption text-medium-emphasis mb-4">
        Registra un sobrante o un faltante de caja. Los movimientos de ventas, compras, abonos,
        cuotas y gastos los genera su propio módulo.
      </p>

      <v-form ref="form" @submit.prevent="confirmar">
        <v-select
          v-model="tipoMovimiento"
          :items="opcionesTipo"
          item-title="texto"
          item-value="valor"
          label="Tipo de movimiento"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="valor"
          label="Valor"
          type="number"
          step="0.01"
          min="0"
          prefix="$"
          :rules="[reglas.requerido, reglas.mayorQueCero, reglas.cabeEnLaColumna]"
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
          label="Observaciones"
          maxlength="255"
          counter="255"
          rows="3"
          :rules="[reglas.requerido, reglas.minimoSeis]"
          variant="outlined"
          class="mb-2"
        />

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
import movimientoCajaService from '@/services/movimientoCajaService'
import { useAuthStore } from '@/stores/auth'

// Solo alta, sin modo edicion y a proposito: un movimiento de caja no se edita nunca, la unica
// operacion correctiva es anularlo desde el listado. Por eso tampoco hay ruta de editar ni se
// lee la empresa de la URL: al crear, la empresa sale del store, como en los demas Form.
export default {
  name: 'MovimientoCajaForm',

  data() {
    return {
      tipoMovimiento: 'ENTRADA',
      // Se guarda como texto, sin v-model.number: asi lo que el usuario escribio llega intacto a
      // las reglas y el redondeo a dos decimales se hace una sola vez, al enviar.
      valor: '',
      metodoPago: 'EFECTIVO',
      observaciones: '',

      guardando: false,
      opcionesTipo: [
        { valor: 'ENTRADA', texto: 'Entrada' },
        { valor: 'SALIDA', texto: 'Salida' }
      ],
      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      reglas: {
        requerido: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Campo obligatorio',
        mayorQueCero: (v) => Number(v) > 0 || 'El valor debe ser mayor que cero',
        // La columna del backend es decimal(12,2): diez digitos enteros y dos decimales. El tope
        // se comprueba aqui para que el rechazo diga por que, en vez de llegar como un 400 seco.
        cabeEnLaColumna: (v) => Number(v) <= 9999999999.99 || 'El valor excede el máximo permitido',
        minimoSeis: (v) => String(v || '').trim().length >= 6 || 'Escriba al menos 6 caracteres'
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

  methods: {
    async confirmar() {
      // Vuetify 3: validate() es asincrono y devuelve { valid }, no un booleano.
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.guardando = true
      try {
        const { data } = await movimientoCajaService.create({
          idEmpresa: this.idEmpresa,
          TipoMovimiento: this.tipoMovimiento,
          // Se redondea aqui porque la columna es decimal(12,2): asi lo que queda guardado es
          // esto, y no un valor que la base recorta por su cuenta.
          Valor: Math.round(Number(this.valor) * 100) / 100,
          MetodoPago: this.metodoPago,
          Observaciones: this.observaciones.trim()
        })
        // El await es intencional: primero se ve el mensaje, despues se navega.
        await Swal.fire('Éxito', data.msg || 'Ajuste de caja registrado', 'success')
        // Al volver, el List se reconstruye y su created() vuelve a consultar: el grid y los
        // totales ya salen con el movimiento nuevo.
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al registrar el ajuste de caja'
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
