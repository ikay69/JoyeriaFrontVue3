<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="volver" />
      <div>
        <h1 class="text-h5">
          Movimiento de kardex #{{ idMovimiento }}
          <v-chip
            v-if="movimiento"
            :color="movimiento.movTipo === 'ENTRADA' ? 'success' : 'error'"
            size="small"
            variant="tonal"
            class="ml-2"
          >
            {{ movimiento.movTipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}
          </v-chip>
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Detalle de un movimiento de inventario.
        </p>
      </div>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="movimiento">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Artículo</div>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Artículo:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movArticuloNombre) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">SKU:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movArticuloSku) }}</v-col>
        </v-row>
      </v-card>

      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Movimiento</div>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Fecha:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearFechaHora(movimiento.movFecha) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Bodega:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movBodegaNombre) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Bolsa:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movBolsa) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Propietario:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movPropietarioNombre) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Cantidad:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearCantidad(movimiento.movCantidad) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Costo por unidad:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearMoneda(movimiento.movCosto) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Precio venta total:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ formatearMoneda(movimiento.movPrecioVentaTotal) }}</v-col>
        </v-row>
      </v-card>

      <v-card class="pa-6" elevation="1">
        <div class="text-subtitle-2 mb-3">Origen</div>
        <v-row dense>
          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Motivo:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movMotivo) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Documento de origen:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">
            {{ dato(movimiento.movTipoOrigen) }}
            <span v-if="movimiento.movOrigenId" class="text-medium-emphasis">#{{ movimiento.movOrigenId }}</span>
          </v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Registrado por:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movUsuario) }}</v-col>

          <v-col cols="12" sm="3" class="text-caption text-medium-emphasis">Observaciones:</v-col>
          <v-col cols="12" sm="9" class="font-weight-medium">{{ dato(movimiento.movObservaciones) }}</v-col>
        </v-row>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import movimientoService from '@/services/movimientoService'

// El EmpId y el MovId llegan por la ruta. No hay watch sobre la empresa seleccionada: el
// movimiento pertenece a la empresa de la fila del kardex, no a la que se elija despues.
export default {
  name: 'KardexDetalle',

  data() {
    return {
      movimiento: null,
      cargando: false
    }
  },

  computed: {
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },
    idMovimiento() {
      return Number(this.$route.params.MovId)
    }
  },

  watch: {
    idMovimiento() {
      this.cargar()
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      if (!Number.isInteger(this.idEmpresa) || this.idEmpresa <= 0 ||
          !Number.isInteger(this.idMovimiento) || this.idMovimiento <= 0) {
        await Swal.fire('Error', 'La empresa o el ID del movimiento no son válidos', 'error')
        this.volver()
        return
      }

      this.cargando = true
      this.movimiento = null
      try {
        const { data } = await movimientoService.getById({
          idEmpresa: this.idEmpresa,
          idMovimiento: this.idMovimiento
        })
        this.movimiento = data.data || null
        if (!this.movimiento) {
          await Swal.fire('Error', data.msg || 'No se encontró el movimiento', 'error')
          this.volver()
        }
      } catch (error) {
        // Un id mal formado llega con la forma de express-validator: errors[0].msg
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo cargar el movimiento'
        await Swal.fire('Error', mensaje, 'error')
        this.volver()
      } finally {
        this.cargando = false
      }
    },

    volver() {
      this.$router.back()
    },

    dato(valor) {
      return valor === null || valor === undefined || String(valor).trim() === '' ? '-' : valor
    },

    // movCantidad llega como CADENA con 4 decimales ("1.0000")
    formatearCantidad(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return numero.toLocaleString('es-CO', { maximumFractionDigits: 4 })
    },

    // movCosto y movPrecioVentaTotal llegan como CADENA con 2 decimales, o null
    formatearMoneda(valor) {
      const numero = Number(valor)
      if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '-'
      return `$ ${numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },

    // movFecha llega en ISO UTC con Z; new Date la muestra en hora local
    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>
