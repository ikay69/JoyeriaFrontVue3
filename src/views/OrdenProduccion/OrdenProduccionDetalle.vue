<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="$router.back()" />
      <div class="flex-grow-1">
        <h1 class="text-h5">Orden de producción {{ orden ? '#' + orden.ordId : '' }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Una orden de producción no se edita ni se anula: solo se consulta.
        </p>
      </div>
    </div>

    <div v-if="cargando" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="orden">
      <v-card class="pa-6 mb-4" elevation="1">
        <div class="text-subtitle-2 mb-3">Cabecera</div>
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Fecha</div>
            <div>{{ formatearFechaHora(orden.ordFecha) }}</div>
          </v-col>
          <v-col cols="12" sm="8">
            <div class="text-caption text-medium-emphasis">Observaciones</div>
            <div>{{ orden.ordObservaciones || '-' }}</div>
          </v-col>
        </v-row>
      </v-card>

      <!--
        El backend devuelve ENTRADAS y SALIDAS mezcladas en un solo arreglo `movimientos`. Se
        parten en dos tablas, con lo producido primero: separarlas cumple el orden pedido y
        ademas dice QUE es cada bloque, que una sola tabla ordenada no dice.
      -->
      <v-card
        v-for="bloque in bloques"
        :key="bloque.titulo"
        class="pa-6 mb-4"
        elevation="1"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-subtitle-2">{{ bloque.titulo }}</span>
          <v-chip :color="bloque.color" size="x-small" variant="tonal">{{ bloque.tipo }}</v-chip>
        </div>

        <div style="overflow-x: auto;">
          <v-table density="compact">
            <thead>
              <tr>
                <th style="min-width: 220px">Artículo</th>
                <th style="min-width: 140px">Bodega</th>
                <th style="min-width: 170px">Bolsa</th>
                <th class="text-end" style="min-width: 110px">Cantidad</th>
                <th class="text-end" style="min-width: 140px">Costo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!bloque.movimientos.length">
                <td colspan="5" class="text-center py-6 text-medium-emphasis">
                  Sin movimientos de este tipo
                </td>
              </tr>
              <tr v-for="mov in bloque.movimientos" :key="mov.movId">
                <td>{{ mov.movArticuloNombre || '-' }}</td>
                <!--
                  movBodegaNombre todavia no viene en la respuesta: el backend lo va a agregar.
                  Hasta entonces la celda sale vacia y se llena sola, sin tocar el front.
                -->
                <td>{{ mov.movBodegaNombre || '' }}</td>
                <td>{{ textoBolsa(mov.movBolsa) }}</td>
                <td class="text-end">{{ formatearCantidad(mov.movCantidad) }}</td>
                <td class="text-end">{{ formatearMoneda(mov.movCosto) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="bloque.movimientos.length">
              <tr>
                <td colspan="4" class="text-end font-weight-medium">Total</td>
                <td class="text-end font-weight-medium">{{ formatearMoneda(bloque.total) }}</td>
              </tr>
            </tfoot>
          </v-table>
        </div>
      </v-card>
    </template>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import produccionService from '@/services/produccionService'

// Las mismas dos bolsas del formulario, para que el detalle no diga RECIBIDO_DE_TALLER donde el
// alta dice "Recibido de taller".
const BOLSAS = [
  { valor: 'DISPONIBLE', texto: 'Disponible' },
  { valor: 'RECIBIDO_DE_TALLER', texto: 'Recibido de taller' }
]

export default {
  name: 'OrdenProduccionDetalle',

  data() {
    return {
      orden: null,
      cargando: false
    }
  },

  computed: {
    // De la URL, NO del store: el selector de empresa vive en un v-app-bar persistente que no
    // navega, asi que si el usuario lo cambia con el detalle abierto, la consulta tiene que
    // seguir apuntando a la empresa de ESTA orden. Por eso tampoco hay watch sobre la empresa.
    idEmpresa() {
      return Number(this.$route.params.EmpId)
    },

    idOrden() {
      return Number(this.$route.params.OrdId)
    },

    movimientos() {
      return this.orden && Array.isArray(this.orden.movimientos) ? this.orden.movimientos : []
    },

    // Producido (ENTRADA) primero, consumido (SALIDA) despues.
    bloques() {
      return [
        {
          titulo: 'Artículos producidos',
          tipo: 'ENTRADA',
          color: 'success',
          movimientos: this.movimientos.filter((m) => m.movTipo === 'ENTRADA')
        },
        {
          titulo: 'Artículos consumidos',
          tipo: 'SALIDA',
          color: 'error',
          movimientos: this.movimientos.filter((m) => m.movTipo === 'SALIDA')
        }
      ].map((bloque) => ({
        ...bloque,
        // Se suma en crudo y se redondea UNA sola vez al final: redondear movimiento por
        // movimiento arrastra el centavo cuando los costos traen mas de dos decimales.
        total: Math.round(
          bloque.movimientos.reduce((suma, m) => suma + (Number(m.movCosto) || 0), 0) * 100
        ) / 100
      }))
    }
  },

  created() {
    this.cargar()
  },

  methods: {
    async cargar() {
      this.cargando = true
      try {
        const { data } = await produccionService.getById({
          idEmpresa: this.idEmpresa,
          idOrden: this.idOrden
        })
        this.orden = data.data || null
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo cargar la orden de producción'
        await Swal.fire('Error', mensaje, 'error')
        this.$router.back()
      } finally {
        this.cargando = false
      }
    },

    textoBolsa(valor) {
      const bolsa = BOLSAS.find((b) => b.valor === valor)
      // El respaldo es para una bolsa que el backend agregue y este mapa no conozca todavia.
      return bolsa ? bolsa.texto : String(valor || '-').replace(/_/g, ' ')
    },

    formatearCantidad(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (Number.isNaN(numero)) return String(valor)
      return numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
