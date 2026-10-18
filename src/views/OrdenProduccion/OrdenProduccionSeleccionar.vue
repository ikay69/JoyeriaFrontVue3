<template>
  <v-dialog v-model="dialogVisible" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Seleccionar orden de producción</span>
        <v-btn icon="mdi-close" variant="text" title="Cerrar" @click="cerrar" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filtros.textoFiltro"
              label="Buscar"
              maxlength="255"
              counter="255"
              clearable
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="filtros.fechaInicio"
              label="Fecha inicio"
              type="date"
              clearable
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="filtros.fechaFin"
              label="Fecha fin"
              type="date"
              clearable
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn color="primary" variant="tonal" block @click="consultar">
              Consultar
            </v-btn>
          </v-col>
        </v-row>

        <div style="overflow-x: auto;">
          <v-table class="tabla-listado" density="compact">
            <thead>
              <tr>
                <th class="text-center" style="width: 56px;">Sel.</th>
                <th style="min-width: 90px">Orden</th>
                <th style="min-width: 150px">Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="4" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="!ordenes.length">
                <td colspan="4" class="text-center py-6 text-medium-emphasis">
                  No hay registros para mostrar
                </td>
              </tr>
              <tr v-for="orden in ordenes" :key="orden.ordId">
                <td class="text-center">
                  <v-btn
                    icon="mdi-check-circle-outline"
                    color="success"
                    size="small"
                    variant="text"
                    title="Seleccionar esta orden"
                    @click="seleccionar(orden)"
                  />
                </td>
                <td>#{{ orden.ordId }}</td>
                <td>
                  {{ formatearFecha(orden.ordFecha) }}
                  <div class="text-caption text-medium-emphasis">
                    {{ formatearHora(orden.ordFecha) }}
                  </div>
                </td>
                <td>{{ orden.ordObservaciones || '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="d-flex align-center justify-center pa-4 ga-4">
          <v-btn v-if="pagina > 1" variant="outlined" @click="irPagina(pagina - 1)">
            Anterior
          </v-btn>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <v-btn v-if="pagina < totalPaginas" variant="outlined" @click="irPagina(pagina + 1)">
            Siguiente
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2'
import produccionService from '@/services/produccionService'

function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function filtrosFechaIniciales() {
  const hoy = new Date()
  return {
    fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fechaFin: aFechaIso(hoy)
  }
}

export default {
  name: 'OrdenProduccionSeleccionar',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    idEmpresa: {
      type: [Number, String],
      default: null
    }
  },

  emits: ['update:modelValue', 'seleccionar'],

  data() {
    return {
      cargando: false,
      ordenes: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        ...filtrosFechaIniciales()
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
    totalPaginas() {
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    modelValue(visible) {
      if (visible) {
        this.consultar()
      }
    },
    idEmpresa() {
      if (this.modelValue) {
        this.consultar()
      }
    }
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        this.ordenes = []
        this.cantData = 0
        return
      }

      this.cargando = true
      try {
        const { data } = await produccionService.getAll({
          idEmpresa: this.idEmpresa,
          pagina,
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null,
          textoFiltro: this.filtros.textoFiltro || ''
        })
        this.ordenes = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar las órdenes de producción'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    seleccionar(orden) {
      this.$emit('seleccionar', orden)
      this.cerrar()
    },

    cerrar() {
      this.dialogVisible = false
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleDateString('es-CO')
    },

    formatearHora(valor) {
      if (!valor) return ''
      return new Date(valor).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:first-child) {
  border-top-left-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th:last-child) {
  border-top-right-radius: 4px;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
