<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Nuevo gasto</h1>

    <v-card class="pa-6" max-width="560" elevation="1">
      <p class="text-caption text-medium-emphasis mb-4">
        Registre un nuevo gasto especificando el tipo, monto, método de pago y origen correspondiente.
      </p>

      <v-form ref="form" @submit.prevent="confirmar">
        <v-select
          v-model="idTipoGasto"
          :items="listaTiposGasto"
          item-title="tipgasNombre"
          item-value="tipgasId"
          label="Tipo de gasto"
          :rules="[reglas.requerido]"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="monto"
          label="Monto"
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

        <v-select
          v-model="tipoOrigen"
          :items="opcionesTipoOrigen"
          item-title="texto"
          item-value="valor"
          label="Tipo de origen"
          variant="outlined"
          class="mb-2"
        />

        <div v-if="tipoOrigen" class="d-flex align-center ga-2">
          <v-text-field
            v-model="idOrigen"
            label="ID de origen"
            type="number"
            step="1"
            min="1"
            :rules="[reglas.enteroPositivo]"
            variant="outlined"
            class="mb-2 flex-grow-1"
          />
          <v-btn
            v-if="tipoOrigen"
            icon="mdi-magnify"
            color="primary"
            variant="tonal"
            class="mb-2"
            :title="tituloBuscarOrigen"
            :aria-label="tituloBuscarOrigen"
            @click="abrirSelectorOrigen"
          />
        </div>

        <v-textarea
          v-model="descripcion"
          label="Descripción"
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

    <ComprasSeleccionar
      v-model="dialogCompras"
      :id-empresa="idEmpresa"
      :tipo-origen="tipoOrigen"
      @seleccionar="onCompraSeleccionada"
    />

    <VentasSeleccionar
      v-model="dialogVentas"
      :id-empresa="idEmpresa"
      @seleccionar="onVentaSeleccionada"
    />

    <OrdenProduccionSeleccionar
      v-model="dialogProduccion"
      :id-empresa="idEmpresa"
      @seleccionar="onOrdenProduccionSeleccionada"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import gastosService from '@/services/gastosService'
import tipoGastoService from '@/services/tipoGastoService'
import { useAuthStore } from '@/stores/auth'
import ComprasSeleccionar from '@/views/Compras/ComprasSeleccionar.vue'
import VentasSeleccionar from '@/views/Ventas/VentasSeleccionar.vue'
import OrdenProduccionSeleccionar from '@/views/OrdenProduccion/OrdenProduccionSeleccionar.vue'

export default {
  name: 'GastosForm',

  components: { ComprasSeleccionar, VentasSeleccionar, OrdenProduccionSeleccionar },

  data() {
    return {
      idTipoGasto: null,
      monto: '',
      metodoPago: 'EFECTIVO',
      tipoOrigen: null,
      idOrigen: '',
      dialogCompras: false,
      dialogVentas: false,
      dialogProduccion: false,
      descripcion: '',

      listaTiposGasto: [],
      guardando: false,

      opcionesMetodoPago: [
        { valor: 'EFECTIVO', texto: 'Efectivo' },
        { valor: 'TRANSACCION', texto: 'Transacción' }
      ],
      opcionesTipoOrigen: [
        { valor: null, texto: 'Ninguno' },
        { valor: 'CUOTA_COMPRA', texto: 'Cuota de compra' },
        { valor: 'COMPRA', texto: 'Compra' },
        { valor: 'VENTA', texto: 'Venta' },
        { valor: 'PRODUCCION', texto: 'Fundición de material' }
      ],

      reglas: {
        requerido: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Campo obligatorio',
        mayorQueCero: (v) => Number(v) > 0 || 'El valor debe ser mayor que cero',
        cabeEnLaColumna: (v) => Number(v) <= 9999999999.99 || 'El valor excede el máximo permitido',
        minimoSeis: (v) => String(v || '').trim().length >= 6 || 'Escriba al menos 6 caracteres',
        enteroPositivo: (v) => {
          if (!this.tipoOrigen) return true
          if (v === null || v === undefined || String(v).trim() === '') return 'El ID de origen es obligatorio'
          const num = Number(v)
          return (Number.isInteger(num) && num > 0) || 'Debe ser un número entero mayor a cero'
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
    },
    tituloBuscarOrigen() {
      return {
        CUOTA_COMPRA: 'Buscar compra para la cuota',
        COMPRA: 'Buscar compra',
        VENTA: 'Buscar venta',
        PRODUCCION: 'Buscar orden de producción'
      }[this.tipoOrigen] || 'Buscar origen'
    }
  },

  watch: {
    idEmpresa(val) {
      if (val) {
        this.cargarTiposGasto()
      }
    },
    tipoOrigen() {
      this.idOrigen = ''
      this.dialogCompras = false
      this.dialogVentas = false
      this.dialogProduccion = false
    }
  },

  async created() {
    if (this.idEmpresa) {
      await this.cargarTiposGasto()
    }
  },

  methods: {
    async cargarTiposGasto() {
      try {
        const { data } = await tipoGastoService.getActivas({ idEmpresa: this.idEmpresa })
        this.listaTiposGasto = data.data || data || []
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron cargar los tipos de gasto'
        Swal.fire('Error', mensaje, 'error')
      }
    },

    onCompraSeleccionada(compra) {
      this.idOrigen = compra.compraId
    },

    abrirSelectorOrigen() {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      if (this.tipoOrigen === 'COMPRA' || this.tipoOrigen === 'CUOTA_COMPRA') {
        this.dialogCompras = true
      } else if (this.tipoOrigen === 'VENTA') {
        this.dialogVentas = true
      } else if (this.tipoOrigen === 'PRODUCCION') {
        this.dialogProduccion = true
      }
    },

    onVentaSeleccionada(venta) {
      this.idOrigen = venta.ventaId
    },

    onOrdenProduccionSeleccionada(orden) {
      this.idOrigen = orden.ordId
    },

    async confirmar() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      // Validar regla de consistencia: ambos llenos o ambos null
      const tipoOrgVal = this.tipoOrigen ? this.tipoOrigen : null
      const idOrgVal = tipoOrgVal ? Number(this.idOrigen) : null

      if ((tipoOrgVal && !idOrgVal) || (!tipoOrgVal && idOrgVal)) {
        Swal.fire('Atención', 'Tipo de origen e ID de origen deben estar ambos llenos o ambos vacíos', 'warning')
        return
      }

      this.guardando = true
      try {
        const payload = {
          idEmpresa: this.idEmpresa,
          idTipoGasto: Number(this.idTipoGasto),
          Descripcion: this.descripcion.trim(),
          Monto: Math.round(Number(this.monto) * 100) / 100,
          MetodoPago: this.metodoPago,
          TipoOrigen: tipoOrgVal,
          idOrigen: idOrgVal
        }

        const { data } = await gastosService.create(payload)
        await Swal.fire('Éxito', data.msg || 'Gasto registrado correctamente', 'success')
        this.$router.back()
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'Ocurrió un error al registrar el gasto'
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
