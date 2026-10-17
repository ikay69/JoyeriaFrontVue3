<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">Empeños</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="irNuevo">
        Agregar
      </v-btn>
    </div>

    <v-card class="pa-4">
      <v-row dense align="center" class="mb-2">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-account-search"
              size="small"
              variant="tonal"
              title="Buscar cliente"
              @click="dialogCliente = true"
            />
            <v-text-field
              :model-value="clienteSeleccionado ? clienteSeleccionado.Nombre : ''"
              label="Cliente"
              placeholder="Todos"
              readonly
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-btn
              v-if="clienteSeleccionado"
              icon="mdi-close"
              variant="text"
              size="small"
              title="Quitar el filtro de cliente"
              @click="limpiarCliente"
            />
          </div>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mb-2">
        <v-col cols="6" sm="3">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Desde"
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
            label="Hasta"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mb-2">
        <v-col cols="12" sm="3">
          <v-text-field
            v-model="filtros.textoFiltro"
            label="Buscar"
            maxlength="50"
            :disabled="!textoFiltroAplica"
            :hint="textoFiltroAplica ? 'Código de contrato, nombre o número de documento' : 'No aplica para este criterio de orden'"
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
        <v-col cols="6" sm="3">
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
        <v-col cols="12" sm="3">
          <v-btn color="primary" variant="tonal" block @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>

      <div style="overflow-x: auto;">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Fecha inicio</th>
              <th class="text-end">Tasa</th>
              <th>Último pago</th>
              <th>Cliente</th>
              <th class="text-end">Monto inicial</th>
              <th class="text-end">Saldo capital</th>
              <th class="text-end">Capital pagado</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!empenos.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr v-for="empeno in empenos" :key="empeno.empId">
              <td>{{ empeno.empCodigoContrato || '-' }}</td>
              <td>{{ formatearFecha(empeno.empFechaInicio) }}</td>
              <td class="text-end">{{ formatearTasa(empeno.empTasa) }}</td>
              <td>{{ formatearFecha(empeno.empFechaUltimoPago) }}</td>
              <td>
                {{ empeno.empTerceroNombre || '-' }}
                <div class="text-caption text-medium-emphasis">
                  {{ empeno.empTerceroTipoDoc || '' }} {{ empeno.empTerceroNumeroDoc || '' }}
                </div>
              </td>
              <td class="text-end">{{ formatearMoneda(empeno.empMontoInicial) }}</td>
              <td class="text-end">{{ formatearMoneda(empeno.empSaldoCapital) }}</td>
              <td class="text-end">{{ formatearMoneda(capitalPagado(empeno)) }}</td>
              <td class="text-center">
                <span v-if="empeno.empEstado === 'ACTIVO'">ACTIVO</span>
                <v-chip
                  v-else-if="empeno.empEstado"
                  :color="colorEstado(empeno.empEstado)"
                  size="small"
                  variant="tonal"
                >
                  {{ empeno.empEstado }}
                </v-chip>
                <span v-else>-</span>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Ver detalle del empeño"
                  @click="irDetalle(empeno)"
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

    <ClientesSeleccionar
      v-model="dialogCliente"
      :id-empresa="idEmpresa"
      @seleccionar="onClienteSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import empenoService from '@/services/empenoService'
import { useAuthStore } from '@/stores/auth'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'

export default {
  name: 'EmpenosList',

  components: { ClientesSeleccionar },

  data() {
    return {
      cargando: false,
      empenos: [],
      cantData: 0,
      pagina: 1,
      dialogCliente: false,
      clienteSeleccionado: null,
      filtros: {
        campoOrdenar: 7,
        orden: 'DESC',
        textoFiltro: '',
        fechaInicio: null,
        fechaFin: null,
        idTercero: 0
      },
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Código de contrato' },
        { valor: 2, texto: 'Nombre del cliente' },
        { valor: 3, texto: 'Número de documento' },
        { valor: 4, texto: 'Monto inicial' },
        { valor: 5, texto: 'Saldo capital' },
        { valor: 6, texto: 'Fecha de inicio' },
        { valor: 7, texto: 'Fecha de creación' }
      ],
      opcionesOrden: [
        { valor: 'DESC', texto: 'Descendente' },
        { valor: 'ASC', texto: 'Ascendente' }
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
      return Math.max(1, Math.ceil(this.cantData / 50))
    },
    textoFiltroAplica() {
      return this.filtros.campoOrdenar >= 1 && this.filtros.campoOrdenar <= 3
    }
  },

  watch: {
    idEmpresa() {
      this.clienteSeleccionado = null
      this.filtros.idTercero = 0
      this.consultar()
    }
  },

  created() {
    this.consultar()
  },

  methods: {
    consultar() {
      this.buscar(1)
    },

    irPagina(pagina) {
      this.buscar(pagina)
    },

    async buscar(pagina) {
      const idEmpresa = Number(this.idEmpresa)
      if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const idTercero = Number(this.filtros.idTercero)
      if (!Number.isInteger(idTercero) || idTercero < 0) {
        Swal.fire('Atención', 'Seleccione un cliente válido', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await empenoService.getAll({
          idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          textoFiltro: this.textoFiltroAplica ? String(this.filtros.textoFiltro || '').slice(0, 50) : '',
          fechaInicio: this.filtros.fechaInicio || null,
          fechaFin: this.filtros.fechaFin || null,
          idTercero
        })
        this.empenos = data.data || []
        this.cantData = data.cantData || 0
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg || 'No se pudieron consultar los empeños'
        Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onClienteSeleccionado(cliente) {
      this.clienteSeleccionado = cliente
      this.filtros.idTercero = Number(cliente.Id)
      this.consultar()
    },

    limpiarCliente() {
      this.clienteSeleccionado = null
      this.filtros.idTercero = 0
      this.consultar()
    },

    irNuevo() {
      this.$router.push({ name: 'EmpenosNuevo' })
    },

    irDetalle(empeno) {
      this.$router.push({
        name: 'EmpenosDetalle',
        params: {
          EmpId: Number(this.idEmpresa),
          EmpenoId: empeno.empId
        }
      })
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      const partes = String(valor).slice(0, 10).split('-')
      if (partes.length !== 3) return '-'
      const [anio, mes, dia] = partes.map(Number)
      if (!anio || !mes || !dia) return '-'
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO')
    },

    formatearTasa(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return String(valor)
      return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })} %`
    },

    formatearMoneda(valor) {
      if (valor === null || valor === undefined || valor === '') return '-'
      const numero = Number(valor)
      if (!Number.isFinite(numero)) return String(valor)
      return `$ ${numero.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    capitalPagado(empeno) {
      const montoInicial = Number(empeno.empMontoInicial)
      const saldoCapital = Number(empeno.empSaldoCapital)
      if (!Number.isFinite(montoInicial) || !Number.isFinite(saldoCapital)) return null
      return Math.round((montoInicial - saldoCapital) * 100) / 100
    },

    colorEstado(estado) {
      return {
        FINALIZADO: 'success',
        ADJUDICADO: 'warning',
        EN_MORA: 'error'
      }[estado]
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
