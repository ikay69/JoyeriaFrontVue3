<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Órdenes de producción</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANueva">
        Agregar
      </v-btn>
    </div>

    <!--
      Solo tres filtros: este endpoint NO acepta campoOrdenar ni orden, a diferencia de los otros
      once listados. Poner esos dos v-select aqui mostraria al usuario unos controles que no
      viajan en la peticion.
    -->
    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
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
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th style="min-width: 90px">Orden</th>
              <th style="min-width: 150px">Fecha</th>
              <th>Observaciones</th>
              <th class="text-center" style="width: 90px">Detalle</th>
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
            <tr v-for="ord in ordenes" :key="ord.ordId">
              <td>#{{ ord.ordId }}</td>
              <td>
                {{ formatearFecha(ord.ordFecha) }}
                <div class="text-caption text-medium-emphasis">
                  {{ formatearHora(ord.ordFecha) }}
                </div>
              </td>
              <td>{{ ord.ordObservaciones || '-' }}</td>
              <td class="text-center">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  title="Ver el detalle"
                  @click="verDetalle(ord)"
                />
              </td>
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
    </v-card>
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import produccionService from '@/services/produccionService'
import { useAuthStore } from '@/stores/auth'

// El backend quiere AAAA-MM-DD, y lo quiere en la fecha LOCAL. `toISOString()` convierte a UTC
// antes de recortar, asi que en Colombia (UTC-5) a partir de las 7 de la tarde devolveria el dia
// siguiente y el filtro se saltaria las ordenes de la noche.
function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export default {
  name: 'OrdenProduccionList',

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      ordenes: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        // Arranca en el mes en curso: del dia 1 a hoy.
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy)
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
    totalPaginas() {
      // 50 por pagina es el tope del backend, no es configurable.
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    // El selector de empresa vive en un v-app-bar persistente que NO navega, asi que esta
    // pantalla no se remonta al cambiar de empresa: sin este watch el grid seguiria mostrando
    // las ordenes de la empresa anterior.
    idEmpresa() {
      this.consultar()
    }
  },

  created() {
    this.consultar()
  },

  methods: {
    // El boton Consultar SIEMPRE vuelve a la pagina 1: cambiar un filtro y quedarse en la pagina
    // 7 es la forma clasica de ver una tabla vacia sin entender por que.
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      if (!this.idEmpresa) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await produccionService.getAll({
          idEmpresa: this.idEmpresa,
          pagina,
          // Vacio o null es "sin cota por ese lado", y las dos cotas son independientes.
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

    irANueva() {
      this.$router.push({ name: 'OrdenProduccionNueva' })
    },

    // La empresa sale de la propia fila (ordEmpId), no del store: asi el detalle apunta a la
    // empresa del registro aunque el selector de arriba cambie despues de pulsar el ojo.
    verDetalle(ord) {
      this.$router.push({
        name: 'OrdenProduccionDetalle',
        params: { EmpId: ord.ordEmpId || this.idEmpresa, OrdId: ord.ordId }
      })
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
/* El encabezado toma el mismo primary del tema definido en src/plugins/vuetify.js */
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
