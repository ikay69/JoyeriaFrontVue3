<template>
  <v-dialog v-model="dialogVisible" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Reporte de mora por cliente</span>
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="6">
            <v-select
              v-model="pOrden"
              :items="opcionesOrden"
              item-title="texto"
              item-value="valor"
              label="Ordenar por"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="buscar(1)"
            />
          </v-col>
        </v-row>

        <div class="tabla-contenedor">
          <v-table class="tabla-mora" density="compact">
            <thead>
              <tr>
                <th>Cliente</th>
                <th class="text-end">Empeños en mora</th>
                <th class="text-end">Capital</th>
                <th class="text-end">Intereses</th>
                <th class="text-end">Total deuda</th>
                <th class="text-end">Meses de atraso</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="6" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!filas.length">
                <td colspan="6" class="text-center py-6 text-medium-emphasis">
                  No hay clientes en mora
                </td>
              </tr>
              <tr v-for="fila in filas" :key="fila.terceroId">
                <td>
                  {{ fila.terceroNombre || '-' }}
                  <div class="text-caption text-medium-emphasis">{{ fila.terceroNumeroDoc || '' }}</div>
                </td>
                <td class="text-end">{{ formatearNumero(fila.empenosEnMora) }}</td>
                <td class="text-end">{{ formatearMoneda(fila.capitalTotal) }}</td>
                <td class="text-end">{{ formatearMoneda(fila.interesesAcumulados) }}</td>
                <td class="text-end">{{ formatearMoneda(fila.totalDeuda) }}</td>
                <td class="text-end">{{ formatearNumero(fila.mesesAtrasoMaximo) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="pagina > 1" variant="outlined" @click="buscar(pagina - 1)">Anterior</v-btn>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="buscar(pagina + 1)">Siguiente</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'

export default {
  name: 'EmpenosMoraDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    idEmpresa: { type: [Number, String], default: null }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      cargando: false,
      filas: [],
      cantData: 0,
      pagina: 1,
      pOrden: 'ANTIGUEDAD',
      opcionesOrden: [
        { valor: 'ANTIGUEDAD', texto: 'Antigüedad (más atrasado primero)' },
        { valor: 'MONTO', texto: 'Monto (el que más debe primero)' }
      ]
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
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    modelValue(visible) {
      if (visible) this.buscar(1)
    }
  },

  methods: {
    cerrar() {
      this.dialogVisible = false
    },

    async buscar(pagina) {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await empenoService.getMora({
          idEmpresa,
          pOrden: this.pOrden,
          pagina,
          idTercero: 0
        })
        this.filas = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar el reporte de mora'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    // Los agregados de SQL pueden llegar como cadena: siempre se convierten antes de mostrar.
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
.tabla-contenedor {
  overflow-x: auto;
}

.tabla-mora :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}
</style>
