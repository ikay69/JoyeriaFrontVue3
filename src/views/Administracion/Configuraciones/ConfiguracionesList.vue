<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Configuraciones</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar por código"
            maxlength="15"
            :disabled="filtros.campoOrdenar !== 1"
            :hint="filtros.campoOrdenar !== 1 ? 'Solo aplica al ordenar por código' : ''"
            persistent-hint
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
            @keyup.enter="consultar"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Ordenar por"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select
            v-model="filtros.orden"
            :items="opcionesOrden"
            item-title="texto"
            item-value="valor"
            label="Orden"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-select
            v-model="filtros.estadoFiltro"
            :items="opcionesEstadoFiltro"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <v-table class="tabla-listado">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Creación</th>
            <th>Modificación</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!configuraciones.length">
            <td colspan="6" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>
          <template v-else>
            <tr v-for="conf in configuraciones" :key="conf.confId">
              <td class="font-weight-medium text-no-wrap">{{ conf.confCodigo }}</td>
              <td>{{ conf.confDescripcion }}</td>
              <td>
                <v-chip :color="conf.confEstado === 1 ? 'success' : 'error'" size="small">
                  {{ conf.confEstado === 1 ? 'Activa' : 'Inactiva' }}
                </v-chip>
              </td>
              <td class="text-no-wrap">{{ formatearFechaHora(conf.confFecCreacion) }}</td>
              <td class="text-no-wrap">{{ formatearFechaHora(conf.confFecModificacion) }}</td>
              <td class="text-center text-no-wrap">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Editar"
                  @click="irAEditar(conf)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  title="Eliminar"
                  :loading="eliminandoId === conf.confId"
                  @click="eliminar(conf)"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>

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
import configuracionService from '@/services/configuracionService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ConfiguracionesList',
  data() {
    return {
      cargando: false,
      eliminandoId: null,
      configuraciones: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 1,
        orden: 'ASC',
        estadoFiltro: 0
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Código' },
        { valor: 2, texto: 'Fecha de creación' },
        { valor: 3, texto: 'Fecha de modificación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesEstadoFiltro: [
        { valor: 0, texto: 'Todas' },
        { valor: 1, texto: 'Activas' },
        { valor: 2, texto: 'Inactivas' }
      ]
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
      // El backend pagina de 50 en 50: este 50 no es arbitrario.
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },
  watch: {
    idEmpresa() {
      this.consultar()
    }
  },
  created() {
    this.consultar()
  },
  methods: {
    // Al cambiar un filtro se vuelve a la pagina 1.
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
        const payload = {
          idEmpresa: Number(this.idEmpresa),
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          estadoFiltro: this.filtros.estadoFiltro
        }
        // textoFiltro solo filtra con campoOrdenar 1; con los otros el backend lo ignora.
        if (this.filtros.campoOrdenar === 1) {
          payload.textoFiltro = String(this.filtros.textoFiltro || '').trim()
        }
        const { data } = await configuracionService.getAll(payload)
        this.configuraciones = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo consultar las configuraciones'), 'error')
      } finally {
        this.cargando = false
      }
    },

    async eliminar(conf) {
      const { isConfirmed } = await Swal.fire({
        title: `¿Eliminar la configuración ${conf.confCodigo}?`,
        text: 'Se borra de forma definitiva y no se puede recuperar. Si solo quiere que deje de aplicar, edítela y póngala inactiva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828'
      })
      if (!isConfirmed) return

      this.eliminandoId = conf.confId
      try {
        const { data } = await configuracionService.delete({
          idEmpresa: conf.confEmp,
          idConfiguracion: conf.confId
        })
        await Swal.fire('Éxito', data.msg || 'Configuración eliminada', 'success')
        // Si se borro la ultima fila de la ultima pagina, el backend recorta la pagina solo.
        await this.buscar(this.pagina)
      } catch (error) {
        Swal.fire('Error', this.mensajeError(error, 'No se pudo eliminar la configuración'), 'error')
      } finally {
        this.eliminandoId = null
      }
    },

    irANuevo() {
      this.$router.push({ name: 'ConfiguracionesNuevo' })
    },

    // La empresa va en la ruta (sale de la fila) para que editar no dependa del selector de la barra.
    irAEditar(conf) {
      this.$router.push({
        name: 'ConfiguracionesEditar',
        params: { EmpId: conf.confEmp, ConfId: conf.confId }
      })
    },

    // Los 400 llegan como {msg} o como {errors:[{msg}]} (express-validator).
    // Los 500 traen el error crudo: se muestra el mensaje generico.
    mensajeError(error, alternativo) {
      if (error.response?.status >= 500) return alternativo
      const respuesta = error.response?.data
      return respuesta?.msg || respuesta?.errors?.[0]?.msg || alternativo
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      const fecha = new Date(valor)
      if (Number.isNaN(fecha.getTime())) return '-'
      return fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
