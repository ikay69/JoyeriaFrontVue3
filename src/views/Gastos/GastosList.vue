<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Gastos</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
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
        <v-col cols="12" sm="4">
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
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.estadoFiltro"
            :items="opcionesEstado"
            item-title="texto"
            item-value="valor"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtros.tipoGastoFiltro"
            :items="opcionesTipoGasto"
            item-title="tipgasNombre"
            item-value="tipgasId"
            label="Tipo de gasto"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar descripción"
            maxlength="255"
            clearable
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Máx. 255 caracteres"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="12" sm="6">
          <v-select
            v-model="filtros.campoOrdenar"
            :items="opcionesCampoOrdenar"
            item-title="texto"
            item-value="valor"
            label="Campo ordenar"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6">
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
      </v-row>
    </v-card>

    <!-- Totales de gastos -->
    <v-card class="pa-4 mb-4" elevation="1">
      <div v-if="cargando" class="d-flex justify-center py-2">
        <v-progress-circular indeterminate color="primary" size="24" />
      </div>
      <div v-else class="d-flex flex-wrap ga-8 align-center">
        <div>
          <div class="text-caption text-medium-emphasis">Suma Activos</div>
          <div class="text-subtitle-1 font-weight-medium text-success">
            {{ formatearMoneda(sumaActivos) }}
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Suma Anulados</div>
          <div class="text-subtitle-1 font-weight-medium text-error">
            {{ formatearMoneda(sumaAnulados) }}
          </div>
        </div>
      </div>
    </v-card>

    <v-card elevation="1">
      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Gasto</th>
              <th>Descripción</th>
              <th>Método de Pago</th>
              <th class="text-end">Monto</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="7" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!gastos.length">
              <td colspan="7" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="gasto in gastos" :key="gasto.gasId">
              <td>
                {{ formatearFecha(gasto.gasFecha) }}
                <div class="text-caption text-medium-emphasis">
                  {{ formatearHora(gasto.gasFecha) }}
                </div>
              </td>
              <td>
                <v-chip size="small" variant="tonal" color="primary">
                  {{ gasto.gasTipoGasto || 'N/A' }}
                </v-chip>
              </td>
              <td>{{ gasto.gasDescripcion }}</td>
              <td>{{ gasto.gasMetodoPago }}</td>
              <td class="text-end">{{ formatearMoneda(gasto.gasMonto) }}</td>
              <td class="text-center">
                <v-chip :color="gasto.gasEstado === 1 ? 'success' : 'error'" size="small" variant="tonal">
                  {{ gasto.gasEstado === 1 ? 'Activo' : 'Anulado' }}
                </v-chip>
              </td>
              <td class="text-center text-no-wrap">
                <v-btn icon="mdi-eye"  size="small"  variant="text" title="Ver el detalle" @click="verDetalle(gasto)" />
                <v-btn
                  v-if="gasto.gasEstado === 1"
                  icon="mdi-cancel" size="small"  variant="text" color="error" title="Anular el gasto"
                  :loading="anulandoId === gasto.gasId"
                  @click="anular(gasto)"
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
import gastosService from '@/services/gastosService'
import tipoGastoService from '@/services/tipoGastoService'
import { useAuthStore } from '@/stores/auth'

function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export default {
  name: 'GastosList',

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      gastos: [],
      cantData: 0,
      sumaActivos: 0,
      sumaAnulados: 0,
      pagina: 1,
      anulandoId: null,
      opcionesTipoGasto: [],
      filtros: {
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        estadoFiltro: 1, // 0: Todos, 1: Activos, 2: Anulados
        campoOrdenar: 2, // 2 por defecto (FechaCreacion)
        orden: 'DESC',
        textoFiltro: '',
        tipoGastoFiltro: 0 // 0 o ausente trae todos
      },
      opcionesEstado: [
        { valor: 0, texto: 'Todos' },
        { valor: 1, texto: 'Activos' },
        { valor: 2, texto: 'Anulados' }
      ],
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Descripción' },
        { valor: 2, texto: 'Fecha de creación' },
        { valor: 3, texto: 'Monto' }
      ],
      opcionesOrden: [
        { valor: 'ASC', texto: 'Ascendente' },
        { valor: 'DESC', texto: 'Descendente' }
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
      // Paginado fijo de 50 elementos por página
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    idEmpresa() {
      this.cargarTiposGasto()
      this.consultar()
    }
  },

  created() {
    this.cargarTiposGasto()
    this.consultar()
  },

  methods: {
    async cargarTiposGasto() {
      if (!this.idEmpresa) return
      try {
        const { data } = await tipoGastoService.getActivas({ idEmpresa: this.idEmpresa })
        const lista = data.data || []
        // Se añade la opción general "Todos" con tipgasId = 0
        this.opcionesTipoGasto = [{ tipgasId: 0, tipgasNombre: 'Todos los tipos' }, ...lista]
      } catch (error) {
        console.error('No se pudieron cargar los tipos de gasto', error)
      }
    },

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
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.filtros.textoFiltro ? this.filtros.textoFiltro.trim() : null,
          tipoGastoFiltro: Number(this.filtros.tipoGastoFiltro) || 0,
          estadoFiltro: Number(this.filtros.estadoFiltro),
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null
        }

        const { data } = await gastosService.getAll(payload)
        this.gastos = data.data || []
        this.cantData = data.cantData || 0
        this.sumaActivos = data.sumaActivos || 0
        this.sumaAnulados = data.sumaAnulados || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron consultar los gastos'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    irANuevo() {
      this.$router.push({ name: 'GastosNuevo' })
    },

    verDetalle(gasto) {
      this.$router.push({
        name: 'GastosDetalle',
        params: { EmpId: gasto.gasEmp , GasId: gasto.gasId }
      })
    },

    async anular(gasto) {
      const { value: motivo } = await Swal.fire({
        title: '¿Anular este gasto?',
        html: '<p style="text-align:left">Escriba el motivo de la anulación:</p>',
        input: 'textarea',
        inputAttributes: { maxlength: 255 },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c62828',
        inputValidator: (valor) => {
          const texto = String(valor || '').trim()
          if (texto.length < 3) return 'El motivo debe tener al menos 3 caracteres'
          if (texto.length > 255) return 'El motivo no puede superar los 255 caracteres'
          return null
        }
      })

      if (!motivo) return

      this.anulandoId = gasto.gasId
      try {
        const { data } = await gastosService.anular({
          idEmpresa: this.idEmpresa,
          idGasto: gasto.gasId,
          MotivoAnulacion: String(motivo).trim()
        })
        await Swal.fire('Éxito', data.msg || 'Gasto anulado correctamente', 'success')
        await this.buscar(this.pagina)
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudo anular el gasto'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.anulandoId = null
      }
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