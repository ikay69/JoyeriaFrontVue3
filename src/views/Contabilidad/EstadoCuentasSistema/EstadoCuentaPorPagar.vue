<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h5">Cuentas por pagar del sistema</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        :disabled="!idEmpresa || cargando"
        :loading="actualizando"
        @click="actualizar"
      >
        Actualizar
      </v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col v-for="suma in resumenSumas" :key="suma.valor" cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="1">
          <div class="text-caption text-medium-emphasis">{{ suma.texto }}</div>
          <div class="text-h6 font-weight-bold">{{ formatearMoneda(sumas[suma.valor]) }}</div>
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
              title="Buscar proveedor"
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
        <v-col cols="12" sm="6" md="3">
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
        <v-col cols="12" sm="6" md="3">
          <v-btn color="primary" variant="tonal" block :loading="cargando" @click="consultar">
            Consultar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card elevation="1">
      <div class="tabla-scroll">
        <v-table class="tabla-listado" density="compact">
          <thead>
            <tr>
              <th>Tercero</th>
              <th>Subtotal</th>
              <th>Descuento</th>
              <th>Cancelado</th>
              <th>Saldo</th>
              <th>Fecha inicio</th>
              <th>Fecha vencimiento</th>
              <th>Estado</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="9" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!registros.length">
              <td colspan="9" class="text-center py-6 text-medium-emphasis">
                No hay registros para mostrar
              </td>
            </tr>
            <!-- Los Id de las cuentas SISTEMA cambian en cada regeneracion: solo sirven de llave -->
            <tr
              v-for="registro in registros"
              :key="registro.estcueId"
              :class="{ 'fila-vencida': estaVencida(registro) }"
            >
              <td>{{ registro.estcueTercero }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueValorSubtotal) }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueValorDescuento) }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueValorCancelado) }}</td>
              <td class="text-no-wrap text-end">{{ formatearMoneda(registro.estcueValorSaldo) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.estcueFechaInicio) }}</td>
              <td class="text-no-wrap">{{ formatearFecha(registro.estcueFechaVencimiento) }}</td>
              <td>
                <v-chip :color="colorEstado(registro.estcueEstado)" size="small" variant="tonal">
                  {{ registro.estcueEstado }}
                </v-chip>
              </td>
              <td>{{ registro.estcueMotivo || '-' }}</td>
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

    <ProveedoresSeleccionar
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
import ProveedoresSeleccionar from '@/views/Proveedores/ProveedoresSeleccionar.vue'

function aFechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

const SUMAS_VACIAS = {
  ValorSubtotal: 0,
  ValorDescuento: 0,
  ValorCancelado: 0,
  ValorSaldo: 0,
  MontoOriginal: 0,
  MontoPendiente: 0
}

export default {
  name: 'EstadoCuentaPorPagar',

  components: { ProveedoresSeleccionar },

  data() {
    return {
      cargando: false,
      actualizando: false,
      registros: [],
      cantData: 0,
      sumas: { ...SUMAS_VACIAS },
      pagina: 1,
      dialogTercero: false,
      terceroFiltro: null,
      filtros: {
        estadoFiltro: 'TODOS',
        campoOrdenar: 1,
        orden: 'ASC'
      },
      resumenSumas: [
        { valor: 'ValorSubtotal', texto: 'Subtotal' },
        { valor: 'ValorDescuento', texto: 'Descuento' },
        { valor: 'ValorCancelado', texto: 'Cancelado' },
        { valor: 'ValorSaldo', texto: 'Saldo' }
      ],
      // Las cuentas del sistema nunca son ANULADO: el servidor rechaza ese filtro
      opcionesEstadoFiltro: [
        { valor: 'TODOS', texto: 'Todos' },
        { valor: 'PENDIENTE', texto: 'Pendiente' },
        { valor: 'PAGADO', texto: 'Pagado' }
      ],
      opcionesCampoOrdenar: [
        { valor: 1, texto: 'Tercero' },
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

      this.cargando = true
      try {
        const { data } = await estadoCuentaService.getAllPorPagarSistema({
          idEmpresa: this.idEmpresa,
          campoOrdenar: this.filtros.campoOrdenar,
          orden: this.filtros.orden,
          pagina,
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
          'No se pudo consultar las cuentas por pagar del sistema'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.cargando = false
      }
    },

    async actualizar() {
      if (!this.idEmpresa) {
        await Swal.fire('Atención', 'Seleccione una empresa en la barra superior', 'warning')
        return
      }

      const confirmacion = await Swal.fire({
        title: '¿Actualizar las cuentas?',
        text: 'Se vuelven a calcular las cuentas por pagar del sistema desde las compras pendientes.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar'
      })
      if (!confirmacion.isConfirmed) return

      this.actualizando = true
      try {
        const { data } = await estadoCuentaService.updatePorPagarSistema({ idEmpresa: this.idEmpresa })
        await Swal.fire('Listo', data.msg || 'Cuentas por pagar del sistema actualizadas', 'success')
        this.consultar()
      } catch (error) {
        const mensaje = error.response?.data?.msg ||
          error.response?.data?.errors?.[0]?.msg ||
          'No se pudo actualizar las cuentas por pagar del sistema'
        await Swal.fire('Error', mensaje, 'error')
      } finally {
        this.actualizando = false
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

    estaVencida(registro) {
      if (registro.estcueEstado === 'PAGADO' || !registro.estcueFechaVencimiento) return false
      // Las fechas de la cuenta llegan aaaa-mm-dd: se comparan como texto contra hoy local
      return aFechaIso(new Date()) > String(registro.estcueFechaVencimiento).slice(0, 10)
    },

    colorEstado(estado) {
      return {
        PENDIENTE: 'warning',
        PAGADO: 'success'
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
      // Llegan aaaa-mm-dd sin zona: no pasar por new Date()
      const [anio, mes, dia] = String(valor).slice(0, 10).split('-')
      return `${dia}/${mes}/${anio}`
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
