<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Cuentas por cobrar</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :disabled="!idEmpresa" @click="irANuevo">
        Agregar
      </v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col v-for="estado in resumenEstados" :key="estado.valor" cols="12" sm="4">
        <v-card class="pa-4" elevation="1">
          <div class="text-caption text-medium-emphasis">{{ estado.texto }}</div>
          <div class="text-h6 font-weight-bold">{{ formatearMoneda(sumas[estado.valor]?.pendiente) }}</div>
          <div class="text-caption text-medium-emphasis">
            Original: {{ formatearMoneda(sumas[estado.valor]?.original) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-4 mb-4" elevation="1">
      <v-row dense align="center" class="mb-2">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-account-search"
              size="small"
              variant="tonal"
              title="Buscar cliente"
              @click="dialogTercero = true"
            />
            <v-text-field
              :model-value="terceroFiltro ? terceroFiltro.Nombre : ''"
              label="Tercero"
              placeholder="Todos"
              readonly
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-btn
              v-if="terceroFiltro"
              icon="mdi-close"
              variant="text"
              size="small"
              title="Quitar el filtro de tercero"
              @click="limpiarTercero"
            />
          </div>
        </v-col>
      </v-row>

      <v-row dense align="center">
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filtros.fechaInicio"
            label="Fecha inicial"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filtros.fechaFin"
            label="Fecha final"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filtros.PorVencimiento"
            :items="opcionesPorVencimiento"
            item-title="texto"
            item-value="valor"
            label="El rango aplica a"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
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
        <v-col cols="12" sm="6" md="2">
          <v-btn color="primary" variant="tonal" block :loading="cargando" @click="consultar">
            Consultar
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" md="3">
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
        <v-col cols="12" sm="6" md="3">
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
        <v-col cols="12" md="6" class="text-body-2 text-medium-emphasis">
          El rango debe ser de máximo 94 días. El servidor pagina de 50 registros.
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <div class="tabla-scroll">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Tercero</th>
              <th>Monto original</th>
              <th>Monto pendiente</th>
              <th>Fecha inicio</th>
              <th>Fecha vencimiento</th>
              <th>Tipo origen</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Fecha actualización</th>
              <th class="text-center"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!registros.length">
              <td colspan="10" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <tr
              v-for="registro in registros"
              :key="registro.estcueId"
              :class="{ 'fila-vencida': estaVencida(registro) }"
            >
              <td>{{ registro.estcueTercero }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueMontoOriginal) }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueMontoPendiente) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.estcueFechaInicio) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.estcueFechaVencimiento) }}</td>
              <td>{{ registro.estcueTipoOrigen }}</td>
              <td>
                <v-chip :color="colorEstado(registro.estcueEstado)" size="small" variant="tonal">
                  {{ registro.estcueEstado }}
                </v-chip>
              </td>
              <td>{{ registro.estcueMotivo || '-' }}</td>
              <td class="text-no-wrap">{{ formatearFechaHora(registro.estcueFechaActualizacion) }}</td>
              <td class="text-center">
                <!-- Las cuentas SISTEMA no se editan por /updateestadocuenta -->
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  title="Editar"
                  :disabled="registro.estcueOrigenRegistro !== 'MANUAL'"
                  @click="irAEditar(registro)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="d-flex align-center justify-center pa-4 ga-4">
        <v-btn v-if="pagina > 1" variant="outlined" :disabled="cargando" @click="buscar(pagina - 1)">
          Anterior
        </v-btn>
        <span>Página {{ pagina }} de {{ totalPaginas }} · {{ cantData }} registros</span>
        <v-btn v-if="pagina < totalPaginas" variant="outlined" :disabled="cargando" @click="buscar(pagina + 1)">
          Siguiente
        </v-btn>
      </div>
    </v-card>

    <ClientesSeleccionar
      v-model="dialogTercero"
      :id-empresa="idEmpresa"
      @seleccionar="onTerceroSeleccionado"
    />
  </v-container>
</template>

<script>
import Swal from 'sweetalert2'
import estadoCuentaService from '@/services/estadoCuentaService'
import { useAuthStore } from '@/stores/auth'
import ClientesSeleccionar from '@/views/Clientes/ClientesSeleccionar.vue'

function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function diasInclusivos(fechaInicio, fechaFin) {
  const convertir = (valor) => {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return Date.UTC(anio, mes - 1, dia)
  }
  return Math.floor((convertir(fechaFin) - convertir(fechaInicio)) / 86400000) + 1
}

const SUMAS_VACIAS = {
  PENDIENTE: { original: 0, pendiente: 0 },
  PAGADO: { original: 0, pendiente: 0 },
  ANULADO: { original: 0, pendiente: 0 }
}

export default {
  name: 'CuentasPorCobrarList',

  components: { ClientesSeleccionar },

  data() {
    const hoy = new Date()
    return {
      cargando: false,
      registros: [],
      cantData: 0,
      sumas: { ...SUMAS_VACIAS },
      pagina: 1,
      dialogTercero: false,
      terceroFiltro: null,
      filtros: {
        fechaInicio: aFechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fechaFin: aFechaIso(hoy),
        PorVencimiento: false,
        estadoFiltro: 'TODOS',
        campoOrdenar: 2,
        orden: 'ASC'
      },
      resumenEstados: [
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PAGADO', texto: 'Pagado' },
        { valor: 'ANULADO', texto: 'Anulado' }
      ],
      opcionesPorVencimiento: [
        { valor: false, texto: 'Fecha inicio' },
        { valor: true, texto: 'Fecha vencimiento' }
      ],
      opcionesEstadoFiltro: [
        { valor: 'TODOS', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PAGADO', texto: 'Pagado' },
        { valor: 'ANULADO', texto: 'Anulado' }
      ],
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Fecha inicio' },
        { valor: 2, texto: 'Fecha vencimiento' },
        { valor: 3, texto: 'Monto pendiente' },
        { valor: 4, texto: 'Monto original' }
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
      return Math.max(1, Math.ceil(this.cantData / 50))
    }
  },

  watch: {
    idEmpresa() {
      this.terceroFiltro = null
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

    async buscar(pagina) {
      if (!this.idEmpresa) {
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      if (!this.filtros.fechaInicio || !this.filtros.fechaFin) {
        await Swal.fire('Atención', 'Las dos fechas son obligatorias', 'warning')
        return
      }

      const cantidadDias = diasInclusivos(this.filtros.fechaInicio, this.filtros.fechaFin)
      if (cantidadDias < 1) {
        await Swal.fire('Atención', 'La fecha inicial no puede ser mayor que la fecha final', 'warning')
        return
      }
      if (cantidadDias > 94) {
        await Swal.fire('Atención', 'El rango de fechas no puede superar los 94 días', 'warning')
        return
      }

      this.cargando = true
      try {
        const { data } = await estadoCuentaService.getAllPorCobrar({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
          fechaInicio: this.filtros.fechaInicio,
          fechaFin: this.filtros.fechaFin,
          PorVencimiento: this.filtros.PorVencimiento,
          estadoFiltro: this.filtros.estadoFiltro,
          idTerceroFiltro: this.terceroFiltro ? Number(this.terceroFiltro.Id) : 0
        })
        this.registros = data.data || []
        this.cantData = Number(data.cantData) || 0
        this.sumas = { ...SUMAS_VACIAS, ...(data.sumas || {}) }
        this.pagina = pagina
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo consultar las cuentas por cobrar'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    onTerceroSeleccionado(tercero) {
      this.terceroFiltro = tercero
      this.consultar()
    },

    limpiarTercero() {
      this.terceroFiltro = null
      this.consultar()
    },

    irANuevo() {
      this.$router.push({ name: 'CuentasPorCobrarNuevo' })
    },

    irAEditar(registro) {
      this.$router.push({
        name: 'CuentasPorCobrarEditar',
        params: { EmpId: registro.estcueEmp, EstcueId: registro.estcueId }
      })
    },

    estaVencida(registro) {
      if (['PAGADO', 'ANULADO'].includes(registro.estcueEstado) || !registro.estcueFechaVencimiento) return false
      // Las fechas de la cuenta llegan aaaa-mm-dd: se comparan como texto contra hoy local
      return aFechaIso(new Date()) > String(registro.estcueFechaVencimiento).slice(0, 10)
    },

    colorEstado(estado) {
      return {
        PENDIENTE: 'warning',
        PAGADO: 'success',
        ANULADO: 'error'
      }[estado] || 'default'
    },

    formatearMoneda(valor) {
      return `$ ${Number(valor || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },

    formatearFecha(valor) {
      if (!valor) return '-'
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
      return `${dia}/${mes}/${anio}`
    },

    formatearFechaHora(valor) {
      if (!valor) return '-'
      return new Date(valor).toLocaleString('es-CO')
    }
  }
}
</script>

<style scoped>
.tabla-scroll {
  overflow-x: auto;
}

.tabla-listado :deep(.v-table__wrapper > table > thead > tr > th) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  white-space: nowrap;
  border-bottom: none;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida > td) {
  background-color: #ffebee;
  border-top: 1px solid #ef9a9a;
  border-bottom: 1px solid #ef9a9a;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida > td:first-child) {
  border-left: 4px solid #d32f2f;
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr:hover > td) {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.tabla-listado :deep(.v-table__wrapper > table > tbody > tr.fila-vencida:hover > td) {
  background-color: #ffebee;
}
</style>
