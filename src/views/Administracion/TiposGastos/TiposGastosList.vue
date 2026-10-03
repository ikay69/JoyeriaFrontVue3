<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Tipos de gastos</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar"
            maxlength="100"
            :disabled="filtros.campoOrdenar === 3"
            :hint="filtros.campoOrdenar === 3 ? 'No aplica al ordenar por fecha de creación' : ''"
            persistent-hint
            clearable
            density="compact"
            variant="outlined"
            hide-details="auto"
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
      <v-table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Fecha de creación</th>
            <th>Usuario</th>
            <th class="text-center">Editar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!tiposGastos.length">
            <td colspan="6" class="text-center py-6 text-medium-emphasis">
              No hay registros para mostrar
            </td>
          </tr>
          <tr v-for="tg in tiposGastos" :key="tg.tipgasId">
            <td>{{ tg.tipgasNombre }}</td>
            <td>{{ tg.tipgasDescripcion }}</td>
            <td>
              <v-chip :color="tg.tipgasEstado === 1 ? 'success' : 'error'" size="small">
                {{ tg.tipgasEstado === 1 ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </td>
            <td>{{ formatearFecha(tg.tipgasFecCreacion) }}</td>
            <td>{{ tg.tipgasUsuario }}</td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="irAEditar(tg.tipgasEmp, tg.tipgasId)"
              />
            </td>
          </tr>
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
import tipoGastoService from '@/services/tipoGastoService'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'TiposGastosList',
  data() {
    return {
      cargando: false,
      tiposGastos: [],
      cantData: 0,
      pagina: 1,
      filtros: {
        textoFiltro: '',
        campoOrdenar: 3,
        orden: 'DESC',
        estadoFiltro: 0
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Nombre' },
        { valor: 2, texto: 'Descripción' },
        { valor: 3, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
      ],
      opcionesEstadoFiltro: [
        { valor: 0, texto: 'Todos' },
        { valor: 1, texto: 'Activos' },
        { valor: 2, texto: 'Inactivos' }
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
  created() {
    this.consultar()
  },
  methods: {
    // Al cambiar un filtro se vuelve a la pagina 1: si no, se consulta la pagina 7 de un
    // resultado que ahora puede tener una sola pagina y la tabla sale vacia.
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
        const { data } = await tipoGastoService.getAll({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro || '',
          estadoFiltro: this.filtros.estadoFiltro
        })
        this.tiposGastos = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo consultar los tipos de gastos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    irANuevo() {
      this.$router.push({ name: 'TiposGastosNuevo' })
    },

    irAEditar(EmpId, TipGasId) {
      this.$router.push({ name: 'TiposGastosEditar', params: { EmpId, TipGasId } })
    },

    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleDateString('es-CO')
    }
  }
}
</script>
